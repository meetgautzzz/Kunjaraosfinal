"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ComplianceItem,
  ComplianceStatus,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  deadlineState,
} from "@/lib/compliance";
import ComplianceProgress   from "@/components/compliance/ComplianceProgress";
import DeadlineAlerts       from "@/components/compliance/DeadlineAlerts";
import ComplianceItemRow    from "@/components/compliance/ComplianceItem";
import GenerateModal        from "@/components/compliance/GenerateModal";

type FilterStatus = "ALL" | ComplianceStatus;

const STATUS_FILTERS: { label: string; value: FilterStatus }[] = [
  { label: "All",         value: "ALL"         },
  { label: "Approved",    value: "APPROVED"    },
  { label: "Submitted",   value: "SUBMITTED"   },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Not Started", value: "NOT_STARTED" },
  { label: "Rejected",    value: "REJECTED"    },
];

export default function CompliancePage() {
  const [items,        setItems]        = useState<ComplianceItem[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState<FilterStatus>("ALL");
  const [search,       setSearch]       = useState("");
  const [showGenerate, setShowGenerate] = useState(false);
  const [showRisk,     setShowRisk]     = useState(false);

  useEffect(() => {
    fetch("/api/compliance")
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return items
      .filter((item) => filter === "ALL" || item.status === filter)
      .filter((item) =>
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.authority.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => {
        // Sort: overdue first → urgent → upcoming → by priority
        const ds = (i: ComplianceItem) => {
          const d = deadlineState(i);
          return d === "overdue" ? 0 : d === "urgent" ? 1 : d === "upcoming" ? 2 : 3;
        };
        const pd = (i: ComplianceItem) => {
          const p = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
          return p[i.priority];
        };
        const dsDiff = ds(a) - ds(b);
        return dsDiff !== 0 ? dsDiff : pd(a) - pd(b);
      });
  }, [items, filter, search]);

  async function updateItem(updated: ComplianceItem) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    // Persist to DB
    await fetch(`/api/compliance/${updated.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status:       updated.status,
        priority:     updated.priority,
        notes:        updated.notes,
        deadline:     updated.deadline,
        submittedAt:  updated.submittedAt,
        approvedAt:   updated.approvedAt,
        documentName: updated.documentName,
        documentUrl:  updated.documentUrl,
      }),
    });
  }

  async function handleGenerate(newItems: ComplianceItem[]) {
    // Bulk-save generated items to DB
    const res = await fetch("/api/compliance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newItems.map((item) => ({
        type:            item.type,
        name:            item.name,
        authority:       item.authority,
        description:     item.description,
        instructions:    item.instructions,
        status:          item.status,
        priority:        item.priority,
        deadline:        item.deadline ?? null,
        notes:           item.notes,
        fee:             item.fee,
        processing_days: item.processingDays,
      }))),
    });
    if (res.ok) {
      const saved = await res.json();
      setItems(Array.isArray(saved) ? saved : newItems);
    } else {
      setItems(newItems);
    }
  }

  const overdueCnt = items.filter((i) => deadlineState(i) === "overdue").length;
  const urgentCnt  = items.filter((i) => deadlineState(i) === "urgent").length;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-1)]">Compliance</h2>
          <p className="text-[var(--text-2)] text-sm mt-1">
            Track permits, licences, and regulatory clearances for your events.
            {(overdueCnt > 0 || urgentCnt > 0) && (
              <span className="text-red-400 ml-2 font-medium">
                {overdueCnt > 0 && `${overdueCnt} overdue`}
                {overdueCnt > 0 && urgentCnt > 0 && " · "}
                {urgentCnt > 0 && `${urgentCnt} urgent`}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRisk(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-sm font-semibold transition-colors"
          >
            <span className="text-base leading-none">🔍</span> Risk Analysis
          </button>
          <button
            onClick={() => setShowGenerate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors"
          >
            <span className="text-base leading-none">⚡</span> Generate Checklist
          </button>
        </div>
      </div>

      {/* Score */}
      <ComplianceProgress items={items} />

      {/* Deadline alerts */}
      <DeadlineAlerts items={items} />

      {/* Checklist panel */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
        {/* Toolbar */}
        <div className="px-5 py-3.5 border-b border-[var(--border)] flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-3)]"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search permits…"
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--bg-surface)] border border-[var(--border)] focus:border-indigo-500/50 rounded-lg outline-none text-[var(--text-1)] placeholder:text-[var(--text-3)]"
            />
          </div>

          {/* Status filters */}
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map(({ label, value }) => {
              const count = value === "ALL" ? items.length : items.filter((i) => i.status === value).length;
              if (value !== "ALL" && count === 0) return null;
              const cfg = value !== "ALL" ? STATUS_CONFIG[value as ComplianceStatus] : null;
              return (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                    filter === value
                      ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400"
                      : "border-[var(--border)] text-[var(--text-3)] hover:text-[var(--text-2)]"
                  }`}
                >
                  {label}
                  <span className={`ml-1 opacity-60 ${cfg ? cfg.color : ""}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Column headers */}
        <div className="hidden sm:flex items-center gap-3 px-5 py-2 border-b border-[var(--border)] bg-[var(--bg-surface)]">
          <div className="w-2" />
          <p className="flex-1 text-[11px] text-[var(--text-3)] uppercase tracking-wide font-medium">Permit</p>
          <p className="w-20 text-[11px] text-[var(--text-3)] uppercase tracking-wide font-medium text-right">Deadline</p>
          <p className="w-24 text-[11px] text-[var(--text-3)] uppercase tracking-wide font-medium text-right">Status</p>
          <div className="w-4" />
        </div>

        {/* Items */}
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-[var(--bg-surface)] animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[var(--text-3)] text-sm">
              {items.length === 0 ? "No compliance items yet. Use Generate Checklist to get started." : "No permits match the current filter."}
            </p>
          </div>
        ) : (
          <div>
            {filtered.map((item) => (
              <ComplianceItemRow key={item.id} item={item} onChange={updateItem} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--bg-surface)] flex items-center justify-between">
          <p className="text-[var(--text-3)] text-xs">{filtered.length} of {items.length} permits</p>
          <div className="flex gap-3">
            {(Object.keys(PRIORITY_CONFIG) as (keyof typeof PRIORITY_CONFIG)[]).map((p) => (
              <div key={p} className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_CONFIG[p].dot}`} />
                <span className="text-[var(--text-3)] text-[11px]">{PRIORITY_CONFIG[p].label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Generate modal */}
      {showGenerate && (
        <GenerateModal
          onGenerate={handleGenerate}
          onClose={() => setShowGenerate(false)}
        />
      )}

      {showRisk && (
        <RiskModal onClose={() => setShowRisk(false)} />
      )}
    </div>
  );
}

