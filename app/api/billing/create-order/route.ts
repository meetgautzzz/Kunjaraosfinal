import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Razorpay from "razorpay";
import { getPlan } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

export async function POST(req: NextRequest) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json({ success: false, error: "Payment gateway not configured." }, { status: 500 });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Service unavailable." }, { status: 503 });
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { plan, annual } = await req.json() as { plan: PlanId; annual?: boolean };
    if (!plan) {
      return NextResponse.json({ success: false, error: "Plan is required." }, { status: 400 });
    }

    const planData = getPlan(plan);
    const price = annual ? planData.annualPrice : planData.price;
    const amountPaise = price * 100;

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `kunjara_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: { user_id: user.id, plan, annual: annual ? "true" : "false" },
    });

    return NextResponse.json({
      success: true,
      order_id: order.id,
      amount: amountPaise,
      currency: "INR",
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
