"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type BudgetSummary = {
  id:         string;
  title:      string;
  meta:       {
    clientName?:    string;
    clientCompany?: string;
    eventType?:     string;
    documentType?:  "estimate" | "invoice";
    status?:        "draft" | "final";
  };
  created_at: string;
  updated_at: string;
};

const DOC_TYPE_CONFIG = {
  estimate: { label: "Estimate", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  invoice:  { label: "Invoice",  cls: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30"  },
};

const STATUS_CONFIG = {
  draft: { label: "Draft", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30"    },
  final: { label: "Final", cls: "bg-gray-500/15 text-gray-400 border-gray-500/30" },
};

export default function BudgetListPage() {
  const router = useRouter();
  const [budgets,  setBudgets]  = useState<BudgetSummary[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/budgets")
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setBudgets(Array.isArray(d) ? d : []))
      .catch(() => setBudgets([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleNew(docType: "estimate" | "invoice" = "estimate") {
    setCreating(true);
    const res = await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: docType === "invoice" ? "Untitled Invoice" : "Untitled Estimate",
        meta:  { documentType: docType, status: "draft" },
        items: [],
      }),
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/budget/${data.id}`);
    }
    setCreating(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this document?")) return;
    await fetch(`/api/budgets/${id}`, { method: "DELETE" });
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-1)]">Estimates &amp; Invoices</h2>
          <p className="text-[var(--text-2)] text-sm mt-1">Create client-ready estimates and invoices with GST, terms, and PDF export.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleNew("estimate")}
            disabled={creating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            + New Estimate
          </button>
          <button
            onClick={() => handleNew("invoice")}
            disabled={creating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {creating ? "Creating…" : "+ New Invoice"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-36 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] animate-pulse" />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] p-16 text-center">
          <p className="text-3xl mb-3">📄</p>
          <p className="text-[var(--text-1)] font-semibold text-sm mb-1">No documents yet</p>
          <p className="text-[var(--text-3)] text-xs mb-5">Create your first estimate or invoice with GST calculations, client details, and terms.</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => handleNew("estimate")}
              className="px-4 py-2 rounded-lg border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 text-sm font-semibold transition-colors"
            >
              New Estimate
            </button>
            <button
              onClick={() => handleNew("invoice")}
              className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors"
            >
              New Invoice
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {budgets.map((b) => {
            const docType = b.meta?.documentType ?? "estimate";
            const status  = b.meta?.status ?? "draft";
            const dtCfg   = DOC_TYPE_CONFIG[docType];
            const stCfg   = STATUS_CONFIG[status];
            const client  = b.meta?.clientName || b.meta?.clientCompany;
            return (
              <div
                key={b.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 flex flex-col gap-3 hover:border-indigo-500/30 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${dtCfg.cls}`}>{dtCfg.label}</span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${stCfg.cls}`}>{stCfg.label}</span>
                    </div>
                    <p className="text-[var(--text-1)] font-semibold text-sm truncate">{b.title}</p>
                    {client && (
                      <p className="text-[var(--text-3)] text-xs mt-0.5 truncate">{client}</p>
                    )}
                    {b.meta?.eventType && (
                      <p className="text-[var(--text-3)] text-xs truncate">{b.meta.eventType}</p>
                    )}
                  </div>
                </div>
                <p className="text-[var(--text-3)] text-[11px]">
                  Updated {new Date(b.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
                <div className="flex gap-2 pt-1 border-t border-[var(--border)]">
                  <button
                    onClick={() => router.push(`/budget/${b.id}`)}
                    className="flex-1 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-medium transition-colors"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="px-3 py-1.5 rounded-lg border border-[var(--border)] hover:border-red-500/30 hover:text-red-400 text-[var(--text-3)] text-xs transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