// ── AI Risk Analysis Modal ─────────────────────────────────────────────────────

type Risk = {
  severity:   "HIGH" | "MEDIUM" | "LOW";
  category:   string;
  risk:       string;
  mitigation: string;
};

const EVENT_TYPES_RISK = [
  "Corporate Gala", "Conference", "Product Launch", "Wedding",
  "Concert", "Brand Activation", "Awards Night", "Team Retreat",
  "Exhibition", "Fundraiser", "Sports Event", "Workshop",
];

function RiskModal({ onClose }: { onClose: () => void }) {
  const [eventType,  setEventType]  = useState("Corporate Gala");
  const [location,   setLocation]   = useState("");
  const [budget,     setBudget]     = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [eventDate,  setEventDate]  = useState("");
  const [loading,    setLoading]    = useState(false);
  const [risks,      setRisks]      = useState<Risk[]>([]);
  const [error,      setError]      = useState("");

  async function handleAnalyse() {
    setLoading(true);
    setError("");
    setRisks([]);
    try {
      const res = await fetch("/api/ai/compliance-risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType,
          location:   location || undefined,
          budget:     budget ? Number(budget) : undefined,
          guestCount: guestCount ? Number(guestCount) : undefined,
          eventDate:  eventDate || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setRisks(json.risks ?? []);
    } catch {
      setError("Risk analysis failed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const SEV_CONFIG = {
    HIGH:   { label: "High",   cls: "bg-red-500/15 border-red-500/30 text-red-400",    dot: "bg-red-500"    },
    MEDIUM: { label: "Medium", cls: "bg-amber-500/15 border-amber-500/30 text-amber-400", dot: "bg-amber-500" },
    LOW:    { label: "Low",    cls: "bg-blue-500/15 border-blue-500/30 text-blue-400",  dot: "bg-blue-400"   },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[var(--text-1)] font-bold text-base flex items-center gap-2">
                🔍 AI Risk Analysis
              </h3>
              <p className="text-[var(--text-3)] text-xs mt-0.5">Identify compliance risks before your event day.</p>
            </div>
            <button onClick={onClose} className="text-[var(--text-3)] hover:text-[var(--text-1)] text-xl leading-none">×</button>
          </div>
        </div>

        {/* Form */}
        <div className="px-6 py-5 border-b border-[var(--border)] shrink-0">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[var(--text-2)] text-xs font-medium mb-1.5">Event Type <span className="text-red-400">*</span></label>
              <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-1)] focus:border-indigo-500/50 outline-none">
                {EVENT_TYPES_RISK.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[var(--text-2)] text-xs font-medium mb-1.5">Location</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Mumbai, Maharashtra" className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)]/60 focus:border-indigo-500/50 outline-none" />
            </div>
            <div>
              <label className="block text-[var(--text-2)] text-xs font-medium mb-1.5">Budget (₹)</label>
              <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g. 1000000" className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)]/60 focus:border-indigo-500/50 outline-none" />
            </div>
            <div>
              <label className="block text-[var(--text-2)] text-xs font-medium mb-1.5">Guest Count</label>
              <input type="number" value={guestCount} onChange={(e) => setGuestCount(e.target.value)} placeholder="e.g. 500" className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)]/60 focus:border-indigo-500/50 outline-none" />
            </div>
            <div className="col-span-2">
              <label className="block text-[var(--text-2)] text-xs font-medium mb-1.5">Event Date</label>
              <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-1)] focus:border-indigo-500/50 outline-none" style={{ colorScheme: "dark" }} />
            </div>
          </div>
          <div className="flex justify-end mt-3">
            <button
              onClick={handleAnalyse}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Analysing…
                </>
              ) : "Analyse Risks"}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-3">
          {error && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}

          {risks.length === 0 && !loading && !error && (
            <div className="text-center py-10">
              <p className="text-4xl mb-3">🛡️</p>
              <p className="text-[var(--text-3)] text-sm">Fill in the event details and click Analyse Risks.</p>
            </div>
          )}

          {risks.map((r, i) => {
            const cfg = SEV_CONFIG[r.severity] ?? SEV_CONFIG.LOW;
            return (
              <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}>{cfg.label} Risk</span>
                  <span className="text-[var(--text-3)] text-xs">{r.category}</span>
                </div>
                <p className="text-[var(--text-1)] text-sm font-medium">{r.risk}</p>
                <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border)] px-3 py-2">
                  <p className="text-[var(--text-3)] text-[11px] uppercase tracking-wide font-medium mb-1">Mitigation</p>
                  <p className="text-[var(--text-2)] text-xs leading-relaxed">{r.mitigation}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
