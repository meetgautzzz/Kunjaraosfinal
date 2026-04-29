"use client";

import { useState } from "react";
import { DEFAULT_TERMS, type BudgetMeta } from "@/lib/budget";

type Props = { meta: BudgetMeta; onChange: (m: BudgetMeta) => void };

export default function TermsSection({ meta, onChange }: Props) {
  const [newTerm, setNewTerm] = useState("");
  const terms = meta.terms?.length ? meta.terms : DEFAULT_TERMS;

  function setTerms(next: string[]) {
    onChange({ ...meta, terms: next });
  }

  function updateTerm(i: number, value: string) {
    const next = [...terms];
    next[i] = value;
    setTerms(next);
  }

  function removeTerm(i: number) {
    setTerms(terms.filter((_, idx) => idx !== i));
  }

  function addTerm() {
    const t = newTerm.trim();
    if (!t) return;
    setTerms([...terms, t]);
    setNewTerm("");
  }

  function resetToDefaults() {
    setTerms(DEFAULT_TERMS);
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-surface)] flex items-center justify-between">
        <p className="text-[var(--text-2)] text-xs font-semibold uppercase tracking-wider">Terms &amp; Conditions</p>
        <button
          onClick={resetToDefaults}
          className="text-[var(--text-3)] hover:text-indigo-400 text-[11px] transition-colors"
          title="Reset to defaults"
        >
          Reset defaults
        </button>
      </div>

      <div className="px-4 py-3 space-y-1.5">
        {terms.map((term, i) => (
          <div key={i} className="flex items-start gap-2 group">
            <span className="text-[var(--text-3)] text-xs mt-2 shrink-0">•</span>
            <input
              value={term}
              onChange={(e) => updateTerm(i, e.target.value)}
              className="flex-1 bg-transparent text-[var(--text-2)] text-xs py-1.5 border-b border-transparent hover:border-[var(--border)] focus:border-indigo-500/60 outline-none transition-colors"
            />
            <button
              onClick={() => removeTerm(i)}
              className="text-[var(--text-3)] hover:text-red-400 text-sm leading-none mt-1.5 opacity-0 group-hover:opacity-100 transition-all shrink-0"
              title="Remove"
            >
              ×
            </button>
          </div>
        ))}

        {/* Add new term */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-[var(--text-3)] text-xs shrink-0">+</span>
          <input
            value={newTerm}
            onChange={(e) => setNewTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTerm()}
            placeholder="Add a new term…"
            className="flex-1 bg-transparent text-[var(--text-3)] text-xs py-1.5 border-b border-dashed border-[var(--border)] focus:border-indigo-500/60 focus:text-[var(--text-2)] outline-none transition-colors placeholder:text-[var(--text-3)]/50"
          />
          {newTerm.trim() && (
            <button
              onClick={addTerm}
              className="text-indigo-400 text-xs font-medium hover:text-indigo-300 transition-colors shrink-0"
            >
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
