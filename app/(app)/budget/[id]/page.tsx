"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import BudgetBuilder from "@/components/budget/BudgetBuilder";
import type { BudgetMeta, BudgetItem } from "@/lib/budget";

export default function BudgetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const [meta,    setMeta]    = useState<BudgetMeta | null>(null);
  const [items,   setItems]   = useState<BudgetItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/budgets/${id}`)
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((d) => { setMeta(d.meta ?? {}); setItems(d.items ?? []); })
      .catch((s) => setError(s === 404 ? "Budget not found." : "Failed to load budget."))
      .finally(() => setLoading(false));
  }, [id]);

  const save = useCallback((newMeta: BudgetMeta, newItems: BudgetItem[]) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch(`/api/budgets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newMeta.title || "Untitled Budget", meta: newMeta, items: newItems }),
      });
    }, 800);
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto space-y-4 p-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || meta === null || items === null) {
    return (
      <div className="max-w-[1400px] mx-auto p-12 text-center space-y-3">
        <p className="text-[var(--text-2)]">{error || "Budget not found."}</p>
        <button onClick={() => router.push("/budget")} className="text-indigo-400 text-sm hover:text-indigo-300">
          ← Back to budgets
        </button>
      </div>
    );
  }

  return (
    <BudgetBuilder
      budgetId={id}
      initialMeta={meta}
      initialItems={items}
      onBack={() => router.push("/budget")}
      onSave={save}
    />
  );
}
