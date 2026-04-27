// Create a Razorpay order for a credit-pack purchase.
// The webhook at /api/payments/credits handles fulfilment; this endpoint
// only opens the order. Pack id and amount are server-resolved from
// lib/creditPacks.ts so the client cannot tamper with pricing.

import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { parseJson } from "@/lib/validate";
import { getCreditPack } from "@/lib/creditPacks";
import { billingLimiter, limit, ipFromRequest } from "@/lib/ratelimit";

const BodySchema = z.object({
  pack: z.enum(["small", "medium", "large"]),
});

export async function POST(req: NextRequest) {
  const rl = await limit(billingLimiter, `ip:${ipFromRequest(req)}`);
  if (rl) return rl;

  const auth = await requireUser();
  if (auth.error) return auth.error;

  const parsed = await parseJson(req, BodySchema);
  if (parsed.error) return parsed.error;

  const pack = getCreditPack(parsed.data.pack);
  if (!pack) {
    return NextResponse.json({ error: "Unknown pack." }, { status: 400 });
  }

  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    console.error("[credits/order] Missing Razorpay credentials");
    return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
  }

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  let order;
  try {
    order = await razorpay.orders.create({
      amount:   pack.amountInPaise,
      currency: "INR",
      notes: {
        purpose: "credit_pack",
        user_id: auth.user.id,
        pack:    pack.id,
      },
      payment_capture: true,
    });
  } catch (err) {
    console.error("[credits/order] Razorpay order create failed:", err);
    return NextResponse.json({ error: "Could not create order." }, { status: 502 });
  }

  return NextResponse.json({
    orderId:  order.id,
    amount:   pack.amountInPaise,
    currency: "INR",
    keyId,
    pack:     {
      id:      pack.id,
      label:   pack.label,
      credits: pack.credits,
      amount:  pack.amountInr,
    },
  });
}
