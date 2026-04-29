"use client";

import { useState, useMemo, useEffect } from "react";
import {
  calcItem, calcTotals, formatINR, newItem,
  GST_RATES, CATEGORIES, DEFAULT_META, DEFAULT_TERMS,
  type BudgetItem, type BudgetMeta,
} from "@/lib/budget";
import { useBranding } from "@/lib/branding";
import BudgetTotalsPanel  from "./BudgetTotalsPanel";
import BudgetItemRow      from "./BudgetItemRow";
import ClientSection      from "./ClientSection";
import TermsSection       from "./TermsSection";
import InvoicePreview     from "./InvoicePreview";
import InvoiceA4          from "@/components/InvoiceA4";

type View = "builder" | "preview";

type Props = {
  budgetId?:    string;
  initialMeta?: BudgetMeta;
  initialItems?: BudgetItem[];
  onBack?:      () => void;
  onSave?:      (meta: BudgetMeta, items: BudgetItem[]) => void;
};

export default function BudgetBuilder({ budgetId, initialMeta, initialItems, onBack, onSave }: Props = {}) {
  const [meta,      setMeta]      = useState<BudgetMeta>({ ...DEFAULT_META, ...initialMeta });
  const [items,     setItems]     = useState<BudgetItem[]>(initialItems ?? []);
  const [view,      setView]      = useState<View>("builder");
  const [saved,     setSaved]     = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const { branding } = useBranding();

  useEffect(() => {
    if (initialMeta) setMeta({
      ...DEFAULT_META,
      ...initialMeta,
      documentType:  initialMeta.documentType  ?? "estimate",
      status:        initialMeta.status        ?? "draft",
      terms:         initialMeta.terms?.length  ? initialMeta.terms : DEFAULT_TERMS,
      clientCompany: initialMeta.clientCompany ?? "",
      clientAddress: initialMeta.clientAddress ?? "",
      clientGST:     initialMeta.clientGST     ?? "",
    });
  }, [initialMeta]);
  useEffect(() => { if (initialItems) setItems(initialItems); }, [initialItems]);

  const totals = useMemo(() => calcTotals(items, meta), [items, meta]);

  // ── item mutations ─────────────────────────────────────────────────────────
  function addItem(category?: string) {
    setItems((prev) => {
      const next = [...prev, newItem({ category: category ?? "Venue" })];
      onSave?.(meta, next);
      return next;
    });
  }

  function updateItem(id: string, patch: Partial<BudgetItem>) {
    setItems((prev) => {
      const next = prev.map((it) => (it.id === id ? { ...it, ...patch } : it));
      onSave?.(meta, next);
      return next;
    });
  }

  function removeItem(id: string) {
    setItems((prev) => {
      const next = prev.filter((it) => it.id !== id);
      onSave?.(meta, next);
      return next;
    });
  }

  function duplicateItem(id: string) {
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.id === id);
      if (idx === -1) return prev;
      const copy = { ...prev[idx], id: crypto.randomUUID() };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      onSave?.(meta, next);
      return next;
    });
  }

  function toggleCategory(cat: string) {
    setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }));
  }

  function handleMetaChange(next: BudgetMeta) {
    setMeta(next);
    onSave?.(next, items);
  }

  function handleSave() {
    onSave?.(meta, items);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const grouped = useMemo(() => {
    const map: Record<string, BudgetItem[]> = {};
    for (const item of items) {
      if (!map[item.category]) map[item.category] = [];
      map[item.category].push(item);
    }
    return map;
  }, [items]);

  if (view === "preview") {
    return (
      <InvoicePreview
        meta={meta}
        items={items}
        budgetId={budgetId}
        onBack={() => setView("builder")}
      />
    );
  }

  return (
    <div className="max-w-[1680px] mx-auto">
    <div className="flex gap-6 items-start">

    {/* ══ LEFT: form panel ═══════════════════════════════════════════════════ */}
    <div className="flex-1 min-w-0 space-y-4">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors text-sm">
              ← Back
            </button>
          )}
          <div>
            <input
              value={meta.title}
              onChange={(e) => handleMetaChange({ ...meta, title: e.target.value })}
              placeholder="Document title"
              className="text-xl font-bold text-[var(--text-1)] bg-transparent outline-none border-b border-transparent hover:border-[var(--border)] focus:border-indigo-500/60 transition-colors"
            />
            <p className="text-[var(--text-3)] text-xs mt-0.5">
              {budgetId ? "Auto-saving · " : ""}
              {meta.documentType === "invoice" ? "Invoice" : "Estimate"} · {meta.status === "final" ? "Final" : "Draft"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Document type toggle */}
          <div className="flex rounded-lg border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden text-xs font-semibold">
            {(["estimate", "invoice"] as const).map((t) => (
              <button
                key={t}
                onClick={() => handleMetaChange({ ...meta, documentType: t })}
                className={`px-3 py-1.5 transition-colors capitalize ${
                  meta.documentType === t
                    ? t === "invoice"
                      ? "bg-indigo-500 text-white"
                      : "bg-emerald-500 text-white"
                    : "text-[var(--text-3)] hover:text-[var(--text-1)]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Status toggle */}
          <div className="flex rounded-lg border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden text-xs font-semibold">
            {(["draft", "final"] as const).map((s) => (
              <button
                key={s}
                onClick={() => handleMetaChange({ ...meta, status: s })}
                className={`px-3 py-1.5 transition-colors capitalize ${
                  meta.status === s
                    ? s === "final"
                      ? "bg-indigo-500 text-white"
                      : "bg-amber-500 text-white"
                    : "text-[var(--text-3)] hover:text-[var(--text-1)]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <button
            onClick={() => setView("preview")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-2)] hover:text-[var(--text-1)] text-sm transition-colors"
          >
            <EyeIcon /> Preview
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors"
          >
            {saved ? "✓ Saved" : "Save"}
          </button>
        </div>
      </div>

      {/* ── Row 1: Client + Document meta ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Client details (wider) */}
        <div className="lg:col-span-2">
          <ClientSection meta={meta} onChange={handleMetaChange} />
        </div>

        {/* Document meta (narrower) */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-surface)]">
            <p className="text-[var(--text-2)] text-xs font-semibold uppercase tracking-wider">Document Details</p>
          </div>
          <div className="px-4 py-3 space-y-3">
            <DocField label="Event / Project">
              <input
                value={meta.eventType}
                onChange={(e) => handleMetaChange({ ...meta, eventType: e.target.value })}
                placeholder="e.g. Corporate Gala 2025"
                className={INPUT}
              />
            </DocField>
            <DocField label="Currency">
              <select
                value={meta.currency}
                onChange={(e) => handleMetaChange({ ...meta, currency: e.target.value })}
                className={INPUT + " cursor-pointer"}
              >
                <option value="INR">INR — Indian Rupee</option>
                <option value="USD">USD — US Dollar</option>
                <option value="AED">AED — UAE Dirham</option>
                <option value="GBP">GBP — British Pound</option>
              </select>
            </DocField>
            <DocField label="Global Margin %">
              <div className="flex items-center gap-2">
                <input
                  type="range" min={0} max={50} step={1}
                  value={meta.globalMargin}
                  onChange={(e) => handleMetaChange({ ...meta, globalMargin: Number(e.target.value) })}
                  className="flex-1 accent-indigo-500"
                />
                <span className={`text-sm font-semibold tabular-nums w-8 text-right ${meta.globalMargin > 0 ? "text-indigo-400" : "text-[var(--text-3)]"}`}>
                  {meta.globalMargin}%
                </span>
              </div>
            </DocField>
            <DocField label="Hide costs from client">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-3)] text-xs">Show line item pricing</span>
                <Toggle
                  checked={meta.hideClientCosts}
                  onChange={(v) => handleMetaChange({ ...meta, hideClientCosts: v })}
                />
              </div>
            </DocField>
          </div>
        </div>
      </div>

      {/* ── Row 2: Line items + Totals ────────────────────────────────────────── */}
      <div className="flex gap-4 items-start">

        {/* Items table */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Column headers */}
          <div className="grid budget-cols gap-2 px-4 text-[var(--text-3)] text-xs font-medium uppercase tracking-wider">
            <span className="col-span-3">Item</span>
            <span className="text-center">Unit</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Rate</span>
            <span className="text-center">GST%</span>
            <span className="text-right">Margin</span>
            <span className="text-right">GST Amt</span>
            <span className="text-right font-semibold text-[var(--text-2)]">Total</span>
            <span />
          </div>

          {Object.entries(grouped).map(([cat, catItems]) => {
            const catTotal    = catItems.reduce((s, it) => s + calcItem(it, meta.globalMargin).total, 0);
            const isCollapsed = collapsed[cat];
            return (
              <div key={cat} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
                <div
                  className="flex items-center gap-3 px-4 py-3 bg-[var(--bg-surface)] border-b border-[var(--border)] cursor-pointer hover:bg-[var(--bg-hover)] transition-colors select-none"
                  onClick={() => toggleCategory(cat)}
                >
                  <span className={`text-[var(--text-3)] text-xs transition-transform ${isCollapsed ? "" : "rotate-90"}`}>▶</span>
                  <span className="text-[var(--text-1)] text-sm font-semibold flex-1">{cat}</span>
                  <span className="text-[var(--text-3)] text-xs">{catItems.length} item{catItems.length !== 1 ? "s" : ""}</span>
                  <span className="text-[var(--text-1)] text-sm font-bold">{formatINR(catTotal)}</span>
                </div>
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

          {/* Add new category buttons */}
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

        {/* Totals */}
        <div className="w-72 shrink-0 sticky top-4">
          <BudgetTotalsPanel totals={totals} meta={meta} onMetaChange={(m) => handleMetaChange(m)} />
        </div>
      </div>

      {/* ── Row 3: Terms & Conditions ────────────────────────────────────────── */}
      <TermsSection meta={meta} onChange={handleMetaChange} />

    </div>{/* end left panel */}

    {/* ══ RIGHT: live preview (xl+ only) ════════════════════════════════════ */}
    <div className="hidden xl:flex flex-col gap-2 w-[440px] shrink-0 sticky top-4 self-start">
      {/* panel header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-semibold text-[var(--text-3)] uppercase tracking-widest">
          Live Preview
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setView("preview")}
            className="text-[11px] text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors px-2 py-1 rounded"
          >
            Full view
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-[11px] font-semibold transition-colors"
          >
            <PrintIcon /> Print / PDF
          </button>
        </div>
      </div>

      {/* scaled A4 document */}
      <div
        className="rounded-xl border border-[var(--border)] overflow-hidden"
        style={{
          maxHeight: "calc(100vh - 80px)",
          overflowY: "auto",
          boxShadow: "0 8px 32px rgba(0,0,0,0.28)",
        }}
      >
        <div style={{ zoom: 440 / 794 }}>
          <InvoiceA4
            meta={meta}
            items={items}
            branding={branding}
            budgetId={budgetId}
          />
        </div>
      </div>
    </div>

    </div>{/* end flex row */}
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────
function PrintIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
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

const INPUT = "w-full bg-transparent text-[var(--text-1)] text-sm outline-none border-b border-[var(--border)] focus:border-indigo-500/60 py-1 transition-colors placeholder:text-[var(--text-3)]";

function DocField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[var(--text-3)] text-[11px] font-medium mb-1 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${checked ? "bg-indigo-500" : "bg-[var(--border)]"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : ""}`} />
    </button>
  );
}
