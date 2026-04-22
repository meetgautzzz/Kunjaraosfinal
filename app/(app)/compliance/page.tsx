"use client";

import { useState, useMemo } from "react";
import {
  ComplianceItem,
  ComplianceStatus,
  MOCK_ITEMS,
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
  const [items,        setItems]        = useState<ComplianceItem[]>(MOCK_ITEMS);
  const [filter,       setFilter]       = useState<FilterStatus>("ALL");
  const [search,       setSearch]       = useState("");
  const [showGenerate, setShowGenerate] = useState(false);

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

  function updateItem(updated: ComplianceItem) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }

  function handleGenerate(newItems: ComplianceItem[]) {
    setItems(newItems);
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
        <button
          onClick={() => setShowGenerate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors"
        >
          <span className="text-base leading-none">⚡</span> Generate Checklist
        </button>
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
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[var(--text-3)] text-sm">No permits match the current filter.</p>
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
    </div>
  );
}
