"use client";

import type { BudgetMeta } from "@/lib/budget";

type Props = { meta: BudgetMeta; onChange: (m: BudgetMeta) => void };

export default function BudgetMetaBar({ meta, onChange }: Props) {
  function set(field: keyof BudgetMeta, value: any) {
    onChange({ ...meta, [field]: value });
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Field label="Budget Title">
          <input
            value={meta.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Gala Night 2025 Budget"
            className={INPUT}
          />
        </Field>
        <Field label="Client Name">
          <input
            value={meta.clientName}
            onChange={(e) => set("clientName", e.target.value)}
            placeholder="e.g. Apex Corp"
            className={INPUT}
          />
        </Field>
        <Field label="Event Type">
          <input
            value={meta.eventType}
            onChange={(e) => set("eventType", e.target.value)}
            placeholder="e.g. Corporate Gala"
            className={INPUT}
          />
        </Field>
        <Field label="Currency">
          <select
            value={meta.currency}
            onChange={(e) => set("currency", e.target.value)}
            className={INPUT + " cursor-pointer"}
          >
            <option value="INR">INR — Indian Rupee</option>
            <option value="USD">USD — US Dollar</option>
            <option value="AED">AED — UAE Dirham</option>
            <option value="GBP">GBP — British Pound</option>
          </select>
        </Field>
      </div>
    </div>
  );
}

const INPUT = "w-full bg-transparent text-[var(--text-1)] text-sm outline-none border-b border-[var(--border)] focus:border-indigo-500/60 py-1 transition-colors placeholder:text-[var(--text-3)]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[var(--text-3)] text-xs font-medium mb-1.5 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}
