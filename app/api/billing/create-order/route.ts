import Razorpay from "razorpay";
import { getPlan } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret || keyId.startsWith("your_") || keySecret.startsWith("your_")) {
      return NextResponse.json({ error: "Razorpay keys not configured. Add real test keys to .env.local." }, { status: 500 });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const { plan, annual } = await req.json() as { plan: PlanId | "test"; annual?: boolean };

    let amountPaise: number;
    if (plan === "test") {
      amountPaise = 100; // ₹1
    } else {
      const planData = getPlan((plan ?? "basic") as PlanId);
      const price = annual ? planData.annualPrice : planData.price;
      amountPaise = price * 100;
    }

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: "order_" + Date.now(),
      notes: { plan: plan ?? "basic" },
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
