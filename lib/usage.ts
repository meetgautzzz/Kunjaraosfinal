import { createClient } from "@/lib/supabase/server";
import { getPlan, type PlanId } from "@/lib/plans";

export interface UsageRecord {
  user_id: string;
  plan: PlanId;
  annual: boolean;
  events_used: number;
  period_start: string;
  period_end: string;
}

export async function getUsage(userId: string): Promise<UsageRecord | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_usage")
    .select("*")
    .eq("user_id", userId)
    .single();
  return data ?? null;
}

export async function checkAndIncrementUsage(
  userId: string
): Promise<{ allowed: boolean; overage: boolean; events_used: number; limit: number }> {
  const supabase = await createClient();

  let { data: usage } = await supabase
    .from("user_usage")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!usage) {
    await supabase.from("user_usage").insert({ user_id: userId });
    ({ data: usage } = await supabase
      .from("user_usage")
      .select("*")
      .eq("user_id", userId)
      .single());
  }

  const plan = getPlan((usage.plan as PlanId) ?? "basic");
  const now = new Date();
  const periodEnd = new Date(usage.period_end);

  if (now > periodEnd) {
    await supabase
      .from("user_usage")
      .update({
        events_used: 0,
        period_start: new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)).toISOString(),
        period_end: new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1)).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
    usage.events_used = 0;
  }

  const overage = usage.events_used >= plan.events;

  await supabase
    .from("user_usage")
    .update({ events_used: usage.events_used + 1, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  return {
    allowed: true,
    overage,
    events_used: usage.events_used + 1,
    limit: plan.events,
  };
}
