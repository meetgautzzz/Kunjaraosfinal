"use client";

import { formatINR, type BudgetTotals, type BudgetMeta } from "@/lib/budget";

type Props = {
  totals:       BudgetTotals;
  meta:         BudgetMeta;
  onMetaChange: (m: BudgetMeta) => void;
};

export default function BudgetTotalsPanel({ totals, meta, onMetaChange }: Props) {
  const gstEntries = Object.entries(totals.gstBreakdown).filter(([, amt]) => amt > 0);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">

      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-surface)] flex items-center justify-between">
        <span className="text-[var(--text-1)] text-sm font-semibold">Live Totals</span>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Real-time" />
      </div>

      <div className="p-4 space-y-4">

        {/* Calculation waterfall */}
        <div className="space-y-1.5">
          <Row label="Subtotal"        value={formatINR(totals.subtotal)}    muted />
          <Row label="Commission"      value={formatINR(totals.totalMargin)} accent="emerald" />
          <div className="border-t border-[var(--border)] my-1" />
          <Row label="Taxable Value"   value={formatINR(totals.subtotal + totals.totalMargin)} />

          {/* GST breakdown */}
          {gstEntries.length > 0 && (
            <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] p-2.5 space-y-1.5 mt-2">
              <p className="text-[var(--text-3)] text-xs font-medium uppercase tracking-wider mb-2">GST Breakdown</p>
              {gstEntries.map(([rate, amt]) => (
                <Row key={rate} label={`GST @ ${rate}%`} value={formatINR(amt)} muted small />
              ))}
              <div className="border-t border-[var(--border)] pt-1.5 mt-1.5">
                <Row label="Total GST" value={formatINR(totals.totalGST)} accent="amber" />
              </div>
            </div>
          )}
        </div>

        {/* Grand Total */}
        <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 px-4 py-4">
          <p className="text-[var(--text-3)] text-xs mb-1">Grand Total (incl. GST + Commission)</p>
          <p className="text-[var(--text-1)] text-2xl font-black tabular-nums">
            {formatINR(totals.grandTotal)}
          </p>
          {totals.marginPercent > 0 && (
            <p className="text-emerald-400 text-xs mt-1">
              {totals.marginPercent.toFixed(1)}% commission rate
            </p>
          )}
        </div>

        {/* Global Margin override */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[var(--text-2)] text-xs font-medium">Global Margin Override</label>
            {meta.globalMargin > 0 && (
              <button
                onClick={() => onMetaChange({ ...meta, globalMargin: 0 })}
                className="text-[var(--text-3)] hover:text-red-400 text-xs transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={50}
              step={1}
              value={meta.globalMargin}
              onChange={(e) => onMetaChange({ ...meta, globalMargin: Number(e.target.value) })}
              className="flex-1 accent-indigo-500"
            />
            <div className="w-14 text-right">
              <span className={`text-sm font-semibold tabular-nums ${meta.globalMargin > 0 ? "text-indigo-400" : "text-[var(--text-3)]"}`}>
                {meta.globalMargin}%
              </span>
            </div>
          </div>
          {meta.globalMargin > 0 && (
            <p className="text-indigo-400 text-xs">Overrides all per-item margins</p>
          )}
        </div>

        {/* Hide pricing toggle */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-[var(--text-2)] text-xs font-medium">Hide costs in client view</p>
            <p className="text-[var(--text-3)] text-xs">Client sees descriptions only</p>
          </div>
          <Toggle
            checked={meta.hideClientCosts}
            onChange={(v) => onMetaChange({ ...meta, hideClientCosts: v })}
          />
        </div>

        {/* Per-item hide legend */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-3 space-y-1">
          <p className="text-[var(--text-3)] text-xs font-medium">Row visibility</p>
          <div className="flex items-center gap-2 text-xs text-[var(--text-3)]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            Green dot = visible to client
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-3)]">
            <span className="w-2 h-2 rounded-full bg-[var(--text-3)] shrink-0" />
            Grey dot = hidden from client
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function Row({ label, value, muted, accent, small }: {
  label: string; value: string;
  muted?: boolean; accent?: "emerald" | "amber"; small?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-2 ${small ? "text-xs" : "text-sm"}`}>
      <span className="text-[var(--text-3)]">{label}</span>
      <span className={`tabular-nums font-medium ${
        accent === "emerald" ? "text-emerald-400" :
        accent === "amber"   ? "text-amber-400"   :
        muted                ? "text-[var(--text-2)]" :
                               "text-[var(--text-1)]"
      }`}>
        {value}
      </span>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors ${checked ? "bg-indigo-500" : "bg-[var(--border)]"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
    </button>
  );
}
