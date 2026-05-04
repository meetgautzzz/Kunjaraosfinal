import Razorpay from "razorpay";
import { NextRequest } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getPlan, type PlanId } from "@/lib/plans";
import { parseJson } from "@/lib/validate";
import { billingLimiter, limit, ipFromRequest } from "@/lib/ratelimit";

// Razorpay IDs look like "pay_XXXX" / "order_XXXX" / hex. Tight length bounds
// plus an allow-listed charset rejects obvious injection noise at the edge.
const RZP_ID  = z.string().min(5).max(64).regex(/^[A-Za-z0-9_\-]+$/);
const RZP_SIG = z.string().min(32).max(256).regex(/^[a-f0-9]+$/i);

const BodySchema = z.object({
  razorpay_payment_id: RZP_ID,
  razorpay_order_id:   RZP_ID,
  razorpay_signature:  RZP_SIG,
});

// Webhook is the sole writer of credits (Razorpay's recommended pattern and
// the only race-free option given non-atomic read-modify-write on user_usage).
// Verify just proves the frontend response is signed by Razorpay for THIS
// order, then briefly waits for the webhook to land so refreshUsage() on the
// client sees fresh credits. If webhook is slow, returns `credited: false`
// and the frontend falls back to a manual refresh.
const WEBHOOK_POLL_TOTAL_MS    = 4000;
const WEBHOOK_POLL_INTERVAL_MS = 400;

export async function POST(req: NextRequest) {
  try {
    const rl = await limit(billingLimiter, `ip:${ipFromRequest(req)}`);
    if (rl) return rl;

    const bodyResult = await parseJson(req, BodySchema);
    if (bodyResult.error) return bodyResult.error;
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = bodyResult.data;

    const secret = process.env.RAZORPAY_KEY_SECRET;
    const keyId = process.env.RAZORPAY_KEY_ID;
    if (!secret || !keyId) {
      return Response.json({ error: "Missing Razorpay credentials" }, { status: 500 });
    }

    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      console.warn("[verify] Signature mismatch", { razorpay_order_id });
      return Response.json({ error: "Verification failed" }, { status: 400 });
    }

    // Order fetch is how we know the plan without trusting the client body.
    const razorpay = new Razorpay({ key_id: keyId, key_secret: secret });
    const order = await razorpay.orders.fetch(razorpay_order_id);
    const orderNotes = order.notes as Record<string, string> | null;
    const orderPlan = orderNotes?.plan ?? "basic";
    const resolvedPlan: PlanId = (["basic", "pro", "test"] as const).includes(orderPlan as PlanId)
      ? (orderPlan as PlanId)
      : "basic";
    const creditsToAdd = getPlan(resolvedPlan).credits;

    // Signature is valid — immediately activate the subscription in app_metadata.
    // The webhook also does this for resilience, but doing it here eliminates the
    // race between payment confirmation and the webhook landing.
    const supabase = await createClient();
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const admin = getAdminClient();
        if (admin) {
          await admin.auth.admin.updateUserById(user.id, {
            app_metadata: { subscription_active: true, plan: resolvedPlan },
          });
        }
      }
    }

    // Brief poll so the frontend's refreshUsage() sees the webhook's write.
    let credited = false;
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const deadline = Date.now() + WEBHOOK_POLL_TOTAL_MS;
        while (Date.now() < deadline) {
          const { data: row } = await supabase
            .from("user_usage")
            .select("last_payment_id")
            .eq("user_id", user.id)
            .single();
          if (row?.last_payment_id === razorpay_payment_id) {
            credited = true;
            break;
          }
          await new Promise((r) => setTimeout(r, WEBHOOK_POLL_INTERVAL_MS));
        }
      }
    }

    console.log("[verify] Verified", { razorpay_payment_id, resolvedPlan, credited });

    return Response.json({
      success:  true,
      plan:     resolvedPlan,
      credits:  creditsToAdd,
      credited,
    });
  } catch (error) {
    console.error("[verify] Unexpected error:", error);
    return Response.json({ error: "Unexpected error." }, { status: 500 });
  }
}
