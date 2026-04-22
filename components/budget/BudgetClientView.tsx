"use client";

import { useMemo } from "react";
import { calcItem, calcTotals, formatINR, type BudgetItem, type BudgetMeta, type BudgetTotals } from "@/lib/budget";

type Props = {
  meta:   BudgetMeta;
  items:  BudgetItem[];
  totals: BudgetTotals;
  onBack: () => void;
};

export default function BudgetClientView({ meta, items, totals, onBack }: Props) {
  const visibleItems = items.filter((it) => it.visible);

  // Group visible items by category
  const grouped = useMemo(() => {
    const map: Record<string, BudgetItem[]> = {};
    for (const item of visibleItems) {
      if (!map[item.category]) map[item.category] = [];
      map[item.category].push(item);
    }
    return map;
  }, [visibleItems]);

  const showCosts = !meta.hideClientCosts;
  const hiddenCount = items.length - visibleItems.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Builder toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5">
        <div className="flex items-center gap-2 text-amber-400 text-sm">
          <span className="text-base">👁</span>
          <span className="font-medium">Client Preview</span>
          {hiddenCount > 0 && (
            <span className="text-amber-400/70 text-xs">· {hiddenCount} row{hiddenCount !== 1 ? "s" : ""} hidden</span>
          )}
        </div>
        <button
          onClick={onBack}
          className="text-[var(--text-2)] hover:text-[var(--text-1)] text-sm transition-colors flex items-center gap-1"
        >
          ← Back to Builder
        </button>
      </div>

      {/* Client document */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">

        {/* Document header */}
        <div className="bg-gradient-to-r from-indigo-500/15 to-purple-500/5 border-b border-[var(--border)] px-8 py-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-md bg-indigo-500 flex items-center justify-center text-white text-xs font-black">K</div>
                <span className="text-[var(--text-2)] text-sm font-medium">KUNJARA OS</span>
              </div>
              <h1 className="text-[var(--text-1)] text-2xl font-bold">{meta.title || "Event Budget Proposal"}</h1>
              {meta.eventType && <p className="text-[var(--text-2)] text-sm mt-1">{meta.eventType}</p>}
            </div>
            <div className="text-right">
              {meta.clientName && (
                <div>
                  <p className="text-[var(--text-3)] text-xs uppercase tracking-wider">Prepared for</p>
                  <p className="text-[var(--text-1)] font-semibold text-lg">{meta.clientName}</p>
                </div>
              )}
              <p className="text-[var(--text-3)] text-xs mt-2">
                {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="px-8 py-6 space-y-6">
          {Object.entries(grouped).map(([cat, catItems]) => {
            const catTotal = catItems.reduce((s, it) => s + calcItem(it, meta.globalMargin).total, 0);
            return (
              <div key={cat}>
                {/* Category heading */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--border)]">
                  <h3 className="text-[var(--text-1)] font-semibold text-sm">{cat}</h3>
                  {showCosts && (
                    <span className="text-[var(--text-1)] font-semibold text-sm tabular-nums">
                      {formatINR(catTotal)}
                    </span>
                  )}
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {catItems.map((item) => {
                    const c = calcItem(item, meta.globalMargin);
                    return (
                      <div key={item.id} className="flex items-center justify-between gap-4 py-1.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-[var(--text-1)] text-sm">{item.description || "—"}</p>
                          {!meta.hideClientCosts && (
                            <p className="text-[var(--text-3)] text-xs mt-0.5">
                              {item.quantity} {item.unit}
                              {item.gstRate > 0 && <span className="ml-2">GST {item.gstRate}%</span>}
                            </p>
                          )}
                        </div>
                        {showCosts && (
                          <div className="text-right shrink-0">
                            <p className="text-[var(--text-1)] text-sm font-medium tabular-nums">
                              {formatINR(c.total)}
                            </p>
                            {item.gstRate > 0 && (
                              <p className="text-[var(--text-3)] text-xs tabular-nums">
                                incl. {formatINR(c.gstAmount)} GST
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary footer */}
        {showCosts && (
          <div className="border-t border-[var(--border)] bg-[var(--bg-surface)] px-8 py-6">
            <div className="max-w-xs ml-auto space-y-2">
              <SummaryRow label="Subtotal"   value={formatINR(totals.subtotal)} />

              {Object.entries(totals.gstBreakdown)
                .filter(([, amt]) => amt > 0)
                .map(([rate, amt]) => (
                  <SummaryRow key={rate} label={`GST @ ${rate}%`} value={formatINR(amt)} muted />
                ))
              }

              <SummaryRow label="Total GST"  value={formatINR(totals.totalGST)} />

              <div className="border-t border-[var(--border)] pt-3 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-1)] font-bold text-base">Total Amount</span>
                  <span className="text-[var(--text-1)] font-black text-xl tabular-nums">
                    {formatINR(totals.grandTotal)}
                  </span>
                </div>
                <p className="text-[var(--text-3)] text-xs mt-1 text-right">All amounts inclusive of applicable GST</p>
              </div>
            </div>
          </div>
        )}

        {/* Hidden costs notice */}
        {meta.hideClientCosts && (
          <div className="border-t border-[var(--border)] bg-[var(--bg-surface)] px-8 py-5 text-center">
            <p className="text-[var(--text-3)] text-sm">
              Detailed pricing will be shared separately. Please contact us for a full cost breakdown.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={muted ? "text-[var(--text-3)]" : "text-[var(--text-2)]"}>{label}</span>
      <span className={`tabular-nums ${muted ? "text-[var(--text-3)]" : "text-[var(--text-2)]"}`}>{value}</span>
    </div>
  );
}
