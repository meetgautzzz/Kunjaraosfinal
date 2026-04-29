"use client";

// Mobile navigation drawer. Slides in from the left on tap of the
// hamburger button in Topbar. Mirrors Sidebar nav 1:1 — same routes,
// same labels — so the desktop and mobile navigation stay in lockstep.
// Closes on: backdrop tap, route change, Esc.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard",  label: "Dashboard" },
      { href: "/proposals",  label: "Vision Board", badge: "AI" },
      { href: "/brain",      label: "Atlas X",      badge: "AI" },
      { href: "/budget",     label: "Budget Builder" },
      { href: "/events",     label: "Events" },
      { href: "/vendors",    label: "Vendors" },
    ],
  },
  {
    label: "Compliance",
    items: [
      { href: "/compliance", label: "Compliance" },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/billing",   label: "Billing" },
      { href: "/settings",  label: "Settings" },
    ],
  },
];

export default function MobileNav({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const path = usePathname();

  // Close on route change.
  useEffect(() => { onClose(); }, [path]); // eslint-disable-line react-hooks/exhaustive-deps

  // Esc to close + lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  async function handleLogout() {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity md:hidden ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />
      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[80vw] flex flex-col border-r border-[var(--border)] bg-[var(--bg-surface)] transition-transform duration-200 md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!open}
      >
        {/* Brand + close */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-3">
            <KunjaraMark size={32} />
            <div>
              <p className="leading-none" style={{ fontFamily: '"Instrument Serif", serif', fontStyle: "italic", fontSize: 16, color: "#F4F1EA", letterSpacing: "-0.01em" }}>
                Kunjara
                <span style={{ fontFamily: "Geist, sans-serif", fontStyle: "normal", fontWeight: 600, fontSize: 12, letterSpacing: "0.04em", marginLeft: 3 }}>OS</span>
                <sup style={{ fontFamily: "Geist, sans-serif", fontStyle: "normal", fontSize: 7, fontWeight: 600, color: "#4A4535", marginLeft: 1, verticalAlign: "super" }}>™</sup>
              </p>
              <p className="text-[var(--text-3)] text-[10px] mt-1 leading-none" style={{ fontFamily: '"JetBrains Mono", monospace', letterSpacing: "0.08em" }}>EVENT INTELLIGENCE</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--bg-hover)] transition-colors"
            aria-label="Close navigation"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-5">
          {NAV.map((group) => (
            <div key={group.label}>
              <p className="text-[var(--text-3)] text-[10px] uppercase tracking-[0.12em] font-semibold px-2 mb-1.5">
                {group.label}
              </p>
              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = path === item.href || path.startsWith(item.href + "/");
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        // 44px min height per touch-target spec.
                        className={`flex items-center gap-3 px-3 min-h-[44px] rounded-lg text-sm font-medium transition-all ${
                          active
                            ? "border border-[var(--accent)]/20 text-[var(--accent)]"
                            : "text-[var(--text-2)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-1)] border border-transparent"
                        }`}
                      >
                        <span className="flex-1">{item.label}</span>
                        {"badge" in item && item.badge && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full tracking-wide" style={{ background: "rgba(212,168,95,0.12)", color: "#D4A85F", border: "1px solid rgba(212,168,95,0.25)" }}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="shrink-0 px-3 py-3 border-t border-[var(--border)]">
          <button
            onClick={handleLogout}
            className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-2)] text-sm font-medium hover:text-[var(--text-1)] hover:border-[var(--border-mid)] transition-colors"
          >
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
