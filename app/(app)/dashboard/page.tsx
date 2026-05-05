"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Suspense } from "react";
import UpgradeBanner from "./UpgradeBanner";
import QuickActions from "@/components/ui/QuickActions";
import { formatINR } from "@/lib/proposals";
import type { ProposalData } from "@/lib/proposals";

type ProposalRow = { id: string; data: ProposalData; created_at: string };

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  DRAFT:             "bg-amber-500/15 text-amber-400",
  APPROVED:          "bg-emerald-500/15 text-emerald-400",
  CHANGES_REQUESTED: "bg-red-500/15 text-red-400",
  SENT:              "bg-indigo-500/15 text-indigo-400",
  SHARED:            "bg-indigo-500/15 text-indigo-400",
  GENERATED:         "bg-sky-500/15 text-sky-400",
  SAVED:             "bg-teal-500/15 text-teal-400",
};

function statusLabel(s: string | undefined) {
  if (!s) return "Draft";
  if (s === "CHANGES_REQUESTED") return "Revision";
  return s.charAt(0) + s.slice(1).toLowerCase();
}

// ── Pipeline stage definitions ────────────────────────────────────────────────
const PIPELINE_STAGES = [
  { key: "lead",        label: "Lead",        statuses: ["SAVED", "GENERATED", "DRAFT"],           dot: "#38bdf8", bg: "#0c1a2b" },
  { key: "negotiation", label: "Negotiation", statuses: ["SENT", "SHARED", "CHANGES_REQUESTED"],   dot: "#fbbf24", bg: "#1c1508" },
  { key: "won",         label: "Won",         statuses: ["APPROVED"],                              dot: "#34d399", bg: "#091c12" },
  { key: "lost",        label: "Lost",        statuses: ["LOST"],                                  dot: "#f87171", bg: "#1c0a0a" },
] as const;

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [vendors,   setVendors]   = useState<number>(0);
  const [loading,   setLoading]   = useState(true);
  const [userName,  setUserName]  = useState("");

  useEffect(() => {
    import("@/lib/supabase/client").then(({ createClient }) => {
      createClient().auth.getUser().then(({ data }) => {
        const email = data.user?.email ?? "";
        setUserName(email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));
      });
    });

    Promise.allSettled([
      fetch("/api/proposals").then((r) => r.ok ? r.json() : []),
      fetch("/api/vendors").then((r) => r.ok ? r.json() : []),
    ]).then(([propRes, vendRes]) => {
      if (propRes.status === "fulfilled") setProposals(Array.isArray(propRes.value) ? propRes.value : []);
      if (vendRes.status === "fulfilled") setVendors(Array.isArray(vendRes.value) ? vendRes.value.length : 0);
      setLoading(false);
    });
  }, []);
  const approved      = proposals.filter((p) => p.data?.status === "APPROVED").length;
  const actionNeeded  = proposals.filter((p) => ["DRAFT", "CHANGES_REQUESTED"].includes(p.data?.status ?? "")).length;
  const totalBudget   = proposals.reduce((s, p) => s + (p.data?.budget ?? 0), 0);
  const conversionPct = proposals.length > 0 ? Math.round((approved / proposals.length) * 100) : 0;
  const recent        = [...proposals].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 8);

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      <Suspense><UpgradeBanner /></Suspense>

      {/* ── Greeting ──────────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-1)]">
            {greeting}{userName ? `, ${userName}` : ""} 👋
          </h2>
          <p className="text-[var(--text-3)] text-xs mt-0.5">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--text-3)]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          {vendors} vendor{vendors !== 1 ? "s" : ""} in network
        </div>
      </div>

      {/* ── Metric cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <MetricCard
          label="Pipeline Revenue"
          value={loading ? "—" : formatINR(totalBudget)}
          sub={`${proposals.length} event${proposals.length !== 1 ? "s" : ""} total`}
          dot="#818cf8"
          href="/events"
        />
        <MetricCard
          label="Proposals"
          value={loading ? "—" : String(proposals.length)}
          sub={approved > 0 ? `${approved} approved` : "None approved yet"}
          dot="#34d399"
          href="/proposals"
        />
        <MetricCard
          label="Conversion"
          value={loading ? "—" : `${conversionPct}%`}
          sub={`${approved} won of ${proposals.length}`}
          dot="#38bdf8"
          href="/proposals"
        />
        <MetricCard
          label="Action Needed"
          value={loading ? "—" : String(actionNeeded)}
          sub={actionNeeded === 0 ? "All clear" : "Drafts & revisions"}
          dot={actionNeeded > 0 ? "#fbbf24" : "#34d399"}
          href="/proposals"
          warn={actionNeeded > 0}
        />
      </div>

      {/* ── Main 2/3 + Sidebar 1/3 ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ══ Main column ══════════════════════════════════════════════════ */}
        <div className="lg:col-span-2 space-y-4">

          {/* Event Pipeline */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="text-[var(--text-1)] font-semibold text-sm">Event Pipeline</h3>
              <Link href="/proposals" className="text-indigo-400 text-xs hover:text-indigo-300 transition-colors">
                All proposals →
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-4 gap-px bg-[var(--border)]">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-[var(--bg-card)] p-3 space-y-2">
                    <div className="h-3 w-20 rounded skeleton" />
                    <div className="h-10 rounded skeleton" />
                    <div className="h-10 rounded skeleton" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[var(--border)]">
                {PIPELINE_STAGES.map((stage) => {
                  const stageItems = proposals.filter((p) =>
                    stage.statuses.includes((p.data?.status ?? "DRAFT") as never)
                  );
                  return (
                    <div key={stage.key} className="bg-[var(--bg-card)] p-3 min-h-[120px]">
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: stage.dot }} />
                        <span className="text-[10px] font-semibold text-[var(--text-3)] uppercase tracking-wider">
                          {stage.label}
                        </span>
                        <span className="ml-auto text-[10px] font-bold" style={{ color: stage.dot }}>
                          {stageItems.length}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {stageItems.length === 0 ? (
                          <p className="text-[var(--text-3)] text-[10px] italic">Empty</p>
                        ) : (
                          stageItems.slice(0, 3).map((p) => (
                            <Link
                              key={p.id}
                              href={`/proposals/${p.id}`}
                              className="block rounded-md px-2.5 py-1.5 hover:bg-[var(--bg-hover)] transition-colors border border-[var(--border)]"
                              style={{ background: stage.bg }}
                            >
                              <p className="text-[var(--text-1)] text-[11px] font-medium truncate leading-tight">
                                {p.data?.title ?? "Untitled"}
                              </p>
                              {p.data?.budget ? (
                                <p className="text-[10px] tabular-nums mt-0.5" style={{ color: stage.dot }}>
                                  {formatINR(p.data.budget)}
                                </p>
                              ) : (
                                <p className="text-[10px] text-[var(--text-3)] mt-0.5">
                                  {p.data?.eventType ?? "—"}
                                </p>
                              )}
                            </Link>
                          ))
                        )}
                        {stageItems.length > 3 && (
                          <p className="text-[10px] text-[var(--text-3)] pl-1">
                            +{stageItems.length - 3} more
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Proposals table */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="text-[var(--text-1)] font-semibold text-sm">Recent Proposals</h3>
              <Link href="/proposals" className="text-indigo-400 text-xs hover:text-indigo-300 transition-colors">
                View all →
              </Link>
            </div>

            {loading ? (
              <div className="p-4 space-y-2">
                {[...Array(4)].map((_, i) => <div key={i} className="h-10 rounded-lg skeleton" />)}
              </div>
            ) : recent.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-[var(--text-3)] text-sm mb-2">No proposals yet.</p>
                <Link href="/proposals/new" className="text-indigo-400 text-sm font-medium hover:text-indigo-300">
                  Create your first proposal →
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      {["Proposal", "Event Type", "Budget", "Status", "Date"].map((h) => (
                        <th key={h} className="text-left px-4 py-2.5 text-[var(--text-3)] text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((p) => (
                      <tr key={p.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-hover)] transition-colors">
                        <td className="px-4 py-2.5">
                          <Link
                            href={`/proposals/${p.id}`}
                            className="text-[var(--text-1)] text-xs font-medium hover:text-indigo-300 transition-colors truncate block max-w-[200px]"
                          >
                            {p.data?.title ?? "Untitled"}
                          </Link>
                          <p className="text-[var(--text-3)] text-[10px] truncate max-w-[200px]">
                            {p.data?.client?.companyName ?? p.data?.location ?? "—"}
                          </p>
                        </td>
                        <td className="px-4 py-2.5 text-[var(--text-3)] text-xs whitespace-nowrap">
                          {p.data?.eventType ?? "—"}
                        </td>
                        <td className="px-4 py-2.5 text-[var(--text-2)] text-xs tabular-nums whitespace-nowrap">
                          {p.data?.budget ? formatINR(p.data.budget) : "—"}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_STYLES[p.data?.status ?? ""] ?? "bg-gray-500/15 text-gray-400"}`}>
                            {statusLabel(p.data?.status)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-[var(--text-3)] text-[10px] whitespace-nowrap">
                          {new Date(p.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>{/* end main column */}

        {/* ══ Sidebar ══════════════════════════════════════════════════════ */}
        <div className="space-y-4">

          {/* Quick Actions */}
          <QuickActions />

        </div>{/* end sidebar */}

      </div>
    </div>
  );
}

// ── MetricCard ────────────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, dot, href, warn }: {
  label: string;
  value: string;
  sub: string;
  dot: string;
  href: string;
  warn?: boolean;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 flex flex-col gap-1.5 hover:border-indigo-500/30 transition-colors group"
    >
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dot }} />
        <span className="text-[10px] font-semibold text-[var(--text-3)] uppercase tracking-wider">{label}</span>
        <svg className="ml-auto w-3 h-3 text-[var(--text-3)] group-hover:text-indigo-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
      <p className={`text-xl font-black tabular-nums leading-tight ${warn ? "text-amber-400" : "text-[var(--text-1)]"}`}>
        {value}
      </p>
      <p className="text-[var(--text-3)] text-[10px]">{sub}</p>
    </Link>
  );
}
