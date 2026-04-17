import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
    }

    const expected = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (signature !== expected) {
      return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
    }

    const event = JSON.parse(body);
    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

    if (event.event === "order.paid") {
      const order = event.payload?.order?.entity;
      const payment = event.payload?.payment?.entity;
      if (!order || !payment) return NextResponse.json({ received: true });

      const userId = order.notes?.user_id;
      const plan = order.notes?.plan;
      if (!userId || !plan) return NextResponse.json({ received: true });

      await supabase.from("user_subscriptions").upsert({
        user_id: userId,
        razorpay_sub_id: payment.id,
        plan,
        status: "active",
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      await supabase.from("user_usage").upsert({
        user_id: userId,
        plan,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
