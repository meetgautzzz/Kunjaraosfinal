import Razorpay from "razorpay";
import { NextRequest } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { getPlan, type PlanId } from "@/lib/plans";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[verify] Body received:", body);

    // Do NOT trust plan/credits from request body — fetch from Razorpay order
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return Response.json({ error: "Missing required fields." }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    const keyId = process.env.RAZORPAY_KEY_ID;
    console.log("[verify] Secret exists:", !!secret);
    if (!secret || !keyId) {
      return Response.json({ error: "Missing Razorpay credentials" }, { status: 500 });
    }

    // Verify signature first
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    console.log("[verify] razorpay_signature :", razorpay_signature);
    console.log("[verify] generated_signature:", generated_signature);

    if (generated_signature !== razorpay_signature) {
      console.log("[verify] Verification failed", { razorpay_order_id, razorpay_payment_id });
      return Response.json({ error: "Verification failed" }, { status: 400 });
    }

    console.log("[verify] Signature verified for:", razorpay_payment_id);

    // Fetch order from Razorpay to get authoritative plan and amount
    const razorpay = new Razorpay({ key_id: keyId, key_secret: secret });
    const order = await razorpay.orders.fetch(razorpay_order_id);
    console.log("[verify] Order fetched:", { amount: order.amount, notes: order.notes });

    // Determine plan and credits from server-side order data only
    const orderNotes = order.notes as Record<string, string> | null;
    const orderPlan = orderNotes?.plan ?? "basic";

    const resolvedPlan: PlanId = (["basic", "pro", "expert", "enterprise", "test"] as const).includes(orderPlan as PlanId)
      ? (orderPlan as PlanId)
      : "basic";
    const creditsToAdd = getPlan(resolvedPlan).events;

    const supabase = await createClient();
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch existing credits to accumulate (not overwrite)
        const { data: existing } = await supabase
          .from("user_usage")
          .select("credits_added")
          .eq("user_id", user.id)
          .single();

        const existingCredits = (existing?.credits_added as number) ?? 0;
        const totalCredits = existingCredits + creditsToAdd;

        await supabase.from("user_usage").upsert({
          user_id: user.id,
          plan: resolvedPlan,
          credits_added: totalCredits,
          last_payment_id: razorpay_payment_id,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

        console.log("[verify] Credits added for user:", user.id, "plan:", resolvedPlan, "added:", creditsToAdd, "total:", totalCredits);
      }
    }

    return Response.json({ success: true, credits: creditsToAdd, plan: resolvedPlan });
  } catch (error) {
    console.error("[verify] Unexpected error:", error);
    return Response.json({ error: "Unexpected error." }, { status: 500 });
  }
}
