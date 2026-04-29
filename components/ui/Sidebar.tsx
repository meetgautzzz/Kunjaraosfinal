"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard",  icon: <GridIcon />,    label: "Dashboard" },
      { href: "/proposals",  icon: <SparkleIcon />, label: "Vision Board", badge: "AI" },
      { href: "/brain",      icon: <AiIcon />,      label: "Atlas X",      badge: "AI" },
      { href: "/budget",     icon: <WalletIcon />,  label: "Budget Builder" },
      { href: "/events",     icon: <CalIcon />,     label: "Events" },
      { href: "/vendors",    icon: <StoreIcon />,   label: "Vendors" },
    ],
  },
  {
    label: "Compliance",
    items: [
      { href: "/compliance", icon: <ShieldIcon />,  label: "Compliance" },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/billing",   icon: <BillingIcon />, label: "Billing" },
      { href: "/settings",  icon: <GearIcon />,    label: "Settings" },
    ],
  },
];

export default function Sidebar() {
  const path = usePathname();
  const [userEmail, setUserEmail] = useState("");
  const [userInitial, setUserInitial] = useState("?");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email ?? "";
      setUserEmail(email);
      setUserInitial(email.charAt(0).toUpperCase() || "?");
    });
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <aside className="hidden md:flex flex-col w-58 shrink-0 h-screen sticky top-0 border-r border-[var(--border)] bg-[var(--bg-surface)]">

      {/* Brand */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-[var(--border)] shrink-0">
        <KunjaraMark size={34} />
        <div>
          <p className="leading-none" style={{ fontFamily: '"Instrument Serif", serif', fontStyle: "italic", fontSize: 17, color: "#F4F1EA", letterSpacing: "-0.01em" }}>
            Kunjara
            <span style={{ fontFamily: "Geist, sans-serif", fontStyle: "normal", fontWeight: 600, fontSize: 13, letterSpacing: "0.04em", marginLeft: 3 }}>OS</span>
            <sup style={{ fontFamily: "Geist, sans-serif", fontStyle: "normal", fontSize: 7, fontWeight: 600, color: "#4A4535", marginLeft: 1, verticalAlign: "super" }}>™</sup>
          </p>
          <p className="text-[var(--text-3)] text-[10px] leading-none mt-1 tracking-wide" style={{ fontFamily: '"JetBrains Mono", monospace', letterSpacing: "0.08em" }}>EVENT INTELLIGENCE</p>
        </div>
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
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                        active
                          ? "border border-[var(--accent)]/20 text-[var(--accent)]"
                          : "text-[var(--text-2)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-1)] border border-transparent"
                      }`}
                    >
                      <span className={`w-4 h-4 shrink-0 ${active ? "text-[var(--accent)]" : "text-[var(--text-3)]"}`}>
                        {item.icon}
                      </span>
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

      {/* User footer */}
      <div className="shrink-0 px-3 py-3 border-t border-[var(--border)]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border-mid)] cursor-pointer transition-all text-left"
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: "linear-gradient(135deg, #D4A85F, #C9785F)", color: "#08080A" }}>
            {userInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[var(--text-1)] text-xs font-semibold truncate leading-none">{userEmail || "Account"}</p>
            <p className="text-[var(--text-3)] text-[10px] truncate mt-0.5">Log out</p>
          </div>
          <ChevronIcon />
        </button>
      </div>
    </aside>
  );
}

function KunjaraMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="32" cy="32" r="29" stroke="#D4A85F" strokeWidth="1.25" opacity="0.35" />
      <circle cx="32" cy="32" r="29" stroke="#D4A85F" strokeWidth="1.25" strokeDasharray="2 6" opacity="0.55" transform="rotate(-30 32 32)" />
      <g stroke="#D4A85F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M16 38 C 16 22, 48 22, 48 38" />
        <path d="M22 38 C 22 48, 32 50, 34 42 C 35 38, 30 36, 30 40" />
        <path d="M40 40 L 44 46" />
        <circle cx="40" cy="32" r="1.4" fill="#D4A85F" stroke="none" />
      </g>
      <circle cx="58" cy="22" r="1.6" fill="#D4A85F" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function CalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
function StoreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l1-5h16l1 5" /><path d="M3 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0" />
      <path d="M5 20h14V9" />
    </svg>
  );
}
function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" />
    </svg>
  );
}
function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M16 12h2" /><path d="M2 10h20" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L4 6v6c0 5.25 3.5 9.74 8 11 4.5-1.26 8-5.75 8-11V6L12 2z" />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
function BillingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h22" />
    </svg>
  );
}
function AiIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}
function ChevronIcon() {
  return (
    <svg className="w-3 h-3 text-[var(--text-3)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
