import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getAdminClient } from "@/lib/supabase/admin";
import { applyPaymentCredits } from "@/lib/ai/credits";
import { getPlan, type PlanId } from "@/lib/plans";

// Called by Vercel Cron every 10 minutes.
// Also callable manually: POST /api/billing/reconcile
// Authorization: Bearer <CRON_SECRET>
export const maxDuration = 60;

const LOOK_BACK_HOURS = 24;
const MAX_PAYMENTS     = 100; // Razorpay max per page

function resolvePlan(raw: string): PlanId {
  return (["free", "pro"] as const).includes(raw as PlanId)
    ? (raw as PlanId)
    : "free";
}

export async function POST(req: NextRequest) {
  // Auth — accept Vercel's cron header OR our own secret in Authorization.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    const cronHeader = req.headers.get("x-vercel-cron");
    const bearerOk   = authHeader === `Bearer ${cronSecret}`;
    const cronOk     = cronHeader === "1"; // Vercel sets this on cron invocations
    if (!bearerOk && !cronOk) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
  }

  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    console.error("[reconcile] Missing Razorpay credentials.");
    return NextResponse.json({ error: "Razorpay not configured." }, { status: 503 });
  }

  const admin = getAdminClient();
  if (!admin) {
    console.error("[reconcile] Admin client unavailable.");
    return NextResponse.json({ error: "DB admin unavailable." }, { status: 503 });
  }

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  const fromEpoch = Math.floor(Date.now() / 1000) - LOOK_BACK_HOURS * 3600;

  // 1. Fetch recent captured payments from Razorpay.
  let rzpPayments: RazorpayPayment[];
  try {
    const res = await razorpay.payments.all({
      from:  fromEpoch,
      count: MAX_PAYMENTS,
    }) as { items: RazorpayPayment[] };
    rzpPayments = (res.items ?? []).filter((p) => p.status === "captured" && p.order_id);
  } catch (err) {
    console.error("[reconcile] Failed to fetch Razorpay payments:", err);
    return NextResponse.json({ error: "Razorpay fetch failed." }, { status: 502 });
  }

  console.log(`[reconcile] Fetched ${rzpPayments.length} captured payments from Razorpay (last ${LOOK_BACK_HOURS}h).`);

  if (rzpPayments.length === 0) {
    return NextResponse.json({ checked: 0, recovered: [], skipped: [] });
  }

  // 2. Check which payment IDs are already applied in DB.
  const paymentIds = rzpPayments.map((p) => p.id);
  const { data: appliedRows } = await admin
    .from("user_usage")
    .select("last_payment_id")
    .in("last_payment_id", paymentIds);

  const appliedSet = new Set((appliedRows ?? []).map((r) => r.last_payment_id));

  // 3. Reconcile each missed payment.
  const recovered: RecoveredPayment[] = [];
  const skipped:   string[]           = [];

  for (const payment of rzpPayments) {
    if (appliedSet.has(payment.id)) {
      skipped.push(payment.id);
      continue;
    }

    // Fetch order to get user_id + plan from notes.
    let order: RazorpayOrder;
    try {
      order = await razorpay.orders.fetch(payment.order_id) as RazorpayOrder;
    } catch (err) {
      console.error(`[reconcile] Could not fetch order ${payment.order_id} for payment ${payment.id}:`, err);
      continue;
    }

    const notes  = order.notes as Record<string, string> | null;
    const userId = notes?.user_id;
    const plan   = resolvePlan(notes?.plan ?? "basic");

    if (!userId) {
      console.warn(`[reconcile] Payment ${payment.id}: no user_id in order notes — skipping.`);
      continue;
    }

    const credits = getPlan(plan).credits;

    // applyPaymentCredits is idempotent on payment_id via DB unique constraint.
    const result = await applyPaymentCredits({
      userId,
      plan,
      amount:    credits,
      paymentId: payment.id,
    });

    if (!result.ok) {
      console.error(`[reconcile] applyPaymentCredits failed for ${payment.id}:`, result.error);
      continue;
    }

    if (result.idempotent) {
      // Race between cron and webhook — webhook won, nothing to do.
      skipped.push(payment.id);
      continue;
    }

    // Mark subscription active in auth metadata.
    await admin.auth.admin.updateUserById(userId, {
      app_metadata: { subscription_active: true, plan },
    });

    console.log(`[reconcile] RECOVERED payment ${payment.id} — user ${userId} plan=${plan} credits=${credits} total=${result.totalCredits}`);

    recovered.push({
      payment_id: payment.id,
      order_id:   payment.order_id,
      user_id:    userId,
      plan,
      credits_added: credits,
      amount_inr:    payment.amount / 100,
    });
  }

  console.log(`[reconcile] Done. checked=${rzpPayments.length} recovered=${recovered.length} skipped=${skipped.length}`);

  return NextResponse.json({
    checked:   rzpPayments.length,
    recovered,
    skipped_count: skipped.length,
  });
}

// Lightweight types — only the fields we actually use.
interface RazorpayPayment {
  id:       string;
  order_id: string;
  status:   string;
  amount:   number;
}

interface RazorpayOrder {
  id:    string;
  notes: unknown;
}

interface RecoveredPayment {
  payment_id:    string;
  order_id:      string;
  user_id:       string;
  plan:          PlanId;
  credits_added: number;
  amount_inr:    number;
}
