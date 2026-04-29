"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getPlan } from "@/lib/plans";

type Usage = { plan: string | null; credits_added: number; events_used: number };

export default function BillingSection() {
  const [usage,   setUsage]   = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/credits/summary")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setUsage(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const plan       = usage?.plan ? getPlan(usage.plan as any) : null;
  const creditsLeft = usage ? Math.max(0, (usage.credits_added ?? 0) - (usage.events_used ?? 0)) : 0;
  const creditsUsed = usage?.events_used ?? 0;
  const creditsTotal = usage?.credits_added ?? 0;
  const pct = creditsTotal > 0 ? Math.round((creditsUsed / creditsTotal) * 100) : 0;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <p className="t-title">Billing</p>
        <p className="t-body" style={{ marginTop: 4 }}>Your current plan and AI credit usage.</p>
      </div>

      {loading ? (
        <div style={{ height: 80, borderRadius: 10, background: "var(--bg-surface)" }} className="animate-pulse" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Plan */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg-surface)" }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>
                {plan ? `${plan.name} Plan` : "No active plan"}
              </p>
              {plan && (
                <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
                  {plan.proposals} proposals · {plan.credits.toLocaleString("en-IN")} AI credits
                </p>
              )}
            </div>
            <Link
              href="/billing"
              className="btn-ghost"
              style={{ fontSize: 12, minHeight: 32, padding: "6px 12px" }}
            >
              {plan ? "Manage" : "Upgrade"}
            </Link>
          </div>

          {/* Credits bar */}
          {creditsTotal > 0 && (
            <div style={{ padding: "14px 16px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg-surface)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <p style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500 }}>AI Credits</p>
                <p style={{ fontSize: 12, color: "var(--text-1)", fontWeight: 600 }}>
                  {creditsLeft.toLocaleString("en-IN")} left of {creditsTotal.toLocaleString("en-IN")}
                </p>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: "var(--border)", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    borderRadius: 99,
                    width: `${pct}%`,
                    background: pct > 80 ? "#f87171" : pct > 50 ? "#fbbf24" : "#6366f1",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
              <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 6 }}>
                {creditsUsed} used · {pct}% consumed
              </p>
            </div>
          )}

          {!plan && (
            <Link href="/billing" className="btn-primary" style={{ fontSize: 13, textAlign: "center" }}>
              View plans →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
