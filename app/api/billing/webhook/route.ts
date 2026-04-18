import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { getPlan, type PlanId } from "@/lib/plans";

// Service-role client — bypasses RLS, safe for server-to-server use only
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createSupabaseAdmin(url, serviceKey);
}

function resolvePlan(plan: string): PlanId {
  return (["basic", "pro", "expert", "enterprise"] as const).includes(plan as PlanId)
    ? (plan as PlanId)
    : "basic";
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  // 1. Verify webhook signature
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[webhook] RAZORPAY_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
  }

  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(body)
    .digest("hex");

  if (signature !== expected) {
    console.warn("[webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let event: {
    event: string;
    payload: {
      payment?: { entity: { id: string; order_id: string; amount: number; status: string } };
    };
  };

  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  console.log("[webhook] Event received:", event.event);

  // 2. Only handle payment.captured
  if (event.event !== "payment.captured") {
    return NextResponse.json({ received: true });
  }

  const payment = event.payload?.payment?.entity;
  if (!payment) {
    console.warn("[webhook] No payment entity in payload");
    return NextResponse.json({ received: true });
  }

  const { id: paymentId, order_id: orderId, amount, status } = payment;
  console.log("[webhook] payment.captured:", { paymentId, orderId, amount, status });

  // 3. Fetch order from Razorpay to get authoritative plan + user_id from notes
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    console.error("[webhook] Missing Razorpay credentials");
    return NextResponse.json({ error: "Missing Razorpay credentials." }, { status: 503 });
  }

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let order: any;
  try {
    order = await razorpay.orders.fetch(orderId);
  } catch (err) {
    console.error("[webhook] Failed to fetch order:", err);
    return NextResponse.json({ error: "Failed to fetch order." }, { status: 502 });
  }

  const notes = order.notes as Record<string, string> | null;
  const orderPlan = notes?.plan ?? "basic";
  const userId = notes?.user_id;

  console.log("[webhook] Order notes:", { orderPlan, userId, orderAmount: order.amount });

  if (!userId) {
    console.warn("[webhook] No user_id in order notes — cannot credit account:", orderId);
    return NextResponse.json({ received: true });
  }

  // 4. Add credits server-side using service-role client (no auth session needed)
  const admin = getAdminClient();
  if (!admin) {
    console.error("[webhook] Admin client unavailable — set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
  }

  // Idempotency guard: skip if this payment was already processed
  const { data: existing } = await admin
    .from("user_usage")
    .select("credits_added, last_payment_id")
    .eq("user_id", userId)
    .single();

  if (existing?.last_payment_id === paymentId) {
    console.log("[webhook] Payment already processed, skipping:", paymentId);
    return NextResponse.json({ received: true });
  }

  const existingCredits = (existing?.credits_added as number) ?? 0;
  const resolvedPlan = resolvePlan(orderPlan);
  const creditsToAdd = getPlan(resolvedPlan).events;
  const totalCredits = existingCredits + creditsToAdd;

  const { error: upsertError } = await admin.from("user_usage").upsert({
    user_id: userId,
    plan: resolvedPlan,
    credits_added: totalCredits,
    last_payment_id: paymentId,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  if (upsertError) {
    console.error("[webhook] Failed to update user_usage:", upsertError);
    return NextResponse.json({ error: "DB update failed." }, { status: 500 });
  }

  console.log("[webhook] Credits applied:", { userId, resolvedPlan, creditsToAdd, totalCredits, paymentId });
  return NextResponse.json({ received: true });
}
