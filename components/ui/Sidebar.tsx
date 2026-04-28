"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard",  icon: <GridIcon />,    label: "Dashboard" },
      { href: "/proposals",  icon: <SparkleIcon />, label: "Vision Board", badge: "AI" },
      { href: "/brain",      icon: <AiIcon />,      label: "AI Brain",     badge: "AI" },
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

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Hard redirect so the server components and middleware re-read the
    // now-cleared session cookies. router.push() alone leaves RSC state
    // authenticated until the next full reload.
    window.location.href = "/login";
  }

  return (
    <aside className="hidden md:flex flex-col w-58 shrink-0 h-screen sticky top-0 border-r border-[var(--border)] bg-[var(--bg-surface)]">

      {/* Brand */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-[var(--border)] shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-black text-white text-sm select-none shadow-lg shadow-indigo-500/20">
          K
        </div>
        <div>
          <p className="text-[var(--text-1)] text-sm font-semibold tracking-tight leading-none">
            Kunjara OS<sup className="text-[8px] font-semibold text-[var(--text-3)]">™</sup>
          </p>
          <p className="text-[var(--text-3)] text-[10px] leading-none mt-0.5 tracking-wide">Event Intelligence</p>
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
                          ? "bg-indigo-500/12 text-indigo-300 border border-indigo-500/20"
                          : "text-[var(--text-2)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-1)] border border-transparent"
                      }`}
                    >
                      <span className={`w-4 h-4 shrink-0 ${active ? "text-indigo-400" : "text-[var(--text-3)]"}`}>
                        {item.icon}
                      </span>
                      <span className="flex-1">{item.label}</span>
                      {"badge" in item && item.badge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 tracking-wide">
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
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            G
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[var(--text-1)] text-xs font-semibold truncate leading-none">Gautam Shah</p>
            <p className="text-[var(--text-3)] text-[10px] truncate mt-0.5">Log out</p>
          </div>
          <ChevronIcon />
        </button>
      </div>
    </aside>
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
