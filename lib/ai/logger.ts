// Best-effort write to ai_usage_logs. Never throws — a logging failure
// must NEVER affect the user response. We surface every failure on
// console.error with full context so it's visible in Vercel logs.

import "server-only";
import { getAdminClient } from "@/lib/supabase/admin";
import type { ActionType } from "@/lib/ai/router";

export type LogEntry = {
  userId:          string;
  eventId?:        string | null;
  actionType:      ActionType;
  creditsUsed:     number;
  tokensUsed?:     number | null;
  modelUsed:       string;
  responseTimeMs:  number;
  status:          "success" | "error";
  errorMessage?:   string | null;
};

export async function logAiUsage(entry: LogEntry): Promise<void> {
  const admin = getAdminClient();
  if (!admin) {
    console.error("[ai/logger] admin client unavailable — log dropped:", entry);
    return;
  }
  try {
    const { error } = await admin.from("ai_usage_logs").insert({
      user_id:          entry.userId,
      event_id:         entry.eventId ?? null,
      action_type:      entry.actionType,
      credits_used:     entry.creditsUsed,
      tokens_used:      entry.tokensUsed ?? null,
      model_used:       entry.modelUsed,
      response_time_ms: entry.responseTimeMs,
      status:           entry.status,
      error_message:    entry.errorMessage ?? null,
    });
    if (error) {
      console.error("[ai/logger] insert failed:", error.message, "entry:", entry);
    }
  } catch (err) {
    console.error("[ai/logger] threw:", err, "entry:", entry);
  }
}

// Count edits made on a given proposal by a user. Used to enforce
// per-event edit caps without adding a new column.
export async function getEditCountForEvent(userId: string, eventId: string): Promise<number> {
  const admin = getAdminClient();
  if (!admin) return 0;
  const { count, error } = await admin
    .from("ai_usage_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id",     userId)
    .eq("event_id",    eventId)
    .eq("action_type", "edit")
    .eq("status",      "success");
  if (error) {
    console.error("[ai/logger] getEditCountForEvent failed:", error.message);
    return 0;
  }
  return count ?? 0;
}
