import Razorpay from "razorpay";
import type { PlanId } from "@/lib/plans";

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const PLAN_IDS: Record<PlanId, string> = {
  basic: process.env.RAZORPAY_PLAN_BASIC!,
  pro: process.env.RAZORPAY_PLAN_PRO!,
  expert: process.env.RAZORPAY_PLAN_EXPERT!,
  enterprise: process.env.RAZORPAY_PLAN_ENTERPRISE!,
};

export function getRazorpayPlanId(planId: PlanId): string {
  const id = PLAN_IDS[planId];
  if (!id) throw new Error(`No Razorpay plan ID configured for: ${planId}`);
  return id;
}
