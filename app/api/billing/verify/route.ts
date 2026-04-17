import { NextRequest } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import type { PlanId } from "@/lib/plans";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[verify] Body received:", body);

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, credits, plan } = body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return Response.json({ error: "Missing required fields." }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    console.log("[verify] Secret exists:", !!secret);
    if (!secret) {
      return Response.json({ error: "Missing Razorpay secret" }, { status: 500 });
    }

    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    console.log("[verify] razorpay_signature :", razorpay_signature);
    console.log("[verify] generated_signature:", generated_signature);

    if (generated_signature !== razorpay_signature) {
      console.log("Verification failed", {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        generated_signature,
      });
      return Response.json({ error: "Verification failed" }, { status: 400 });
    }

    console.log("[verify] Signature verified for:", razorpay_payment_id);

    let creditsToAdd: number;
    if (plan === "basic") creditsToAdd = 10;
    else if (plan === "pro") creditsToAdd = 20;
    else creditsToAdd = credits ?? 10;
    const resolvedPlan: PlanId = (plan === "pro") ? "pro" : "basic";

    const supabase = await createClient();
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("user_usage").upsert({
          user_id: user.id,
          events_used: 0,
          plan: resolvedPlan,
          credits_added: creditsToAdd,
          last_payment_id: razorpay_payment_id,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
        console.log("[verify] Credits added for user:", user.id, "plan:", resolvedPlan, "credits:", creditsToAdd);
      }
    }

    return Response.json({ success: true, credits: creditsToAdd, plan: resolvedPlan });
  } catch (error) {
    console.error("[verify] Unexpected error:", error);
    return Response.json({ error: "Unexpected error." }, { status: 500 });
  }
}
