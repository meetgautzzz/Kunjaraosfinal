"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatINR, STATUS_STYLES, type ProposalData } from "@/lib/proposals";

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Partial<ProposalData>[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [search,    setSearch]    = useState("");

  useEffect(() => {
    api.proposals.list()
      .then((data) => setProposals(data as Partial<ProposalData>[]))
      .catch((err) => setError(err.message ?? "Failed to load proposals"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = proposals.filter(
    (p) =>
      !search ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.eventType?.toLowerCase().includes(search.toLowerCase()) ||
      p.location?.toLowerCase().includes(search.toLowerCase()),
  );

  const totalBudget    = proposals.reduce((s, p) => s + Number(p.budget ?? 0), 0);
  const generatedCount = proposals.filter(
    (p) => p.status === "GENERATED" || p.status === "SAVED" || p.status === "SENT"
  ).length;

  return (
    <div className="max-w-7xl mx-auto animate-fade-up" style={{ padding: "0 0 48px" }}>

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-6 mb-8">
        <div className="flex items-start gap-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }}
          >
            <SparkleIcon />
          </div>
          <div>
            <h1 className="t-display">AI Proposals</h1>
            <p className="t-body mt-1">
              Generate, edit, and pitch production-ready event proposals.
            </p>
          </div>
        </div>
        <Link
          href="/proposals/new"
          className="btn-primary shrink-0"
          style={{ fontSize: "13.5px" }}
        >
          <SparkleIcon />
          New Proposal
        </Link>
      </div>

      {/* ── Stats strip ─────────────────────────────────────────────────────── */}
      {!loading && proposals.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-7">
          <div className="stat-card">
            <p className="stat-label">Total Proposals</p>
            <p className="stat-value">{proposals.length}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Generated / Saved</p>
            <p className="stat-value">{generatedCount}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Total Budget</p>
            <p className="stat-value t-num" style={{ fontSize: "18px" }}>{formatINR(totalBudget)}</p>
          </div>
        </div>
      )}

      {/* ── Search bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-7">
        <div
          className="flex items-center gap-3 transition-colors"
          style={{
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            background: "var(--bg-card)",
            width: "300px",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        >
          <SearchIcon />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, type, or location…"
            className="flex-1 bg-transparent text-[var(--text-1)] placeholder:text-[var(--text-3)] outline-none"
            style={{ fontSize: "13.5px" }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors leading-none"
              style={{ fontSize: "11px" }}
            >
              ✕
            </button>
          )}
        </div>
        {!loading && proposals.length > 0 && (
          <span className="t-caption">
            {filtered.length} of {proposals.length} proposals
          </span>
        )}
      </div>

      {/* ── Error ───────────────────────────────────────────────────────────── */}
      {error && (
        <div
          className="t-body mb-6"
          style={{
            padding: "12px 16px",
            borderRadius: "10px",
            background: "var(--red-dim)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#fca5a5",
          }}
        >
          {error}
        </div>
      )}

      {/* ── Loading skeleton ────────────────────────────────────────────────── */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card overflow-hidden animate-pulse">
              <div style={{ height: "3px", background: "var(--border)" }} />
              <div style={{ padding: "20px 22px" }}>
                <div className="flex items-center justify-between mb-4">
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--bg-raised)" }} />
                  <div style={{ width: 60, height: 20, borderRadius: 20, background: "var(--bg-raised)" }} />
                </div>
                <div className="space-y-2 mb-5">
                  <div style={{ height: 15, width: "78%", borderRadius: 6, background: "var(--bg-raised)" }} />
                  <div style={{ height: 12, width: "50%", borderRadius: 6, background: "var(--bg-raised)" }} />
                </div>
                <div style={{ height: 1, background: "var(--border)", margin: "0 0 14px" }} />
                <div className="flex items-center justify-between">
                  <div style={{ height: 14, width: 80, borderRadius: 6, background: "var(--bg-raised)" }} />
                  <div style={{ height: 12, width: 70, borderRadius: 6, background: "var(--bg-raised)" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {!loading && !error && filtered.length === 0 && (
        <div
          className="flex flex-col items-center justify-center text-center"
          style={{
            padding: "80px 24px",
            borderRadius: "16px",
            border: "1px dashed var(--border)",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <SparkleIcon large />
          </div>
          <p className="t-title mb-2">
            {search ? "No matching proposals" : "No proposals yet"}
          </p>
          <p className="t-body" style={{ maxWidth: 300 }}>
            {search
              ? "Try adjusting your search term."
              : "Generate your first AI-powered proposal — full budget, timeline, and visuals."}
          </p>
          {!search && (
            <Link href="/proposals/new" className="btn-primary mt-6" style={{ fontSize: "13.5px" }}>
              <SparkleIcon />
              Create First Proposal
            </Link>
          )}
        </div>
      )}

      {/* ── Proposal cards ──────────────────────────────────────────────────── */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <ProposalCard key={p.id} proposal={p} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Proposal Card ─────────────────────────────────────────────────────────────

function ProposalCard({ proposal: p }: { proposal: Partial<ProposalData> }) {
  const date = p.createdAt
    ? new Date(p.createdAt).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
      })
    : "";
  const isGenerated = p.status === "GENERATED" || p.status === "SAVED" || p.status === "SENT";

  return (
    <Link
      href={`/proposals/${p.id}`}
      className="group card overflow-hidden flex flex-col transition-all duration-200"
      style={{ textDecoration: "none" }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "rgba(99,102,241,0.28)";
        el.style.background = "var(--bg-hover)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "var(--border)";
        el.style.background = "var(--bg-card)";
      }}
    >
      {/* Accent bar */}
      <div
        style={{
          height: "3px",
          background: isGenerated
            ? "linear-gradient(90deg, rgba(99,102,241,0.7) 0%, rgba(139,92,246,0.5) 50%, transparent 100%)"
            : "var(--border)",
          flexShrink: 0,
          transition: "opacity 0.2s",
        }}
      />

      <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>

        {/* Top: icon + status */}
        <div className="flex items-start justify-between gap-2">
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#a5b4fc",
              flexShrink: 0,
            }}
          >
            <SparkleIcon />
          </div>
          <span
            className={`text-[10.5px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest shrink-0 ${
              STATUS_STYLES[p.status ?? "DRAFT"]
            }`}
          >
            {p.status}
          </span>
        </div>

        {/* Title + meta */}
        <div style={{ flex: 1 }}>
          <h3
            className="t-title line-clamp-2 group-hover:text-indigo-200 transition-colors"
            style={{ marginBottom: 6 }}
          >
            {p.title}
          </h3>
          <p className="t-caption">
            {[p.eventType, p.location].filter(Boolean).join("  ·  ")}
          </p>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between"
          style={{ paddingTop: 14, borderTop: "1px solid var(--border)" }}
        >
          <span
            className="t-num font-bold"
            style={{ fontSize: "14px", color: "var(--text-1)" }}
          >
            {formatINR(Number(p.budget) ?? 0)}
          </span>
          <span className="t-caption">{date}</span>
        </div>
      </div>
    </Link>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg
      style={{ width: 15, height: 15, color: "var(--text-3)", flexShrink: 0 }}
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function SparkleIcon({ large }: { large?: boolean }) {
  return (
    <svg
      style={{ width: large ? 26 : 15, height: large ? 26 : 15, color: large ? "#a5b4fc" : "currentColor" }}
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" />
    </svg>
  );
}
