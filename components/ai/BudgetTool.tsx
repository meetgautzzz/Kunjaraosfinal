"use client";

import { useState } from "react";
import type { BudgetInput, BudgetOutput, BudgetLine } from "@/lib/ai-tools";

// ── Form ───────────────────────────────────────────────────────────────────────

const EVENT_TYPES = [
  "Corporate Gala", "Conference", "Product Launch", "Wedding",
  "Concert", "Brand Activation", "Awards Night", "Exhibition",
  "Sports Event", "Workshop",
];

type FormProps = { onGenerate: (input: BudgetInput) => void };

export function BudgetForm({ onGenerate }: FormProps) {
  const [form, setForm] = useState<BudgetInput>({
    eventType: "", totalBudget: 0, guestCount: 0, location: "", requirements: "",
  });

  function set<K extends keyof BudgetInput>(k: K, v: BudgetInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const valid = form.eventType && form.totalBudget > 0 && form.location;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-3">
        <p className="text-[var(--text-1)] text-sm font-semibold">Event Type</p>
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.map((t) => (
            <button key={t} type="button" onClick={() => set("eventType", t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${form.eventType === t ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" : "border-[var(--border)] text-[var(--text-2)] hover:border-emerald-500/30"}`}>
              {t}
            </button>
          ))}
        </div>
        <input value={form.eventType} onChange={(e) => set("eventType", e.target.value)}
          placeholder="Or type custom event type..."
          className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-emerald-500/60" />
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4">
        <p className="text-[var(--text-1)] text-sm font-semibold">Event Details</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[var(--text-3)] text-xs mb-1 block">Total Budget (₹) *</label>
            <input type="number" value={form.totalBudget || ""} onChange={(e) => set("totalBudget", Number(e.target.value))}
              placeholder="e.g. 2500000"
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-emerald-500/60" />
            {form.totalBudget > 0 && <p className="text-emerald-400 text-xs mt-1">₹{form.totalBudget.toLocaleString("en-IN")}</p>}
          </div>
          <div>
            <label className="text-[var(--text-3)] text-xs mb-1 block">Location *</label>
            <input value={form.location} onChange={(e) => set("location", e.target.value)}
              placeholder="e.g. Mumbai, Grand Hyatt"
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-emerald-500/60" />
          </div>
          <div>
            <label className="text-[var(--text-3)] text-xs mb-1 block">Expected Guests</label>
            <input type="number" value={form.guestCount || ""} onChange={(e) => set("guestCount", Number(e.target.value))}
              placeholder="e.g. 300"
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-emerald-500/60" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-3">
        <p className="text-[var(--text-1)] text-sm font-semibold">Special Requirements</p>
        <textarea value={form.requirements} onChange={(e) => set("requirements", e.target.value)}
          placeholder="e.g. Luxury gala, sustainability focus, premium F&B, live band..."
          rows={3}
          className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-emerald-500/60 resize-none" />
      </div>

      <button onClick={() => onGenerate(form)} disabled={!valid}
        className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors">
        Generate Budget with AI
      </button>
    </div>
  );
}

// ── Output ─────────────────────────────────────────────────────────────────────

const COLORS = ["bg-emerald-500","bg-indigo-500","bg-amber-500","bg-purple-500","bg-rose-500","bg-cyan-500","bg-orange-500","bg-teal-500"];
const GST_RATES = [0, 5, 12, 18, 28] as const;

type OutputProps = { output: BudgetOutput; onChange: (o: BudgetOutput) => void };

export function BudgetOutput({ output, onChange }: OutputProps) {
  const lines = output.lines ?? [];
  const total = lines.reduce((s, l) => s + l.amount, 0);
  const gstTotal = lines.reduce((s, l) => s + Math.round(l.amount * l.gstRate / 100), 0);

  function updateLine(i: number, field: keyof BudgetLine, value: BudgetLine[keyof BudgetLine]) {
    const next = [...lines];
    (next[i] as any)[field] = value;
    onChange({ ...output, lines: next });
  }

  return (
    <div className="space-y-5">
      {/* Summary banner */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
        <textarea value={output.summary} onChange={(e) => onChange({ ...output, summary: e.target.value })}
          rows={2}
          className="w-full bg-transparent text-[var(--text-2)] text-sm leading-relaxed resize-none outline-none border border-transparent hover:border-[var(--border)] focus:border-emerald-500/40 rounded px-1" />
      </div>

      {/* Visual bar */}
      <div className="space-y-2">
        <div className="h-3 rounded-full overflow-hidden flex bg-[var(--bg-surface)]">
          {lines.map((l, i) => <div key={i} className={`${COLORS[i % COLORS.length]} h-full`} style={{ width: `${l.percentage}%` }} title={l.category} />)}
        </div>
        <div className="flex flex-wrap gap-3">
          {lines.map((l, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${COLORS[i % COLORS.length]}`} />
              <span className="text-[var(--text-3)] text-xs">{l.category}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Line items */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-[var(--bg-surface)] border-b border-[var(--border)] text-[11px] text-[var(--text-3)] uppercase tracking-wide font-medium">
          <div className="col-span-1" />
          <div className="col-span-4">Category</div>
          <div className="col-span-2 text-right">Amount</div>
          <div className="col-span-1 text-right">%</div>
          <div className="col-span-2">GST</div>
          <div className="col-span-2 text-right">Total+GST</div>
        </div>
        {lines.map((l, i) => {
          const gstAmt = Math.round(l.amount * l.gstRate / 100);
          return (
            <div key={i} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-[var(--border)] last:border-0 items-center group hover:bg-[var(--bg-hover)] transition-colors">
              <div className={`col-span-1 w-3 h-3 rounded-full ${COLORS[i % COLORS.length]}`} />
              <div className="col-span-4">
                <EditIn value={l.category} onChange={(v) => updateLine(i, "category", v)} className="text-[var(--text-1)] text-sm font-medium" />
                <EditIn value={l.description} onChange={(v) => updateLine(i, "description", v)} className="text-[var(--text-3)] text-xs mt-0.5" placeholder="Description..." />
              </div>
              <div className="col-span-2 text-right">
                <input type="number" value={l.amount} onChange={(e) => updateLine(i, "amount", Number(e.target.value))}
                  className="w-full text-right text-sm text-[var(--text-1)] font-medium bg-transparent border-b border-transparent hover:border-[var(--border)] focus:border-emerald-500/50 outline-none" />
              </div>
              <div className="col-span-1 text-right">
                <input type="number" value={l.percentage} onChange={(e) => updateLine(i, "percentage", Number(e.target.value))}
                  className="w-full text-right text-xs text-[var(--text-3)] bg-transparent border-b border-transparent hover:border-[var(--border)] focus:border-emerald-500/50 outline-none" />
              </div>
              <div className="col-span-2">
                <select value={l.gstRate} onChange={(e) => updateLine(i, "gstRate", Number(e.target.value) as BudgetLine["gstRate"])}
                  className="text-xs text-[var(--text-3)] bg-transparent border-b border-transparent hover:border-[var(--border)] outline-none cursor-pointer">
                  {GST_RATES.map((r) => <option key={r} value={r} className="bg-[#1c2029]">{r}%</option>)}
                </select>
              </div>
              <div className="col-span-1 text-right text-xs text-emerald-400 font-medium">
                ₹{(l.amount + gstAmt).toLocaleString("en-IN")}
              </div>
              <button onClick={() => onChange({ ...output, lines: lines.filter((_, j) => j !== i) })}
                className="col-span-1 text-[var(--text-3)] hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity text-right">✕</button>
            </div>
          );
        })}

        {/* Totals row */}
        <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-[var(--bg-surface)] border-t-2 border-[var(--border)] items-center">
          <div className="col-span-5 text-[var(--text-1)] text-sm font-bold">Total</div>
          <div className="col-span-2 text-right text-[var(--text-1)] text-sm font-bold">₹{total.toLocaleString("en-IN")}</div>
          <div className="col-span-1" />
          <div className="col-span-2 text-xs text-[var(--text-3)]">GST: ₹{gstTotal.toLocaleString("en-IN")}</div>
          <div className="col-span-2 text-right text-emerald-400 text-sm font-bold">₹{(total + gstTotal).toLocaleString("en-IN")}</div>
        </div>
      </div>

      <button onClick={() => onChange({ ...output, lines: [...lines, { category: "New Line", amount: 0, percentage: 0, description: "", gstRate: 18 }] })}
        className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">+ Add line</button>

      {/* Notes */}
      <div className="space-y-2">
        <p className="text-[var(--text-3)] text-xs uppercase tracking-wide font-medium">Notes</p>
        {output.notes.map((n, i) => (
          <div key={i} className="flex items-start gap-2 group">
            <span className="text-emerald-400 text-xs mt-0.5">→</span>
            <EditIn value={n} onChange={(v) => { const next = [...output.notes]; next[i] = v; onChange({ ...output, notes: next }); }}
              className="text-[var(--text-2)] text-xs flex-1" />
            <button onClick={() => onChange({ ...output, notes: output.notes.filter((_, j) => j !== i) })}
              className="text-[var(--text-3)] hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
          </div>
        ))}
        <button onClick={() => onChange({ ...output, notes: [...output.notes, ""] })} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">+ Add note</button>
      </div>
    </div>
  );
}

function EditIn({ value, onChange, className, placeholder }: { value: string; onChange: (v: string) => void; className?: string; placeholder?: string }) {
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className={`bg-transparent border-b border-transparent hover:border-[var(--border)] focus:border-emerald-500/50 outline-none w-full transition-colors ${className}`} />
  );
}
