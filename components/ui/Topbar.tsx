"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

const PAGE_LABELS: Record<string, string> = {
  "/dashboard":  "Dashboard",
  "/events":     "Events",
  "/vendors":    "Vendors",
  "/compliance": "Compliance",
  "/proposals":  "AI Proposals",
  "/budget":     "Budget Builder",
  "/ai":         "AI Tools",
  "/billing":    "Billing",
  "/settings":   "Settings",
};

const NOTIFS = [
  { id: 1, title: "New vendor onboarded: Apex Events Co.", time: "2 min ago" },
  { id: 2, title: "Compliance report due in 3 days",       time: "1 hour ago" },
  { id: 3, title: "Event #KUN-042 approved",               time: "Yesterday" },
];

export default function Topbar() {
  const path = usePathname();
  const [notifOpen, setNotifOpen] = useState(false);
  const title = PAGE_LABELS[path] ?? "Kunjara OS";

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-6 border-b border-[var(--border)] bg-[var(--bg-surface)]/90 backdrop-blur-md shrink-0">
      <div>
        <h1 className="text-[var(--text-1)] font-semibold text-base">{title}</h1>
        <p className="text-[var(--text-3)] text-xs">KUNJARA OS · Business Suite</p>
      </div>

      <div className="flex items-center gap-2">
        <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-3)] text-xs hover:border-indigo-500/40 transition-colors w-48">
          <SearchIcon />
          <span>Search...</span>
          <span className="ml-auto text-[10px] border border-[var(--border)] rounded px-1 py-0.5">⌘K</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-2)] hover:text-[var(--text-1)] hover:border-indigo-500/40 transition-colors"
          >
            <BellIcon />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-indigo-500" />
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-11 w-72 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl shadow-black/60 z-50">
              <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
                <span className="text-[var(--text-1)] text-sm font-semibold">Notifications</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-medium">3 new</span>
              </div>
              {NOTIFS.map((n) => (
                <div key={n.id} className="px-4 py-3 border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer">
                  <p className="text-[var(--text-1)] text-xs font-medium">{n.title}</p>
                  <p className="text-[var(--text-3)] text-xs mt-0.5">{n.time}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold cursor-pointer shrink-0">
          G
        </div>
      </div>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
