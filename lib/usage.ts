import { createClient } from "@/lib/supabase/server";
import { type PlanId } from "@/lib/plans";

// New users get this many free credits to try the product before paying.
const FREE_TRIAL_CREDITS = 2;

export interface UsageRecord {
  user_id: string;
  plan: PlanId | null;
  annual: boolean;
  events_used: number;
  credits_added: number;
  period_start: string;
  period_end: string;
}

export async function getUsage(userId: string): Promise<UsageRecord | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("user_usage")
    .select("*")
    .eq("user_id", userId)
    .single();
  return data ?? null;
}

export async function checkUsage(
  userId: string
): Promise<{ allowed: boolean; overage: boolean; events_used: number; limit: number }> {
  const supabase = await createClient();
  if (!supabase) return { allowed: false, overage: false, events_used: 0, limit: 0 };

  let { data: usage } = await supabase
    .from("user_usage")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!usage) {
    await supabase
      .from("user_usage")
      .insert({ user_id: userId, credits_added: FREE_TRIAL_CREDITS, events_used: 0 });
    ({ data: usage } = await supabase
      .from("user_usage")
      .select("*")
      .eq("user_id", userId)
      .single());
  }

  const eventsUsed = (usage?.events_used as number) ?? 0;
  const creditsAdded = (usage?.credits_added as number) ?? 0;
  const overage = eventsUsed >= creditsAdded;

  return {
    allowed: !overage,
    overage,
    events_used: eventsUsed,
    limit: creditsAdded,
  };
}

export async function incrementUsage(userId: string, currentCount: number): Promise<number> {
  const supabase = await createClient();
  if (!supabase) return currentCount;
  const newCount = currentCount + 1;
  await supabase
    .from("user_usage")
    .update({ events_used: newCount, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  return newCount;
}

// Kept for any future callers — internally uses checkUsage + incrementUsage
export async function checkAndIncrementUsage(
  userId: string
): Promise<{ allowed: boolean; overage: boolean; events_used: number; limit: number }> {
  const check = await checkUsage(userId);
  if (!check.overage) {
    const newCount = await incrementUsage(userId, check.events_used);
    return { ...check, events_used: newCount };
  }
  return check;
}
