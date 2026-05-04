import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";
import { z } from "zod";
import { applyPaymentCredits } from "@/lib/ai/credits";
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
  return (["basic", "pro"] as const).includes(plan as PlanId)
    ? (plan as PlanId)
    : "basic";
}

const VALID_PLANS = new Set<PlanId>(["basic", "pro"]);

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

  // 4. Apply credits via the atomic billing RPC. Single round-trip handles
  // idempotency (on payment_id), plan stamp, credit grant, and the
  // race against parallel Razorpay retries. SECURITY DEFINER inside the
  // function does SELECT FOR UPDATE so two concurrent calls cannot both
  // grant credits for the same payment.
  const resolvedPlan = resolvePlan(orderPlan);
  if (!VALID_PLANS.has(resolvedPlan)) {
    console.warn("[webhook] Unknown plan in order notes — defaulting to basic", { eventDeliveryId, orderPlan });
  }
  const creditsToAdd = getPlan(resolvedPlan).credits;

  const result = await applyPaymentCredits({
    userId,
    plan:      resolvedPlan,
    amount:    creditsToAdd,
    paymentId,
  });

  if (!result.ok) {
    console.error("[webhook] applyPaymentCredits failed", { eventDeliveryId, userId, paymentId, err: result.error });
    return NextResponse.json({ error: "DB write failed." }, { status: 500 });
  }

  if (result.idempotent) {
    console.log("[webhook] Payment already applied — idempotent", { eventDeliveryId, paymentId, userId, totalCredits: result.totalCredits });
    return NextResponse.json({ received: true, idempotent: true });
  }

  // Activate subscription in auth.users app_metadata so middleware can gate access.
  const admin = getAdminClient();
  if (admin) {
    const { error: metaErr } = await admin.auth.admin.updateUserById(userId, {
      app_metadata: { subscription_active: true, plan: resolvedPlan },
    });
    if (metaErr) {
      console.error("[webhook] Failed to set subscription_active", { eventDeliveryId, userId, err: metaErr.message });
    }
  }

  console.log("[webhook] Credits applied + subscription activated", { eventDeliveryId, userId, resolvedPlan, creditsToAdd, totalCredits: result.totalCredits, paymentId });
  return NextResponse.json({ received: true });
}
