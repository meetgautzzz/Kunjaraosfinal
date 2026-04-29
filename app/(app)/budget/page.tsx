"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatINR } from "@/lib/budget";

type BudgetSummary = {
  id: string;
  title: string;
  meta: { clientName?: string; eventType?: string };
  created_at: string;
  updated_at: string;
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

  async function handleNew() {
    setCreating(true);
    const res = await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled Budget", meta: {}, items: [] }),
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/budget/${data.id}`);
    }
    setCreating(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this budget?")) return;
    await fetch(`/api/budgets/${id}`, { method: "DELETE" });
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-1)]">Budget Builder</h2>
          <p className="text-[var(--text-2)] text-sm mt-1">Build event budgets with GST, margins, and client-ready exports.</p>
        </div>
        <button
          onClick={handleNew}
          disabled={creating}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {creating ? "Creating…" : "+ New Budget"}
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] animate-pulse" />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] p-16 text-center">
          <p className="text-3xl mb-3">💰</p>
          <p className="text-[var(--text-1)] font-semibold text-sm mb-1">No budgets yet</p>
          <p className="text-[var(--text-3)] text-xs mb-4">Create your first event budget with GST and margin calculations.</p>
          <button
            onClick={handleNew}
            disabled={creating}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors"
          >
            {creating ? "Creating…" : "Create first budget →"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {budgets.map((b) => (
            <div
              key={b.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 flex flex-col gap-3 hover:border-indigo-500/30 transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[var(--text-1)] font-semibold text-sm truncate">{b.title}</p>
                  <p className="text-[var(--text-3)] text-xs mt-0.5 truncate">
                    {b.meta?.clientName || b.meta?.eventType || "No client set"}
                  </p>
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
          ))}
        </div>
      )}
    </div>
  );
}
