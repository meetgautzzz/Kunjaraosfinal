"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPlan, type PlanId } from "@/lib/plans";

export default function CreditMeter() {
  const [proposalsUsed,  setProposalsUsed]  = useState<number | null>(null);
  const [proposalLimit,  setProposalLimit]  = useState<number>(2);
  const [loading,        setLoading]        = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      if (!supabase) { setLoading(false); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("user_usage")
        .select("plan, proposals_used")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setProposalsUsed(data.proposals_used ?? 0);
        const plan = getPlan(data.plan as PlanId);
        setProposalLimit(plan?.proposals ?? 2);
      }
      setLoading(false);
    }
    load();
  }, []);

  const remaining = proposalsUsed === null ? null : Math.max(0, proposalLimit - proposalsUsed);

  const tone =
    remaining === null ? "neutral" :
    remaining <= 0     ? "red"     :
    remaining === 1    ? "amber"   : "emerald";

  const colors = {
    neutral: "border-[var(--border)] text-[var(--text-3)]",
    emerald: "border-emerald-500/25 text-emerald-400",
    amber:   "border-amber-500/30  text-amber-400",
    red:     "border-red-500/30    text-red-400",
  }[tone];

  return (
    <div
      title={`${remaining ?? "—"} proposals remaining this month`}
      className={`flex items-center gap-1 sm:gap-2 min-h-[36px] sm:min-h-0 px-2.5 sm:px-3 py-1.5 rounded-lg border bg-[var(--bg-card)] text-xs font-medium ${colors}`}
    >
      <span className="text-[10px] opacity-70 uppercase tracking-wide hidden sm:inline">Proposals</span>
      <span className="text-base sm:hidden">📋</span>
      <span className="font-semibold tabular-nums">
        {loading || remaining === null ? "—" : remaining}
      </span>
      <span className="opacity-60 hidden sm:inline">left</span>
    </div>
  );
}
