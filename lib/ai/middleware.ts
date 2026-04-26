// requireAiCredits — single entry point that bundles the pre-flight
// checks every AI route must run, in order:
//
//   1. Auth (session)
//   2. Rate limit (per-user, AI tier)
//   3. Strict credit check + atomic consumption
//
// Returns either { error: NextResponse } for caller to early-return, or
// { user, creditsCharged, model, commit } where commit() finalizes the
// log. If the AI call itself fails, caller invokes refund(reason) and
// the credits are returned. This keeps every route's preamble to ~3 lines.

import "server-only";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { aiLimiter, limit } from "@/lib/ratelimit";
import { aiError } from "@/lib/ai/responses";
import { consumeCredits, refundCredits, getCreditsForAction } from "@/lib/ai/credits";
import { getModelForAction, type ActionType } from "@/lib/ai/router";
import { logAiUsage, getEditCountForEvent } from "@/lib/ai/logger";

type Args = {
  req:           NextRequest;
  action:        ActionType;
  promptLength:  number;
  // Optional: when set, enforces the per-event edit cap before consuming.
  eventId?:      string;
  editLimit?:    number;
};

export type AiContext = {
  user:           { id: string; email?: string };
  model:          string;
  creditsCharged: number;
  startTime:      number;
  // Caller invokes finish() on success — writes the log + returns the
  // credit count remaining. Calling refund() reverses the deduction
  // (use when the AI provider fails AFTER consumption).
  finish:         (args: { tokensUsed?: number | null; eventId?: string | null }) => Promise<number>;
  refund:         (errorMessage: string) => Promise<void>;
};

export type Pre =
  | { ok: true;  ctx: AiContext }
  | { ok: false; res: ReturnType<typeof aiError> };

export async function requireAiCredits(args: Args): Promise<Pre> {
  // 1. Auth
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, res: aiError("SERVICE_UNAVAILABLE", "Service unavailable.", 503) };
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, res: aiError("UNAUTHORIZED", "Unauthorized.", 401) };
  }

  // 2. Rate limit (per-user, AI bucket — 10/min today)
  const rlRes = await limit(aiLimiter, `user:${user.id}`);
  if (rlRes) {
    // limit() returns a 429 NextResponse already. Re-shape to our envelope.
    return { ok: false, res: aiError("RATE_LIMIT", "Too many requests. Slow down.", 429) };
  }

  // Optional per-event edit cap
  if (args.action === "edit" && args.eventId && typeof args.editLimit === "number") {
    const count = await getEditCountForEvent(user.id, args.eventId);
    if (count >= args.editLimit) {
      return { ok: false, res: aiError(
        "EDIT_LIMIT",
        `Edit limit of ${args.editLimit} reached for this event. Upgrade to continue.`,
        403,
        { edits_used: count, edit_limit: args.editLimit }
      ) };
    }
  }

  // 3. Cost + atomic consumption
  const creditsCharged = getCreditsForAction(args.action, args.promptLength);
  const result = await consumeCredits(user.id, creditsCharged);
  if (!result.ok) {
    if (result.reason === "LIMIT_REACHED" || result.reason === "NOT_FOUND") {
      return { ok: false, res: aiError(
        "LIMIT_REACHED",
        "Upgrade required to continue.",
        403,
        { credits_remaining: result.remaining, credits_required: creditsCharged }
      ) };
    }
    return { ok: false, res: aiError("SERVICE_UNAVAILABLE", "Could not check credits.", 503) };
  }

  const model = getModelForAction(args.action);
  const startTime = Date.now();

  return {
    ok: true,
    ctx: {
      user: { id: user.id, email: user.email },
      model,
      creditsCharged,
      startTime,
      finish: async ({ tokensUsed, eventId }) => {
        await logAiUsage({
          userId:         user.id,
          eventId:        eventId ?? args.eventId ?? null,
          actionType:     args.action,
          creditsUsed:    creditsCharged,
          tokensUsed:     tokensUsed ?? null,
          modelUsed:      model,
          responseTimeMs: Date.now() - startTime,
          status:         "success",
        });
        // remaining = current row's (added - used) after our successful consumption
        const { getRemaining } = await import("@/lib/ai/credits");
        return getRemaining(user.id);
      },
      refund: async (errorMessage: string) => {
        await refundCredits(user.id, creditsCharged);
        await logAiUsage({
          userId:         user.id,
          eventId:        args.eventId ?? null,
          actionType:     args.action,
          creditsUsed:    0, // refunded
          tokensUsed:     null,
          modelUsed:      model,
          responseTimeMs: Date.now() - startTime,
          status:         "error",
          errorMessage,
        });
      },
    },
  };
}
