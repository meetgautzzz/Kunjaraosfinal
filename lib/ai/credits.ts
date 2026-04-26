// Credit math + atomic consumption.
//
// One "credit" in our system = one AI generation. Today the storage column
// is `user_usage.events_used` against `credits_added`; remaining is the
// difference. The DB function consume_ai_credits() does the SELECT FOR
// UPDATE that prevents two concurrent calls from both passing the limit
// check and both deducting.

import "server-only";
import { getAdminClient } from "@/lib/supabase/admin";
import type { ActionType } from "@/lib/ai/router";

const BASE_COST: Record<ActionType, number> = {
  concept:  2,
  budget:   2,
  vendor:   2,
  timeline: 2,
  proposal: 5,
  edit:     2,
  other:    1,
};

// Long prompts cost more — a coarse proxy for token spend. Threshold and
// surcharge are tuned to add ~+2 credits for the 95th-percentile prompt.
const LONG_PROMPT_THRESHOLD = 2000; // characters
const LONG_PROMPT_SURCHARGE = 2;

export function getCreditsForAction(action: ActionType, promptLength: number): number {
  const base = BASE_COST[action] ?? BASE_COST.other;
  const surcharge = promptLength > LONG_PROMPT_THRESHOLD ? LONG_PROMPT_SURCHARGE : 0;
  return base + surcharge;
}

export type ConsumeResult =
  | { ok: true;  remaining: number }
  | { ok: false; remaining: number; reason: "LIMIT_REACHED" | "NOT_FOUND" | "INVALID_AMOUNT" | "DB_ERROR" };

export async function consumeCredits(userId: string, amount: number): Promise<ConsumeResult> {
  const admin = getAdminClient();
  if (!admin) return { ok: false, remaining: 0, reason: "DB_ERROR" };

  const { data, error } = await admin.rpc("consume_ai_credits", {
    p_user_id: userId,
    p_amount:  amount,
  });

  if (error) {
    console.error("[credits] consume_ai_credits failed:", error.message);
    return { ok: false, remaining: 0, reason: "DB_ERROR" };
  }

  // RPC returns a single-row table; supabase-js gives an array.
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { ok: false, remaining: 0, reason: "DB_ERROR" };

  if (row.success) return { ok: true,  remaining: row.credits_remaining ?? 0 };
  return { ok: false, remaining: row.credits_remaining ?? 0, reason: (row.reason ?? "DB_ERROR") };
}

// Refund credits when an AI call fails after consumption. Best-effort.
export async function refundCredits(userId: string, amount: number): Promise<void> {
  if (amount <= 0) return;
  const admin = getAdminClient();
  if (!admin) return;
  const { error } = await admin.rpc("refund_ai_credits", { p_user_id: userId, p_amount: amount });
  if (error) console.error("[credits] refund_ai_credits failed:", error.message);
}

// Top-up. Use from billing webhook or admin tools — never expose to the user.
export async function addCredits(userId: string, amount: number): Promise<number | null> {
  if (amount <= 0) return null;
  const admin = getAdminClient();
  if (!admin) return null;
  const { data, error } = await admin.rpc("grant_ai_credits", { p_user_id: userId, p_amount: amount });
  if (error) {
    console.error("[credits] grant_ai_credits failed:", error.message);
    return null;
  }
  return (data as number) ?? null;
}

// Alias for monthly event quota top-ups. Same backing column today; kept as
// a separate function so we can split storage later without touching callers.
export async function addEvents(userId: string, amount: number): Promise<number | null> {
  return addCredits(userId, amount);
}

// Credit-pack purchase entry point. Atomic three-in-one: replay check
// (UNIQUE on payment_id) + credit grant on user_usage + insert into
// credit_transactions ledger. Use this from /api/payments/credits only.
export type CreditPackResult =
  | { ok: true;  idempotent: boolean; newBalance: number; transactionId: string | null }
  | { ok: false; error: string };

export async function applyCreditPack(args: {
  userId:    string;
  credits:   number;
  amount:    number;   // INR rupees
  paymentId: string;
  pack:      string;
}): Promise<CreditPackResult> {
  const admin = getAdminClient();
  if (!admin) return { ok: false, error: "admin_unavailable" };

  const { data, error } = await admin.rpc("apply_credit_pack", {
    p_user_id:    args.userId,
    p_credits:    args.credits,
    p_amount:     args.amount,
    p_payment_id: args.paymentId,
    p_pack:       args.pack,
  });
  if (error) {
    // 23505 unique_violation on credit_transactions.payment_id means a
    // parallel worker won the race in the tiny gap between our replay
    // check and our insert. Treat as idempotent — credits granted by
    // the winner. Re-read the balance.
    const code = (error as { code?: string }).code;
    if (code === "23505") {
      const { data: row } = await admin
        .from("user_usage")
        .select("credits_added, events_used")
        .eq("user_id", args.userId)
        .maybeSingle();
      const balance = row
        ? Math.max(0, ((row.credits_added as number) ?? 0) - ((row.events_used as number) ?? 0))
        : 0;
      const { data: tx } = await admin
        .from("credit_transactions")
        .select("id")
        .eq("payment_id", args.paymentId)
        .maybeSingle();
      return { ok: true, idempotent: true, newBalance: balance, transactionId: (tx?.id as string) ?? null };
    }
    console.error("[credits] apply_credit_pack failed:", error.message);
    return { ok: false, error: error.message };
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { ok: false, error: "empty_rpc_result" };
  return {
    ok:            true,
    idempotent:    !!row.idempotent,
    newBalance:    row.new_balance ?? 0,
    transactionId: (row.transaction_id as string) ?? null,
  };
}

// Billing-webhook entry point. Atomic in one round-trip: idempotency on
// payment_id + plan stamp + credit grant. Use this from the Razorpay
// webhook only — the payment_id is the dedup token.
export type PaymentCreditsResult =
  | { ok: true;  idempotent: boolean; totalCredits: number }
  | { ok: false; error: string };

export async function applyPaymentCredits(args: {
  userId:    string;
  plan:      string;
  amount:    number;
  paymentId: string;
}): Promise<PaymentCreditsResult> {
  const admin = getAdminClient();
  if (!admin) return { ok: false, error: "admin_unavailable" };

  const { data, error } = await admin.rpc("apply_payment_credits", {
    p_user_id:    args.userId,
    p_plan:       args.plan,
    p_amount:     args.amount,
    p_payment_id: args.paymentId,
  });
  if (error) {
    console.error("[credits] apply_payment_credits failed:", error.message);
    return { ok: false, error: error.message };
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { ok: false, error: "empty_rpc_result" };
  return { ok: true, idempotent: !!row.idempotent, totalCredits: row.total_credits ?? 0 };
}

// Read-only summary for UI / responses. No mutation.
export async function getRemaining(userId: string): Promise<number> {
  const admin = getAdminClient();
  if (!admin) return 0;
  const { data } = await admin
    .from("user_usage")
    .select("credits_added, events_used")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return 0;
  const added = (data.credits_added as number) ?? 0;
  const used  = (data.events_used   as number) ?? 0;
  return Math.max(0, added - used);
}
