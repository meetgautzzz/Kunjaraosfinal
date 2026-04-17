import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest("hex");

    if (signature !== expected) {
      return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
    }

    const event = JSON.parse(body);
    const supabase = await createClient();

    const sub = event.payload?.subscription?.entity;
    if (!sub) return NextResponse.json({ received: true });

    const userId = sub.notes?.user_id;
    const plan = sub.notes?.plan;

    if (!userId || !plan) return NextResponse.json({ received: true });

    if (event.event === "subscription.activated" || event.event === "subscription.charged") {
      await supabase.from("user_subscriptions").upsert({
        user_id: userId,
        razorpay_sub_id: sub.id,
        plan,
        status: "active",
        current_period_end: sub.current_end
          ? new Date(sub.current_end * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      await supabase.from("user_usage").upsert({
        user_id: userId,
        plan,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    }

    if (event.event === "subscription.cancelled" || event.event === "subscription.completed") {
      await supabase.from("user_subscriptions")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("user_id", userId);

      await supabase.from("user_usage")
        .update({ plan: "basic", updated_at: new Date().toISOString() })
        .eq("user_id", userId);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
