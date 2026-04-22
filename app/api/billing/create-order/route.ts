import Razorpay from "razorpay";
import { z } from "zod";
import { getPlan } from "@/lib/plans";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseJson } from "@/lib/validate";
import { billingLimiter, limit, ipFromRequest } from "@/lib/ratelimit";

const BodySchema = z.object({
  plan:   z.enum(["basic", "pro", "expert", "enterprise", "test"]),
  annual: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const rl = await limit(billingLimiter, `ip:${ipFromRequest(req)}`);
    if (rl) return rl;

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret || keyId.startsWith("your_") || keySecret.startsWith("your_")) {
      return NextResponse.json({ error: "Razorpay keys not configured. Add real test keys to .env.local." }, { status: 500 });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    // Require an authenticated user so the webhook can credit the account
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in to subscribe." }, { status: 401 });
    }
    const userId = user.id;

    const bodyResult = await parseJson(req, BodySchema);
    if (bodyResult.error) return bodyResult.error;
    const { plan, annual } = bodyResult.data;

    const planData = getPlan(plan);
    const price = annual ? planData.annualPrice : planData.price;
    const amountPaise = price * 100;

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: "order_" + Date.now(),
      payment_capture: true,
      notes: { plan, user_id: userId },
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
