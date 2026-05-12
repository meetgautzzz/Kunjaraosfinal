"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import ProposalOutputPanel from "./ProposalOutput";
import AtlasThinkingAnimation from "@/components/proposals/AtlasThinkingAnimation";
import UpgradePaywall from "@/components/paywall/UpgradePaywall";
import { createClient } from "@/lib/supabase/client";
import { getPlan, type PlanId } from "@/lib/plans";
import type { ProposalOutput } from "@/lib/generateProposal";

interface FormData {
  eventType: string;
  budget: string;
  location: string;
  audience: string;
  theme: string;
  clientName: string;
}

interface UsageState {
  events_used: number;
  limit: number;
  plan: string;
  overage: boolean;
}

const defaultForm: FormData = {
  eventType: "",
  budget: "",
  location: "",
  audience: "",
  theme: "",
  clientName: "",
};


export default function ProposalGenerator() {
  const [form, setForm] = useState<FormData>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [proposal, setProposal] = useState<ProposalOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageState | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    async function loadUsage() {
      const supabase = createClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("user_usage")
        .select("events_used, plan")
        .eq("user_id", user.id)
        .single();
      if (data) {
        const plan = getPlan((data.plan as PlanId) ?? "basic");
        setUsage({
          events_used: data.events_used,
          limit: plan.proposals,
          plan: plan.name,
          overage: data.events_used >= plan.proposals,
        });
      }
    }
    loadUsage();
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleGenerate() {
    // Client-side early gate: show paywall immediately if already over limit
    if (usage?.overage) {
      setShowPaywall(true);
      return;
    }
    setLoading(true);
    setProposal(null);
    setError(null);

    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      let data: { success: boolean; data?: ProposalOutput; error?: string; limit_reached?: boolean; usage?: { events_used: number; limit: number; overage: boolean } };
      try {
        data = await res.json();
      } catch {
        throw new Error(`Invalid response from server (${res.status}).`);
      }

      if (data.limit_reached) {
        setShowPaywall(true);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      if (!data.success || !data.data) {
        throw new Error(data.error ?? "Failed to generate proposal.");
      }

      setProposal(data.data);

      if (data.usage) {
        setUsage((prev) => prev ? {
          ...prev,
          events_used: data.usage!.events_used,
          limit: data.usage!.limit,
          overage: data.usage!.overage,
        } : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const canGenerate = ["eventType", "budget", "location", "audience", "theme"].every(
    (k) => form[k as keyof FormData].trim() !== ""
  );

  return (
    <>
    <UpgradePaywall
      open={showPaywall}
      onClose={() => setShowPaywall(false)}
      used={usage?.events_used ?? 0}
      limit={usage?.limit ?? 2}
    />
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
      {/* Input Form */}
      <Card>
        <div className="flex flex-col gap-6">
          <div className="flex items-start justify-between">
            <h2 className="text-sm font-semibold text-text-primary">Event Details</h2>
            {usage && <UsagePill usage={usage} />}
          </div>

          <div className="flex flex-col gap-4">
            <Input label="Event Type" name="eventType" placeholder="e.g. Corporate Conference" value={form.eventType} onChange={handleChange} />
            <Input label="Budget" name="budget" placeholder="e.g. $10,000" value={form.budget} onChange={handleChange} />
            <Input label="Location" name="location" placeholder="e.g. Mumbai, India" value={form.location} onChange={handleChange} />
            <Input label="Audience" name="audience" placeholder="e.g. 200 executives" value={form.audience} onChange={handleChange} />
            <Input label="Theme" name="theme" placeholder="e.g. Innovation & Growth" value={form.theme} onChange={handleChange} />
            <Input label="Client Name (optional)" name="clientName" placeholder="e.g. Acme Corp" value={form.clientName} onChange={handleChange} />
          </div>

          {usage?.overage && <OverageBanner />}

          <Button onClick={handleGenerate} disabled={!canGenerate || loading} className="w-full py-3">
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity={0.25} />
                  <path d="M21 12a9 9 0 00-9-9" />
                </svg>
                Generating...
              </span>
            ) : proposal ? "Update Proposal" : "Generate Proposal"}
          </Button>
        </div>
      </Card>

      {/* Output Panel */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">Generated Proposal</h2>
          {proposal && <span className="rounded-full bg-accent-blue/10 px-3 py-1 text-xs font-medium text-accent-blue">Ready</span>}
        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl border border-white/5 bg-surface overflow-hidden">
            <AtlasThinkingAnimation />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-5">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !proposal && !error && (
          <div className="flex min-h-[480px] flex-col items-center justify-center gap-6 rounded-2xl border border-white/5 bg-surface px-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-2xl border border-white/8 bg-bg p-5">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="text-text-secondary">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">Your proposal will appear here</p>
                <p className="mt-1 text-xs text-text-secondary">Fill in the event details on the left, then click Generate.</p>
              </div>
            </div>
            <div className="w-full max-w-xs">
              <div className="flex flex-col gap-2">
                {["Event Type", "Budget", "Location", "Audience", "Theme"].map((step, i) => {
                  const filled = form[(["eventType", "budget", "location", "audience", "theme"] as const)[i]].trim() !== "";
                  return (
                    <div key={step} className="flex items-center gap-3 text-xs">
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors duration-150 ${filled ? "bg-accent-blue/20 text-accent-blue" : "border border-white/10 text-text-secondary"}`}>
                        {filled ? (
                          <svg width="8" height="8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <span className="h-1 w-1 rounded-full bg-white/20" />
                        )}
                      </span>
                      <span className={filled ? "text-text-primary" : "text-text-secondary"}>{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Result */}
        {!loading && proposal && (
          <ProposalOutputPanel
            proposal={proposal}
            eventType={form.eventType}
            location={form.location}
            clientName={form.clientName}
            onRegenerate={handleGenerate}
            regenerating={loading}
          />
        )}
      </div>
    </div>
    </>
  );
}

function UsagePill({ usage }: { usage: UsageState }) {
  const pct = Math.min((usage.events_used / usage.limit) * 100, 100);
  const over = usage.overage;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-16 overflow-hidden rounded-full bg-white/8">
        <div
          className={`h-full rounded-full transition-all duration-300 ${over ? "bg-red-400" : "bg-accent-blue"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs ${over ? "text-red-400" : "text-text-secondary"}`}>
        {usage.events_used}/{usage.limit}
      </span>
    </div>
  );
}

function OverageBanner() {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3">
      <div>
        <p className="text-xs font-semibold text-amber-400">Plan limit reached</p>
        <p className="mt-0.5 text-xs text-text-secondary">
          Additional proposals are billed at ₹199 each.
        </p>
      </div>
      <Link
        href="/pricing"
        className="shrink-0 rounded-lg border border-amber-500/30 px-3 py-1.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/10"
      >
        Upgrade
      </Link>
    </div>
  );
}
