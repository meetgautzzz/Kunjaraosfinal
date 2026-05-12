import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminClient } from "@/lib/supabase/admin";
import { sendEmail, getPlannerEmail } from "@/lib/email";

function verifySignature(body: string, sig: string | null, secret: string): boolean {
  if (!sig) return false;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  if (sig.length !== expected.length) return false;
  try { return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)); }
  catch { return false; }
}

function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * 86_400_000);
}

export async function POST(req: NextRequest) {
  const body      = await req.text();
  const sig       = req.headers.get("x-razorpay-signature");
  const deliveryId = req.headers.get("x-razorpay-event-id") ?? "unknown";

  const secret = process.env.RAZORPAY_SUBSCRIPTION_WEBHOOK_SECRET ?? process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[sub-webhook] No webhook secret configured", { deliveryId });
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  if (!verifySignature(body, sig, secret)) {
    console.warn("[sub-webhook] Bad signature", { deliveryId });
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let event: { event: string; payload?: Record<string, unknown> };
  try { event = JSON.parse(body); }
  catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }

  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "DB unavailable." }, { status: 503 });

  const subEntity = (event.payload?.subscription as Record<string, unknown> | undefined)?.entity as Record<string, unknown> | undefined;
  const payEntity = (event.payload?.payment     as Record<string, unknown> | undefined)?.entity as Record<string, unknown> | undefined;

  const razorpaySubId = subEntity?.id as string | undefined;
  if (!razorpaySubId) {
    console.log("[sub-webhook] No subscription entity, ignoring", { event: event.event, deliveryId });
    return NextResponse.json({ received: true });
  }

  // Resolve user by razorpay_sub_id
  const { data: subRow } = await admin
    .from("user_subscriptions")
    .select("user_id, plan, status, retry_count")
    .eq("razorpay_sub_id", razorpaySubId)
    .single();

  if (!subRow) {
    console.warn("[sub-webhook] No user_subscriptions row for sub", { razorpaySubId, deliveryId });
    return NextResponse.json({ received: true });
  }

  const userId = subRow.user_id as string;
  const email  = await getPlannerEmail(userId);

  console.log("[sub-webhook]", { event: event.event, userId, razorpaySubId, deliveryId });

  // ── subscription.charged ──────────────────────────────────────────────────
  if (event.event === "subscription.charged") {
    const now        = new Date();
    const periodEnd  = addDays(now, 30);
    const amount     = payEntity?.amount as number | undefined ?? 300000;
    const payId      = payEntity?.id as string | undefined;

    await admin.from("user_subscriptions").update({
      plan:                 "pro",
      status:               "active",
      current_period_start: now.toISOString(),
      current_period_end:   periodEnd.toISOString(),
      retry_count:          0,
      updated_at:           now.toISOString(),
    }).eq("razorpay_sub_id", razorpaySubId);

    // Stamp plan on user_usage so proposal gate reads it
    await admin.from("user_usage").upsert({
      user_id:     userId,
      plan:        "pro",
      updated_at:  now.toISOString(),
    }, { onConflict: "user_id" });

    // Stamp app_metadata for auth-layer gating
    await admin.auth.admin.updateUserById(userId, {
      app_metadata: { subscription_active: true, plan: "pro" },
    }).catch((e) => console.error("[sub-webhook] meta update failed", e));

    // Record invoice
    await admin.from("subscription_invoices").insert({
      user_id:          userId,
      razorpay_sub_id:  razorpaySubId,
      razorpay_pay_id:  payId,
      amount,
      status:           "paid",
      period_start:     now.toISOString(),
      period_end:       periodEnd.toISOString(),
      paid_at:          now.toISOString(),
    });

    // Email receipt
    if (email) {
      const nextDate = periodEnd.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
      await sendEmail({
        to:      email,
        subject: `Payment received — Kunjara OS Pro`,
        html: `<p>Hi,</p>
<p>Your Kunjara OS Pro subscription payment of ₹${(amount / 100).toLocaleString("en-IN")} has been received.</p>
<p>Your next charge date is <strong>${nextDate}</strong>.</p>
<p>Thanks for being a Pro member!<br/>— Kunjara OS Team</p>`,
      });
    }

    console.log("[sub-webhook] subscription.charged — user upgraded to pro", { userId, amount, deliveryId });
    return NextResponse.json({ received: true });
  }

  // ── subscription.cancelled ────────────────────────────────────────────────
  if (event.event === "subscription.cancelled") {
    const now = new Date();

    await admin.from("user_subscriptions").update({
      status:     "cancelled",
      updated_at: now.toISOString(),
    }).eq("razorpay_sub_id", razorpaySubId);

    await admin.from("user_usage").update({
      plan:        "free",
      events_used: 0,
      updated_at:  now.toISOString(),
    }).eq("user_id", userId);

    await admin.auth.admin.updateUserById(userId, {
      app_metadata: { subscription_active: false, plan: "free" },
    }).catch((e) => console.error("[sub-webhook] meta update failed", e));

    if (email) {
      await sendEmail({
        to:      email,
        subject: "Subscription cancelled — Kunjara OS",
        html: `<p>Hi,</p>
<p>Your Kunjara OS Pro subscription has been cancelled.</p>
<p>You've been moved back to the <strong>Free plan</strong> (2 proposals/month).</p>
<p>You can resubscribe any time from your dashboard.<br/>— Kunjara OS Team</p>`,
      });
    }

    console.log("[sub-webhook] subscription.cancelled — downgraded to free", { userId, deliveryId });
    return NextResponse.json({ received: true });
  }

  // ── subscription.halted (payment failed repeatedly) ───────────────────────
  if (event.event === "subscription.halted" || event.event === "subscription.payment.failed") {
    const retryCount = (subRow.retry_count as number ?? 0) + 1;
    const now = new Date();

    const updates: Record<string, unknown> = {
      retry_count: retryCount,
      updated_at:  now.toISOString(),
    };

    if (retryCount >= 3) {
      updates.status = "paused";
      // Downgrade after 3 failures
      await admin.from("user_usage").update({ plan: "free", updated_at: now.toISOString() }).eq("user_id", userId);
      await admin.auth.admin.updateUserById(userId, {
        app_metadata: { subscription_active: false, plan: "free" },
      }).catch(() => null);
    }

    await admin.from("user_subscriptions").update(updates).eq("razorpay_sub_id", razorpaySubId);

    // Record failed invoice
    const amount = payEntity?.amount as number | undefined ?? 300000;
    await admin.from("subscription_invoices").insert({
      user_id:         userId,
      razorpay_sub_id: razorpaySubId,
      amount,
      status:          "failed",
    });

    if (email) {
      const msg = retryCount >= 3
        ? "After 3 failed attempts, your account has been moved to the Free plan."
        : `We'll retry in 3 days. Attempt ${retryCount} of 3.`;

      await sendEmail({
        to:      email,
        subject: "Payment failed — Kunjara OS Pro",
        html: `<p>Hi,</p>
<p>We couldn't process your Kunjara OS Pro subscription payment.</p>
<p>${msg}</p>
<p>Please update your payment method in your dashboard.<br/>— Kunjara OS Team</p>`,
      });
    }

    console.log("[sub-webhook] payment failed", { userId, retryCount, deliveryId });
    return NextResponse.json({ received: true });
  }

  // All other events: ack and ignore
  console.log("[sub-webhook] Ignored event", { event: event.event, deliveryId });
  return NextResponse.json({ received: true });
}
