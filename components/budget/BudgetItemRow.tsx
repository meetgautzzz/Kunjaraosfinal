"use client";

import { useState } from "react";
import { calcItem, formatINR, GST_RATES, type BudgetItem } from "@/lib/budget";

type Props = {
  item:         BudgetItem;
  globalMargin: number;
  onChange:     (patch: Partial<BudgetItem>) => void;
  onRemove:     () => void;
  onDuplicate:  () => void;
};

export default function BudgetItemRow({ item, globalMargin, onChange, onRemove, onDuplicate }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const calc = calcItem(item, globalMargin);
  const effectiveMargin = globalMargin > 0 ? globalMargin : item.margin;

  return (
    <div className={`grid budget-cols gap-2 items-center px-4 py-3 group hover:bg-[var(--bg-hover)] transition-colors ${!item.visible ? "opacity-50" : ""}`}>

      {/* Description — col-span-3 */}
      <div className="col-span-3 flex items-center gap-2 min-w-0">
        {/* Visibility dot */}
        <button
          onClick={() => onChange({ visible: !item.visible })}
          title={item.visible ? "Visible to client" : "Hidden from client"}
          className={`w-2 h-2 rounded-full shrink-0 transition-colors ${item.visible ? "bg-emerald-500" : "bg-[var(--text-3)]"}`}
        />
        <input
          value={item.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Item description..."
          className="flex-1 min-w-0 bg-transparent text-[var(--text-1)] text-sm placeholder:text-[var(--text-3)] outline-none border-b border-transparent hover:border-[var(--border)] focus:border-indigo-500/60 transition-colors"
        />
      </div>

      {/* Unit */}
      <input
        value={item.unit}
        onChange={(e) => onChange({ unit: e.target.value })}
        className="text-center bg-transparent text-[var(--text-2)] text-xs outline-none border border-transparent hover:border-[var(--border)] focus:border-indigo-500/60 rounded px-1 py-0.5 transition-colors"
      />

      {/* Quantity */}
      <input
        type="number"
        value={item.quantity}
        min={0}
        onChange={(e) => onChange({ quantity: Number(e.target.value) })}
        className="text-right bg-transparent text-[var(--text-1)] text-sm outline-none border border-transparent hover:border-[var(--border)] focus:border-indigo-500/60 rounded px-1 py-0.5 transition-colors w-full"
      />

      {/* Unit Cost */}
      <div className="relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-3)] text-xs">₹</span>
        <input
          type="number"
          value={item.unitCost}
          min={0}
          onChange={(e) => onChange({ unitCost: Number(e.target.value) })}
          className="w-full text-right bg-transparent text-[var(--text-1)] text-sm outline-none border border-transparent hover:border-[var(--border)] focus:border-indigo-500/60 rounded pl-5 pr-1 py-0.5 transition-colors"
        />
      </div>

      {/* GST Rate */}
      <select
        value={item.gstRate}
        onChange={(e) => onChange({ gstRate: Number(e.target.value) as any })}
        className="text-center bg-[var(--bg-surface)] text-[var(--text-2)] text-xs border border-[var(--border)] rounded px-1 py-0.5 outline-none focus:border-indigo-500/60 cursor-pointer"
      >
        {GST_RATES.map((r) => (
          <option key={r} value={r}>{r}%</option>
        ))}
      </select>

      {/* Margin */}
      <div className="relative flex items-center gap-1">
        <input
          type="number"
          value={globalMargin > 0 ? globalMargin : item.margin}
          min={0}
          max={100}
          disabled={globalMargin > 0}
          onChange={(e) => onChange({ margin: Number(e.target.value) })}
          className={`w-full text-right text-sm outline-none border rounded px-1 py-0.5 transition-colors ${
            globalMargin > 0
              ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 cursor-not-allowed"
              : "bg-transparent text-[var(--text-1)] border-transparent hover:border-[var(--border)] focus:border-indigo-500/60"
          }`}
        />
        <span className="text-[var(--text-3)] text-xs shrink-0">%</span>
      </div>

      {/* GST Amount */}
      <span className="text-right text-[var(--text-3)] text-xs tabular-nums">
        {formatINR(calc.gstAmount)}
      </span>

      {/* Total */}
      <span className="text-right text-[var(--text-1)] text-sm font-semibold tabular-nums">
        {formatINR(calc.total)}
      </span>

      {/* Actions */}
      <div className="relative flex items-center justify-center">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-6 h-6 rounded flex items-center justify-center text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--bg-card)] opacity-0 group-hover:opacity-100 transition-all"
        >
          ⋯
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-7 z-20 w-36 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] shadow-xl overflow-hidden">
              <button
                onClick={() => { onDuplicate(); setMenuOpen(false); }}
                className="w-full text-left px-3 py-2 text-[var(--text-2)] hover:bg-[var(--bg-hover)] text-xs transition-colors"
              >
                Duplicate row
              </button>
              <button
                onClick={() => { onChange({ visible: !item.visible }); setMenuOpen(false); }}
                className="w-full text-left px-3 py-2 text-[var(--text-2)] hover:bg-[var(--bg-hover)] text-xs transition-colors"
              >
                {item.visible ? "Hide from client" : "Show to client"}
              </button>
              <button
                onClick={() => { onRemove(); setMenuOpen(false); }}
                className="w-full text-left px-3 py-2 text-red-400 hover:bg-red-500/10 text-xs transition-colors"
              >
                Delete row
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
