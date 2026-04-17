import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { razorpay, getRazorpayPlanId } from "@/lib/razorpay";
import type { PlanId } from "@/lib/plans";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { plan } = await req.json() as { plan: PlanId };
    if (!plan) {
      return NextResponse.json({ success: false, error: "Plan is required." }, { status: 400 });
    }

    const planId = getRazorpayPlanId(plan);

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: 12,
      quantity: 1,
      customer_notify: 1,
      notes: { user_id: user.id, plan },
    });

    await supabase.from("user_subscriptions").upsert({
      user_id: user.id,
      razorpay_sub_id: subscription.id,
      plan,
      status: "created",
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    return NextResponse.json({
      success: true,
      subscription_id: subscription.id,
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
