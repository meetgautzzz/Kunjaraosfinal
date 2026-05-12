"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPlan, type PlanId } from "@/lib/plans";

export interface ProposalCounter {
  used:      number;
  limit:     number;
  remaining: number;
  isLimited: boolean;
  plan:      string;
  loading:   boolean;
}

const INITIAL: ProposalCounter = {
  used: 0, limit: 2, remaining: 2, isLimited: true, plan: "free", loading: true,
};

export function useProposalCounter(): ProposalCounter {
  const [state, setState] = useState<ProposalCounter>(INITIAL);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) { setState((s) => ({ ...s, loading: false })); return; }

        const { data } = await supabase
          .from("user_usage")
          .select("plan, events_used")
          .eq("user_id", user.id)
          .single();

        if (!cancelled) {
          const planId = (data?.plan ?? "free") as PlanId;
          const plan   = getPlan(planId);
          const used   = data?.events_used ?? 0;
          const lim    = plan.proposals;
          setState({
            used,
            limit:     lim,
            remaining: Math.max(0, lim - used),
            isLimited: planId === "free",
            plan:      planId,
            loading:   false,
          });
        }
      } catch {
        if (!cancelled) setState((s) => ({ ...s, loading: false }));
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return state;
}
