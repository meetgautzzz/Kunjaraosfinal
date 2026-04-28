"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Suspense } from "react";
import UpgradeBanner from "./UpgradeBanner";
import QuickActions from "@/components/ui/QuickActions";
import ReceivablesWidget from "@/components/dashboard/ReceivablesWidget";
import { formatINR } from "@/lib/proposals";
import type { ProposalData } from "@/lib/proposals";

type ProposalRow = { id: string; data: ProposalData; created_at: string };
type CreditsData = { credits_added: number; events_used: number; plan: string | null };

const STATUS_STYLES: Record<string, string> = {
  "DRAFT":             "bg-amber-500/15 text-amber-400",
  "APPROVED":          "bg-emerald-500/15 text-emerald-400",
  "CHANGES_REQUESTED": "bg-red-500/15 text-red-400",
  "SENT":              "bg-indigo-500/15 text-indigo-400",
  "SHARED":            "bg-indigo-500/15 text-indigo-400",
  "GENERATED":         "bg-sky-500/15 text-sky-400",
  "SAVED":             "bg-teal-500/15 text-teal-400",
};

function statusLabel(s: string | undefined) {
  if (!s) return "Draft";
  if (s === "CHANGES_REQUESTED") return "Changes Requested";
  const lower = s.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export default function DashboardPage() {
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [credits,   setCredits]   = useState<CreditsData | null>(null);
  const [vendors,   setVendors]   = useState<number>(0);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.allSettled([
      fetch("/api/proposals").then((r) => r.ok ? r.json() : []),
      fetch("/api/credits/summary").then((r) => r.ok ? r.json() : null),
      fetch("/api/vendors").then((r) => r.ok ? r.json() : []),
    ]).then(([propRes, credRes, vendRes]) => {
      if (propRes.status === "fulfilled") setProposals(Array.isArray(propRes.value) ? propRes.value : []);
      if (credRes.status === "fulfilled" && credRes.value) setCredits(credRes.value);
      if (vendRes.status === "fulfilled") setVendors(Array.isArray(vendRes.value) ? vendRes.value.length : 0);
      setLoading(false);
    });
  }, []);

  const creditsLeft = credits
    ? Math.max(0, (credits.credits_added ?? 0) - (credits.events_used ?? 0))
    : null;

  const approved      = proposals.filter((p) => p.data?.status === "APPROVED").length;
  const totalBudget   = proposals.reduce((s, p) => s + (p.data?.budget ?? 0), 0);
  const recent        = [...proposals].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <Suspense>
        <UpgradeBanner />
      </Suspense>

      <div>
        <h2 className="text-2xl font-bold text-[var(--text-1)]">{greeting} 👋</h2>
        <p className="text-[var(--text-2)] text-sm mt-1">Here's what's happening across your workspace today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Proposals"
          value={loading ? "—" : String(proposals.length)}
          icon="📋"
          href="/proposals"
          sub={approved > 0 ? `${approved} approved` : "View all"}
        />
        <StatCard
          label="Active Vendors"
          value={loading ? "—" : String(vendors)}
          icon="🏪"
          href="/vendors"
          sub={vendors === 0 ? "Add vendors" : "Manage network"}
        />
        <StatCard
          label="AI Credits Left"
          value={loading || creditsLeft === null ? "—" : String(creditsLeft)}
          icon="⚡"
          href="/billing"
          sub={credits?.plan ? `${credits.plan} plan` : "No active plan"}
          accent={creditsLeft !== null && creditsLeft <= 5 ? "amber" : undefined}
        />
        <StatCard
          label="Pipeline Value"
          value={loading ? "—" : formatINR(totalBudget)}
          icon="💰"
          href="/events"
          sub={`${proposals.length} event${proposals.length !== 1 ? "s" : ""}`}
        />
      </div>

      <ReceivablesWidget />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent proposals */}
        <div className="lg:col-span-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <h3 className="text-[var(--text-1)] font-semibold text-sm">Recent Proposals</h3>
            <Link href="/proposals" className="text-indigo-400 text-xs hover:text-indigo-300 transition-colors">View all →</Link>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-[var(--bg-surface)] animate-pulse" />)}
            </div>
          ) : recent.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-[var(--text-3)] text-sm mb-3">No proposals yet.</p>
              <Link href="/proposals/new" className="text-indigo-400 text-sm font-medium hover:text-indigo-300">
                Create your first proposal →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    {["Proposal", "Type", "Budget", "Status"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-[var(--text-3)] text-xs font-medium uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map((p) => (
                    <tr key={p.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-hover)] transition-colors">
                      <td className="px-5 py-3.5">
                        <Link href={`/proposals/${p.id}`} className="text-[var(--text-1)] font-medium hover:text-indigo-300 transition-colors truncate block max-w-[200px]">
                          {p.data?.title ?? "Untitled"}
                        </Link>
                        <p className="text-[var(--text-3)] text-xs truncate">{p.data?.client?.companyName ?? p.data?.location ?? "—"}</p>
                      </td>
                      <td className="px-5 py-3.5 text-[var(--text-2)] text-xs">{p.data?.eventType ?? "—"}</td>
                      <td className="px-5 py-3.5 text-[var(--text-2)] tabular-nums text-xs">{p.data?.budget ? formatINR(p.data.budget) : "—"}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[p.data?.status ?? ""] ?? "bg-gray-500/15 text-gray-400"}`}>
                          {statusLabel(p.data?.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div>
          <QuickActions />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, href, sub, accent }: {
  label: string;
  value: string;
  icon: string;
  href: string;
  sub: string;
  accent?: "amber";
}) {
  return (
    <Link href={href} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 flex flex-col gap-3 hover:border-indigo-500/30 transition-colors group">
      <div className="flex items-center justify-between">
        <span className="text-xl">{icon}</span>
        <svg className="w-3.5 h-3.5 text-[var(--text-3)] group-hover:text-indigo-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
      <div>
        <p className={`text-2xl font-black tabular-nums ${accent === "amber" ? "text-amber-400" : "text-[var(--text-1)]"}`}>
          {value}
        </p>
        <p className="text-[var(--text-3)] text-xs mt-0.5">{label}</p>
      </div>
      <p className="text-[var(--text-3)] text-xs">{sub}</p>
    </Link>
  );
}
