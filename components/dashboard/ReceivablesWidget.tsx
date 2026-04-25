"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatINR } from "@/lib/proposals";

type Summary = { received: number; verifying: number; outstanding: number; count: number };

export default function ReceivablesWidget() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/payments/summary")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled) setData(d as Summary); })
      .catch(() => { if (!cancelled) setData(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[var(--text-1)] font-semibold text-sm">Receivables</h3>
        <Link href="/proposals" className="text-indigo-400 text-xs hover:text-indigo-300 transition-colors">View →</Link>
      </div>

      {loading ? (
        <p className="text-[var(--text-3)] text-xs">Loading…</p>
      ) : !data || data.count === 0 ? (
        <p className="text-[var(--text-3)] text-xs">
          No payment requests yet. Open any proposal's <strong>Payments</strong> tab to start tracking.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <Cell label="Received" value={formatINR(data.received)} tone="emerald" />
          <Cell label="Verifying" value={formatINR(data.verifying)} tone="indigo" />
          <Cell label="Outstanding" value={formatINR(data.outstanding)} tone="amber" />
        </div>
      )}
    </div>
  );
}

function Cell({ label, value, tone }: { label: string; value: string; tone: "emerald" | "indigo" | "amber" }) {
  const colors = {
    emerald: "text-emerald-400",
    indigo:  "text-indigo-400",
    amber:   "text-amber-400",
  };
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider font-medium text-[var(--text-3)]">{label}</p>
      <p className={`text-base font-bold tabular-nums mt-1 ${colors[tone]}`}>{value}</p>
    </div>
  );
}
