"use client";

import { useBranding } from "@/lib/branding";
import InvoiceA4 from "@/components/InvoiceA4";
import type { BudgetItem, BudgetMeta } from "@/lib/budget";

type Props = {
  meta:      BudgetMeta;
  items:     BudgetItem[];
  budgetId?: string;
  onBack:    () => void;
};

const ACCENT = {
  invoice:  { bg: "#1e3a5f", text: "#ffffff" },
  estimate: { bg: "#14532d", text: "#ffffff" },
};

export default function InvoicePreview({ meta, items, budgetId, onBack }: Props) {
  const { branding } = useBranding();

  const hiddenCount = items.filter((it) => !it.visible).length;
  const docType     = meta.documentType ?? "estimate";
  const docLabel    = docType === "invoice" ? "INVOICE" : "ESTIMATE";
  const accent      = ACCENT[docType];

  return (
    <>
      {/* ── Toolbar (hidden on print via globals.css) ─────────────────────── */}
      <div className="invoice-toolbar max-w-[860px] mx-auto mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-[var(--text-2)] hover:text-[var(--text-1)] text-sm transition-colors"
          >
            <span className="text-base leading-none">←</span> Back to Editor
          </button>
          {hiddenCount > 0 && (
            <span className="text-[var(--text-3)] text-xs px-2 py-0.5 rounded border border-[var(--border)]">
              {hiddenCount} item{hiddenCount !== 1 ? "s" : ""} hidden
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {meta.status === "draft" && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
              Draft
            </span>
          )}
          <span
            className="text-xs font-medium px-2.5 py-1 rounded-full border"
            style={{ background: accent.bg, color: accent.text, borderColor: accent.bg }}
          >
            {docLabel}
          </span>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-1)] text-sm font-semibold hover:border-indigo-500/40 transition-colors"
          >
            <PrintIcon /> Export PDF / Print
          </button>
        </div>
      </div>

      {/* ── A4 Document (isolated for print via .invoice-a4-doc in globals.css) */}
      <div className="overflow-x-auto pb-8">
        <div
          className="mx-auto"
          style={{
            width: "794px",
            minWidth: "794px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.22), 0 1px 4px rgba(0,0,0,0.10)",
          }}
        >
          <InvoiceA4
            meta={meta}
            items={items}
            branding={branding}
            budgetId={budgetId}
          />
        </div>
      </div>
    </>
  );
}

function PrintIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}
