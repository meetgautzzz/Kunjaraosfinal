"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import type { ProposalData } from "@/lib/proposals";
import { formatINR } from "@/lib/proposals";

type ProposalRow = { id: string; data: ProposalData; created_at: string };

const PIPELINE = ["Lead", "Proposal Sent", "Negotiation", "Won", "Execution", "Completed", "Lost"] as const;
type Stage = typeof PIPELINE[number];

const STAGE_STYLE: Record<Stage, string> = {
  "Lead":          "bg-sky-500/15 text-sky-400",
  "Proposal Sent": "bg-indigo-500/15 text-indigo-400",
  "Negotiation":   "bg-amber-500/15 text-amber-400",
  "Won":           "bg-emerald-500/15 text-emerald-400",
  "Execution":     "bg-violet-500/15 text-violet-400",
  "Completed":     "bg-emerald-700/20 text-emerald-300",
  "Lost":          "bg-red-500/15 text-red-400",
};

function proposalToStage(status: string | undefined): Stage {
  const s = (status ?? "").toUpperCase();
  if (s === "APPROVED")                    return "Won";
  if (s === "LOST")                        return "Lost";
  if (s === "CHANGES_REQUESTED")           return "Negotiation";
  if (s === "SENT" || s === "SHARED")      return "Proposal Sent";
  if (s === "GENERATED" || s === "SAVED")  return "Lead";
  if (s === "DRAFT")                       return "Lead";
  return "Lead";
}

export default function EventsPage() {
  const [rows,    setRows]    = useState<ProposalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState<Stage | "All">("All");

  useEffect(() => {
    const load = () =>
      fetch("/api/proposals")
        .then((r) => r.ok ? r.json() : [])
        .then((data) => setRows(Array.isArray(data) ? data : []))
        .catch(() => setRows([]));

    load().finally(() => setLoading(false));

    const onVisible = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const events = useMemo(() =>
    rows.map((r) => ({
      id:       r.id,
      title:    r.data?.title    ?? "Untitled Event",
      client:   r.data?.client?.companyName ?? r.data?.requirements?.split(" ").slice(0, 3).join(" ") ?? "—",
      type:     r.data?.eventType ?? "Event",
      location: r.data?.location  ?? "—",
      budget:   r.data?.budget    ?? 0,
      date:     r.data?.eventDate ?? null,
      stage:    proposalToStage(r.data?.status),
      created:  r.created_at,
    })),
    [rows]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: events.length };
    PIPELINE.forEach((s) => { c[s] = events.filter((e) => e.stage === s).length; });
    return c;
  }, [events]);

  const filtered = useMemo(
    () => tab === "All" ? events : events.filter((e) => e.stage === tab),
    [events, tab]
  );

  const totalRevenue = useMemo(
    () => events
      .filter((e) => e.stage === "Won" || e.stage === "Execution" || e.stage === "Completed")
      .reduce((sum, e) => sum + e.budget, 0),
    [events]
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-1)]">Events Pipeline</h2>
          <p className="text-[var(--text-2)] text-sm mt-1">
            {events.length} event{events.length !== 1 ? "s" : ""} · pipeline from lead to completion.
          </p>
        </div>
        <Link
          href="/proposals/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors"
        >
          + New Event
        </Link>
      </div>

      {/* Revenue summary */}
      {totalRevenue > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["Won", "Execution", "Completed", "Lost"] as Stage[]).map((s) => {
            const stageEvents = events.filter((e) => e.stage === s);
            const total = stageEvents.reduce((sum, e) => sum + e.budget, 0);
            return (
              <div key={s} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
                <p className="text-[var(--text-3)] text-xs mb-1">{s}</p>
                <p className="text-[var(--text-1)] font-bold text-base tabular-nums">{formatINR(total)}</p>
                <p className="text-[var(--text-3)] text-[11px] mt-0.5">{stageEvents.length} event{stageEvents.length !== 1 ? "s" : ""}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Stage tabs */}
      <div className="flex flex-wrap gap-2">
        {(["All", ...PIPELINE] as const).map((s) => {
          const cnt = counts[s] ?? 0;
          if (s !== "All" && cnt === 0) return null;
          const active = tab === s;
          return (
            <button
              key={s}
              onClick={() => setTab(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                active
                  ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400"
                  : "border-[var(--border)] text-[var(--text-2)] hover:border-indigo-500/30 hover:text-[var(--text-1)]"
              }`}
            >
              {s} <span className="opacity-60 ml-1">{cnt}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 animate-pulse h-40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] p-16 text-center">
          <p className="text-3xl mb-3">🎪</p>
          <p className="text-[var(--text-1)] font-semibold text-sm mb-1">
            {events.length === 0 ? "No events yet" : `No ${tab} events`}
          </p>
          <p className="text-[var(--text-3)] text-xs mb-4">
            {events.length === 0
              ? "Generate your first AI proposal to create an event."
              : "Try a different pipeline stage."}
          </p>
          {events.length === 0 && (
            <Link
              href="/proposals/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors"
            >
              Create first event →
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((e) => (
            <div
              key={e.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 flex flex-col gap-3 hover:border-indigo-500/30 transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[var(--text-1)] font-semibold text-sm truncate">{e.title}</p>
                  <p className="text-[var(--text-3)] text-xs mt-0.5 truncate">{e.client}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${STAGE_STYLE[e.stage]}`}>
                  {e.stage}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-[var(--text-3)] flex-wrap">
                <span>📍 {e.location}</span>
                <span>🎯 {e.type}</span>
                {e.date && <span>📅 {e.date}</span>}
              </div>

              {e.budget > 0 && (
                <div className="pt-1 border-t border-[var(--border)] flex items-center justify-between">
                  <span className="text-[var(--text-3)] text-xs">Budget</span>
                  <span className="text-[var(--text-1)] font-bold text-sm tabular-nums">{formatINR(e.budget)}</span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Link
                  href={`/events/${e.id}/room`}
                  className="flex-1 text-center text-xs font-semibold py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-colors"
                  onClick={(ev) => ev.stopPropagation()}
                >
                  Open Event Room →
                </Link>
                <Link
                  href={`/proposals/${e.id}`}
                  className="px-3 py-2 text-xs font-medium rounded-lg border border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text-1)] hover:border-indigo-500/30 transition-colors"
                  onClick={(ev) => ev.stopPropagation()}
                >
                  Proposal
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
