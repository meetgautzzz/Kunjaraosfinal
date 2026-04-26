import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";
import { z } from "zod";
import { getAdminClient } from "@/lib/supabase/admin";
import { getPlan, type PlanId } from "@/lib/plans";

// Razorpay webhook payload shape — we only read the payment entity on
// `payment.captured`. Other event types are acked without schema checks.
const WebhookEventSchema = z.object({
  event: z.string().min(1),
  payload: z.object({
    payment: z.object({
      entity: z.object({
        id:       z.string().min(1),
        order_id: z.string().min(1),
        amount:   z.number(),
        status:   z.string().min(1),
      }),
    }).optional(),
  }),
});

function resolvePlan(plan: string): PlanId {
  return (["basic", "pro", "expert", "test"] as const).includes(plan as PlanId)
    ? (plan as PlanId)
    : "basic";
}

// Timing-safe HMAC comparison. A naive === leaks signature length and
// position of the first mismatched byte via response-time variance, which
// can be enough to forge a signature given enough probes. timingSafeEqual
// requires equal-length buffers, so we length-check first.
function verifySignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  if (signature.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  // Razorpay sends a unique id per webhook delivery — surface it in every
  // log line so retries can be traced and grep'd in prod.
  const eventDeliveryId = req.headers.get("x-razorpay-event-id") ?? "unknown";

  // 1. Verify webhook signature
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[webhook] RAZORPAY_WEBHOOK_SECRET not set — cannot verify signature; rejecting", { eventDeliveryId });
    return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
  }

  if (!verifySignature(body, signature, webhookSecret)) {
    console.warn("[webhook] Invalid signature — rejecting", { eventDeliveryId, hasSignatureHeader: !!signature });
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let rawEvent: unknown;
  try {
    rawEvent = JSON.parse(body);
  } catch {
    console.warn("[webhook] Invalid JSON body", { eventDeliveryId });
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = WebhookEventSchema.safeParse(rawEvent);
  if (!parsed.success) {
    console.warn("[webhook] Schema mismatch", { eventDeliveryId, issues: parsed.error.issues });
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }
  const event = parsed.data;

  console.log("[webhook] Event received", { eventDeliveryId, event: event.event });

  // 2. Only handle payment.captured. Other events are acked so Razorpay
  // doesn't retry them indefinitely.
  if (event.event !== "payment.captured") {
    console.log("[webhook] Ignored non-captured event", { eventDeliveryId, event: event.event });
    return NextResponse.json({ received: true });
  }

  const payment = event.payload?.payment?.entity;
  if (!payment) {
    console.warn("[webhook] payment.captured with no payment entity", { eventDeliveryId });
    return NextResponse.json({ received: true });
  }

  const { id: paymentId, order_id: orderId, amount, status } = payment;
  console.log("[webhook] payment.captured", { eventDeliveryId, paymentId, orderId, amount, status });

  // 3. Fetch order from Razorpay to get authoritative plan + user_id from notes
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    console.error("[webhook] Missing Razorpay credentials — cannot fetch order", { eventDeliveryId, paymentId });
    return NextResponse.json({ error: "Missing Razorpay credentials." }, { status: 503 });
  }

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let order: any;
  try {
    order = await razorpay.orders.fetch(orderId);
  } catch (err) {
    console.error("[webhook] Failed to fetch order from Razorpay", { eventDeliveryId, orderId, err });
    return NextResponse.json({ error: "Failed to fetch order." }, { status: 502 });
  }

  const notes = order.notes as Record<string, string> | null;
  const orderPlan = notes?.plan ?? "basic";
  const userId = notes?.user_id;

  console.log("[webhook] Order resolved", { eventDeliveryId, paymentId, orderPlan, userId, orderAmount: order.amount });

  if (!userId) {
    console.warn("[webhook] No user_id in order notes — cannot credit account", { eventDeliveryId, orderId, paymentId });
    return NextResponse.json({ received: true });
  }

  // 4. Add credits server-side using service-role client (no auth session needed)
  const admin = getAdminClient();
  if (!admin) {
    // getAdminClient already logs which env var is missing.
    return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
  }

  // Idempotency guard, pass 1: read current state. Skips the entire upsert
  // if the payment is already recorded. The conditional WHERE on the write
  // (pass 2 below) is what actually protects against a TOCTOU race when
  // Razorpay retries the same delivery in parallel.
  const { data: existing, error: readErr } = await admin
    .from("user_usage")
    .select("credits_added, last_payment_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (readErr) {
    console.error("[webhook] Failed to read user_usage", { eventDeliveryId, userId, err: readErr.message });
    return NextResponse.json({ error: "DB read failed." }, { status: 500 });
  }

  if (existing?.last_payment_id === paymentId) {
    console.log("[webhook] Payment already processed — skipping (idempotent)", { eventDeliveryId, paymentId, userId });
    return NextResponse.json({ received: true, idempotent: true });
  }

  const existingCredits = (existing?.credits_added as number) ?? 0;
  const resolvedPlan = resolvePlan(orderPlan);
  const creditsToAdd = getPlan(resolvedPlan).events;
  const totalCredits = existingCredits + creditsToAdd;

  // Pass 2: race-safe write.
  // - If the row doesn't exist yet (new user paying first time), insert it.
  //   The unique constraint on user_usage.user_id makes a second concurrent
  //   insert fail with code 23505, which we treat as "another worker won".
  // - If the row exists, conditional update where last_payment_id IS DISTINCT
  //   FROM paymentId. A concurrent winner that already wrote paymentId makes
  //   the UPDATE affect 0 rows — we then re-read and confirm the credit
  //   landed, returning idempotent.
  if (!existing) {
    const { error: insertErr } = await admin.from("user_usage").insert({
      user_id: userId,
      plan: resolvedPlan,
      credits_added: totalCredits,
      last_payment_id: paymentId,
      updated_at: new Date().toISOString(),
    });
    if (insertErr) {
      // 23505 = unique_violation on (user_id) — another worker raced and
      // already inserted. Treat as idempotent success.
      const code = (insertErr as { code?: string }).code;
      if (code === "23505") {
        console.log("[webhook] Concurrent insert won the race — treating as idempotent", { eventDeliveryId, paymentId, userId });
        return NextResponse.json({ received: true, idempotent: true });
      }
      console.error("[webhook] Failed to insert user_usage", { eventDeliveryId, userId, err: insertErr.message });
      return NextResponse.json({ error: "DB insert failed." }, { status: 500 });
    }
  } else {
    // The OR handles legacy/trial rows where last_payment_id is NULL —
    // standard SQL `NULL <> 'x'` evaluates to NULL, not true, which would
    // otherwise exclude those rows from the conditional update.
    const { data: updated, error: updateErr } = await admin
      .from("user_usage")
      .update({
        plan: resolvedPlan,
        credits_added: totalCredits,
        last_payment_id: paymentId,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .or(`last_payment_id.is.null,last_payment_id.neq.${paymentId}`)
      .select("last_payment_id");

    if (updateErr) {
      console.error("[webhook] Failed to update user_usage", { eventDeliveryId, userId, err: updateErr.message });
      return NextResponse.json({ error: "DB update failed." }, { status: 500 });
    }
    if (!updated || updated.length === 0) {
      // Update affected 0 rows → another worker wrote this paymentId in the
      // gap between our read and our write. Confirm and treat as idempotent.
      console.log("[webhook] Update found row already credited by concurrent worker — idempotent", { eventDeliveryId, paymentId, userId });
      return NextResponse.json({ received: true, idempotent: true });
    }
  }

  console.log("[webhook] Credits applied", { eventDeliveryId, userId, resolvedPlan, creditsToAdd, totalCredits, paymentId });
  return NextResponse.json({ received: true });
}
