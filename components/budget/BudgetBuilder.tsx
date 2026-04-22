"use client";

import { useState, useMemo } from "react";
import {
  calcItem, calcTotals, formatINR, newItem,
  GST_RATES, CATEGORIES, SAMPLE_ITEMS, DEFAULT_META,
  type BudgetItem, type BudgetMeta,
} from "@/lib/budget";
import BudgetTotalsPanel  from "./BudgetTotalsPanel";
import BudgetItemRow      from "./BudgetItemRow";
import BudgetMetaBar      from "./BudgetMetaBar";
import BudgetClientView   from "./BudgetClientView";

type View = "builder" | "client";

export default function BudgetBuilder() {
  const [meta,      setMeta]      = useState<BudgetMeta>(DEFAULT_META);
  const [items,     setItems]     = useState<BudgetItem[]>(SAMPLE_ITEMS);
  const [view,      setView]      = useState<View>("builder");
  const [saved,     setSaved]     = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const totals = useMemo(() => calcTotals(items, meta), [items, meta]);

  // ── item mutations ─────────────────────────────────────────────────────────
  function addItem(category?: string) {
    setItems((prev) => [...prev, newItem({ category: category ?? "Venue" })]);
  }

  function updateItem(id: string, patch: Partial<BudgetItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  function duplicateItem(id: string) {
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.id === id);
      if (idx === -1) return prev;
      const copy = { ...prev[idx], id: crypto.randomUUID() };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  }

  function toggleCategory(cat: string) {
    setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }));
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  // Group items by category
  const grouped = useMemo(() => {
    const map: Record<string, BudgetItem[]> = {};
    for (const item of items) {
      if (!map[item.category]) map[item.category] = [];
      map[item.category].push(item);
    }
    return map;
  }, [items]);

  if (view === "client") {
    return (
      <BudgetClientView
        meta={meta}
        items={items}
        totals={totals}
        onBack={() => setView("builder")}
      />
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-1)]">Budget Builder</h2>
          <p className="text-[var(--text-2)] text-sm mt-0.5">
            Build event budgets with GST, margins, and client-ready exports.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("client")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-2)] hover:text-[var(--text-1)] text-sm transition-colors"
          >
            <EyeIcon /> Client View
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors"
          >
            {saved ? "✓ Saved" : "Save Budget"}
          </button>
        </div>
      </div>

      {/* Meta bar */}
      <BudgetMetaBar meta={meta} onChange={setMeta} />

      {/* Main grid: table + totals */}
      <div className="flex gap-5 items-start">

        {/* ── Left: Line items ────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-3">

          {/* Column headers */}
          <div className="grid budget-cols gap-2 px-4 text-[var(--text-3)] text-xs font-medium uppercase tracking-wider">
            <span className="col-span-3">Description</span>
            <span className="text-center">Unit</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Unit Cost</span>
            <span className="text-center">GST %</span>
            <span className="text-right">Margin %</span>
            <span className="text-right">GST Amt</span>
            <span className="text-right font-semibold text-[var(--text-2)]">Total</span>
            <span />
          </div>

          {/* Categories */}
          {Object.entries(grouped).map(([cat, catItems]) => {
            const catTotal = catItems.reduce((s, it) => s + calcItem(it, meta.globalMargin).total, 0);
            const isCollapsed = collapsed[cat];
            return (
              <div key={cat} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
                {/* Category header */}
                <div
                  className="flex items-center gap-3 px-4 py-3 bg-[var(--bg-surface)] border-b border-[var(--border)] cursor-pointer hover:bg-[var(--bg-hover)] transition-colors select-none"
                  onClick={() => toggleCategory(cat)}
                >
                  <span className={`text-[var(--text-3)] text-xs transition-transform ${isCollapsed ? "" : "rotate-90"}`}>▶</span>
                  <span className="text-[var(--text-1)] text-sm font-semibold flex-1">{cat}</span>
                  <span className="text-[var(--text-3)] text-xs">{catItems.length} item{catItems.length !== 1 ? "s" : ""}</span>
                  <span className="text-[var(--text-1)] text-sm font-bold">{formatINR(catTotal)}</span>
                </div>

                {/* Rows */}
                {!isCollapsed && (
                  <div className="divide-y divide-[var(--border)]">
                    {catItems.map((item) => (
                      <BudgetItemRow
                        key={item.id}
                        item={item}
                        globalMargin={meta.globalMargin}
                        onChange={(patch) => updateItem(item.id, patch)}
                        onRemove={() => removeItem(item.id)}
                        onDuplicate={() => duplicateItem(item.id)}
                      />
                    ))}
                    {/* Add row inside category */}
                    <button
                      onClick={() => addItem(cat)}
                      className="w-full px-4 py-2.5 text-left text-xs text-indigo-400 hover:text-indigo-300 hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      + Add item to {cat}
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add new category */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.filter((c) => !grouped[c]).map((cat) => (
              <button
                key={cat}
                onClick={() => addItem(cat)}
                className="px-3 py-1.5 rounded-lg border border-dashed border-[var(--border)] text-[var(--text-3)] text-xs hover:border-indigo-500/40 hover:text-indigo-400 transition-colors"
              >
                + {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── Right: Totals panel ──────────────────────────────────────────── */}
        <div className="w-72 shrink-0 sticky top-4">
          <BudgetTotalsPanel totals={totals} meta={meta} onMetaChange={setMeta} />
        </div>
      </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
