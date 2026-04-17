import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(req: NextRequest) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return NextResponse.json({ success: false, error: "Razorpay not configured." }, { status: 500 });
    }

    const { payment_id, amount } = await req.json() as { payment_id: string; amount: number };
    if (!payment_id || !amount) {
      return NextResponse.json({ success: false, error: "payment_id and amount are required." }, { status: 400 });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    console.log("[capture-payment] Capturing payment:", payment_id, "amount:", amount);
    const captured = await razorpay.payments.capture(payment_id, amount, "INR");
    console.log("[capture-payment] Captured:", captured.id, "status:", captured.status);

    return NextResponse.json({ success: true, payment: captured });
  } catch (error) {
    console.error("[capture-payment] Error:", error);
    const message = error instanceof Error ? error.message : "Capture failed.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
