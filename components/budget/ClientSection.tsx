"use client";

import type { BudgetMeta } from "@/lib/budget";

type Props = { meta: BudgetMeta; onChange: (m: BudgetMeta) => void };

export default function ClientSection({ meta, onChange }: Props) {
  function set(field: keyof BudgetMeta, value: string) {
    onChange({ ...meta, [field]: value });
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-surface)]">
        <p className="text-[var(--text-2)] text-xs font-semibold uppercase tracking-wider">Bill To — Client Details</p>
      </div>
      <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        <Field label="Client Name">
          <input
            value={meta.clientName}
            onChange={(e) => set("clientName", e.target.value)}
            placeholder="e.g. Ravi Mehta"
            className={INPUT}
          />
        </Field>
        <Field label="Company / Organisation">
          <input
            value={meta.clientCompany}
            onChange={(e) => set("clientCompany", e.target.value)}
            placeholder="e.g. Apex Industries Ltd."
            className={INPUT}
          />
        </Field>
        <Field label="Billing Address" className="sm:col-span-2">
          <textarea
            value={meta.clientAddress}
            onChange={(e) => set("clientAddress", e.target.value)}
            placeholder={"e.g. 301, Business Hub\nAndheri East, Mumbai – 400 069"}
            rows={2}
            className={INPUT + " resize-none"}
          />
        </Field>
        <Field label="Client GST Number (optional)">
          <input
            value={meta.clientGST}
            onChange={(e) => set("clientGST", e.target.value.toUpperCase())}
            placeholder="e.g. 27AABCU9603R1ZX"
            className={INPUT + " font-mono tracking-wide"}
            maxLength={15}
          />
        </Field>
      </div>
    </div>
  );
}

const INPUT = "w-full bg-transparent text-[var(--text-1)] text-sm outline-none border-b border-[var(--border)] focus:border-indigo-500/60 py-1 transition-colors placeholder:text-[var(--text-3)]";

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-[var(--text-3)] text-[11px] font-medium mb-1 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}
