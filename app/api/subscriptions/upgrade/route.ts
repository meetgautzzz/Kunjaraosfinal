import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { billingLimiter, limit, ipFromRequest } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  try {
    const rl = await limit(billingLimiter, `ip:${ipFromRequest(req)}`);
    if (rl) return rl;

    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in to upgrade." }, { status: 401 });

    const admin = getAdminClient();
    if (!admin) return NextResponse.json({ error: "DB admin unavailable." }, { status: 503 });

    // Guard: already active pro
    const { data: existing } = await admin
      .from("user_subscriptions")
      .select("plan, status")
      .eq("user_id", user.id)
      .single();

    if (existing?.plan === "pro" && existing?.status === "active") {
      return NextResponse.json({ error: "Already on Pro plan." }, { status: 400 });
    }

    const keyId     = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const planId    = process.env.RAZORPAY_PRO_PLAN_ID;

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: "Razorpay credentials not configured." }, { status: 500 });
    }
    if (!planId) {
      return NextResponse.json({ error: "RAZORPAY_PRO_PLAN_ID not set. Create a plan in Razorpay dashboard and set the env var." }, { status: 500 });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscription = await (razorpay.subscriptions as any).create({
      plan_id:       planId,
      total_count:   120,        // 10 years — effectively ongoing until cancelled
      quantity:      1,
      customer_notify: 1,
      notes: {
        user_id:    user.id,
        user_email: user.email ?? "",
        plan:       "pro",
      },
    });

    // Upsert subscription record so webhook can find the user by razorpay_sub_id
    await admin.from("user_subscriptions").upsert({
      user_id:          user.id,
      razorpay_sub_id:  subscription.id,
      plan:             "pro",
      status:           "pending",
      updated_at:       new Date().toISOString(),
    }, { onConflict: "user_id" });

    return NextResponse.json({
      success:         true,
      subscription_id: subscription.id,
      payment_link:    subscription.short_url,
    });
  } catch (err) {
    console.error("[subscriptions/upgrade]", err);
    return NextResponse.json({ error: "Failed to create subscription." }, { status: 500 });
  }
}
