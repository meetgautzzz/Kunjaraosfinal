// Credit-pack purchase webhook. Razorpay POSTs here on payment.captured
// for any order tagged with notes.purpose = "credit_pack".
//
// Security model (mirrors /api/billing/webhook):
//  1. HMAC-SHA256 signature verified with timing-safe compare against
//     RAZORPAY_WEBHOOK_SECRET. Reject on mismatch.
//  2. Order fetched server-to-server from Razorpay — never trust the
//     client. user_id, pack id, and credits are derived from order.notes.
//  3. Paid amount must match the catalogue (lib/creditPacks.ts) — defends
//     against tampered amounts and lets us reject "₹1 buy 60 credits"
//     attempts even if signed.
//  4. Atomic apply via apply_credit_pack RPC — UNIQUE on payment_id +
//     SELECT FOR UPDATE on user_usage prevents double crediting under
//     parallel webhook retries.
//  5. Every step logs with eventDeliveryId + paymentId + userId for
//     prod traceability.

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";
import { z } from "zod";
import { applyCreditPack } from "@/lib/ai/credits";
import { resolvePackFromAmount } from "@/lib/creditPacks";

const WebhookEventSchema = z.object({
  event: z.string().min(1),
  payload: z.object({
    payment: z.object({
      entity: z.object({
        id:       z.string().min(1),
        order_id: z.string().min(1),
        amount:   z.number(),   // paise
        status:   z.string().min(1),
      }),
    }).optional(),
  }),
});

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
  const signature       = req.headers.get("x-razorpay-signature");
  const eventDeliveryId = req.headers.get("x-razorpay-event-id") ?? "unknown";

  // 1. Signature
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[credits-webhook] RAZORPAY_WEBHOOK_SECRET not set", { eventDeliveryId });
    return NextResponse.json({ success: false, error: "WEBHOOK_NOT_CONFIGURED", message: "Webhook not configured." }, { status: 503 });
  }
  if (!verifySignature(body, signature, webhookSecret)) {
    console.warn("[credits-webhook] Invalid signature", { eventDeliveryId, hasSignatureHeader: !!signature });
    return NextResponse.json({ success: false, error: "INVALID_SIGNATURE", message: "Invalid signature." }, { status: 400 });
  }

  // 2. Parse
  let raw: unknown;
  try {
    raw = JSON.parse(body);
  } catch {
    console.warn("[credits-webhook] Invalid JSON body", { eventDeliveryId });
    return NextResponse.json({ success: false, error: "INVALID_JSON", message: "Invalid JSON." }, { status: 400 });
  }
  const parsed = WebhookEventSchema.safeParse(raw);
  if (!parsed.success) {
    console.warn("[credits-webhook] Schema mismatch", { eventDeliveryId, issues: parsed.error.issues });
    return NextResponse.json({ success: false, error: "SCHEMA_MISMATCH", message: "Invalid webhook payload." }, { status: 400 });
  }

  const event = parsed.data;
  console.log("[credits-webhook] Event received", { eventDeliveryId, event: event.event });

  // 3. Only handle payment.captured
  if (event.event !== "payment.captured") {
    return NextResponse.json({ success: true, ignored: event.event });
  }

  const payment = event.payload?.payment?.entity;
  if (!payment) {
    console.warn("[credits-webhook] payment.captured with no entity", { eventDeliveryId });
    return NextResponse.json({ success: true });
  }

  const { id: paymentId, order_id: orderId, amount: amountInPaise, status } = payment;
  console.log("[credits-webhook] payment.captured", { eventDeliveryId, paymentId, orderId, amountInPaise, status });

  // 4. Server-to-server fetch — order.notes is the trust boundary.
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    console.error("[credits-webhook] Missing Razorpay credentials", { eventDeliveryId, paymentId });
    return NextResponse.json({ success: false, error: "MISSING_CREDENTIALS", message: "Razorpay credentials missing." }, { status: 503 });
  }
  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let order: any;
  try {
    order = await razorpay.orders.fetch(orderId);
  } catch (err) {
    console.error("[credits-webhook] Failed to fetch order from Razorpay", { eventDeliveryId, orderId, err });
    return NextResponse.json({ success: false, error: "ORDER_FETCH_FAILED", message: "Failed to fetch order." }, { status: 502 });
  }

  const notes = (order.notes ?? {}) as Record<string, string>;
  const purpose = notes.purpose;
  const userId  = notes.user_id;
  const claimedPackId = notes.pack;

  // Only handle credit-pack purchases. Subscription payments belong to
  // /api/billing/webhook — ignore them here so a single webhook URL can
  // route both if you ever decide to consolidate.
  if (purpose !== "credit_pack") {
    console.log("[credits-webhook] Ignored — not a credit_pack order", { eventDeliveryId, paymentId, purpose });
    return NextResponse.json({ success: true, ignored: "not_credit_pack" });
  }

  if (!userId) {
    console.warn("[credits-webhook] No user_id in order notes", { eventDeliveryId, orderId, paymentId });
    return NextResponse.json({ success: true, ignored: "no_user_id" });
  }

  // 5. Resolve pack by AMOUNT (not by claimed pack id) — this is the
  // key anti-tamper check. If somebody altered notes.pack to "large"
  // but only paid for "small", the resolution by amount catches it.
  const pack = resolvePackFromAmount(amountInPaise);
  if (!pack) {
    console.error("[credits-webhook] Paid amount does not match any credit pack", {
      eventDeliveryId, paymentId, amountInPaise, claimedPackId,
    });
    return NextResponse.json({ success: false, error: "AMOUNT_MISMATCH", message: "Paid amount does not match any credit pack." }, { status: 400 });
  }

  if (claimedPackId && claimedPackId !== pack.id) {
    console.warn("[credits-webhook] Claimed pack id differs from amount-resolved pack — using amount-resolved", {
      eventDeliveryId, paymentId, claimedPackId, resolvedPack: pack.id,
    });
  }

  // 6. Atomic apply.
  const result = await applyCreditPack({
    userId,
    credits:   pack.credits,
    amount:    pack.amountInr,
    paymentId,
    pack:      pack.id,
  });

  if (!result.ok) {
    console.error("[credits-webhook] applyCreditPack failed", { eventDeliveryId, paymentId, userId, err: result.error });
    return NextResponse.json({ success: false, error: "DB_ERROR", message: "Could not apply credits." }, { status: 500 });
  }

  if (result.idempotent) {
    console.log("[credits-webhook] Already applied — idempotent", {
      eventDeliveryId, paymentId, userId, transactionId: result.transactionId, newBalance: result.newBalance,
    });
    return NextResponse.json({
      success:        true,
      idempotent:     true,
      credits_added:  pack.credits,
      new_balance:    result.newBalance,
      transaction_id: result.transactionId,
    });
  }

  console.log("[credits-webhook] Credits granted", {
    eventDeliveryId, paymentId, userId, pack: pack.id,
    creditsAdded: pack.credits, newBalance: result.newBalance, transactionId: result.transactionId,
  });

  return NextResponse.json({
    success:        true,
    credits_added:  pack.credits,
    new_balance:    result.newBalance,
    transaction_id: result.transactionId,
  });
}
