"use client";

import { useEffect, useState } from "react";

type ActivityItem = {
  id:      string;
  action:  string;
  subject: string;
  time:    string;
  initial: string;
};

export default function ActivityFeed() {
  const [items,   setItems]   = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/activity")
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const GRADIENT_FOR = (initial: string) => {
    const map: Record<string, string> = {
      a: "from-emerald-500 to-teal-500",
      b: "from-sky-500 to-blue-500",
      c: "from-orange-500 to-amber-500",
      d: "from-pink-500 to-rose-500",
    };
    return map[initial.toLowerCase()] ?? "from-indigo-500 to-violet-500";
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] h-full">
      <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
        <h3 className="text-[var(--text-1)] font-semibold text-sm">Recent Activity</h3>
        <span className="text-[10px] text-[var(--text-3)] border border-[var(--border)] rounded-full px-2 py-0.5">Live</span>
      </div>

      {loading ? (
        <div className="p-5 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-[var(--bg-surface)] animate-pulse shrink-0" />
              <div className="flex-1 h-4 rounded bg-[var(--bg-surface)] animate-pulse" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-[var(--text-3)] text-sm">No activity yet.</p>
          <p className="text-[var(--text-3)] text-xs mt-1">Actions across your workspace will appear here.</p>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {items.map((a) => (
            <li key={a.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-[var(--bg-hover)] transition-colors">
              <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${GRADIENT_FOR(a.initial)} flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5`}>
                {a.initial.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[var(--text-2)] text-sm">
                  {a.action}{" "}
                  <span className="text-[var(--text-1)] font-medium">{a.subject}</span>
                </p>
              </div>
              <span className="text-[var(--text-3)] text-xs shrink-0">{a.time}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
