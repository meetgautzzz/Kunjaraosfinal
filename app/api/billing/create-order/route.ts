import Razorpay from "razorpay";
import { getPlan } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: "Missing Razorpay keys" }, { status: 500 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const { plan, annual } = await req.json() as { plan: PlanId; annual?: boolean };

    const planData = getPlan(plan ?? "basic");
    const price = annual ? planData.annualPrice : planData.price;
    const amountPaise = price * 100;

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: "order_" + Date.now(),
    });

    return NextResponse.json({
      success: true,
      order,
      order_id: order.id,
      amount: amountPaise,
      currency: "INR",
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("RAZORPAY ERROR:", error);
    return NextResponse.json({ error: "Order creation failed" }, { status: 500 });
  }
}
