"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard",  icon: <GridIcon />,    label: "Dashboard" },
      { href: "/proposals",  icon: <SparkleIcon />, label: "Vision Board", badge: "AI" },
      { href: "/brain",      icon: <AiIcon />,      label: "Atlas X",      badge: "AI" },
      { href: "/budget",     icon: <WalletIcon />,  label: "Budget Builder" },
      { href: "/events",     icon: <CalIcon />,     label: "Event Room™" },
      { href: "/vendors",    icon: <StoreIcon />,   label: "Vendors" },
    ],
  },
  {
    label: "Compliance",
    items: [
      { href: "/compliance", icon: <ShieldIcon />, label: "Compliance" },
    ],
  },
];

const TOOLKIT_ITEMS: {
  href?: string;
  label: string;
  icon: React.ReactNode;
  soon?: boolean;
}[] = [
  { href: "/toolkit/budget-builder", icon: <ToolBudgetIcon />, label: "Budget Builder" },
  { href: "/toolkit/run-of-show",    icon: <ToolRunIcon />,    label: "Run of Show" },
  { href: "/toolkit/social-caption", icon: <ToolSocialIcon />, label: "Social Caption" },
  { icon: <ToolCanvaIcon />,   label: "Canva Pitch Deck", soon: true },
  { icon: <ToolBlenderIcon />, label: "Blender 3D",       soon: true },
];

export default function Sidebar() {
  const path = usePathname();
  const [userEmail,   setUserEmail]   = useState("");
  const [userInitial, setUserInitial] = useState("?");
  const [toolkitOpen, setToolkitOpen] = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Auto-expand toolkit when the active route is inside it.
  useEffect(() => {
    if (path.startsWith("/toolkit")) setToolkitOpen(true);
  }, [path]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email ?? "";
      setUserEmail(email);
      setUserInitial(email.charAt(0).toUpperCase() || "?");
    });
  }, []);

  // Close popup on outside click.
  useEffect(() => {
    if (!menuOpen) return;
    function handle(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [menuOpen]);

  async function handleLogout() {
    setMenuOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const settingsActive = path.startsWith("/settings");

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

        {/* Standard groups */}
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

        {/* ── Toolkit (collapsible) ────────────────────────────────────────── */}
        <div>
          <button
            onClick={() => setToolkitOpen((v) => !v)}
            className="w-full flex items-center gap-2 px-2 mb-1.5 group"
          >
            <p className="text-[var(--text-3)] text-[10px] uppercase tracking-[0.12em] font-semibold flex-1 text-left">
              Toolkit
            </p>
            <span className="text-[var(--text-3)] transition-transform duration-200" style={{ transform: toolkitOpen ? "rotate(90deg)" : "rotate(0deg)" }}>
              <SmallChevron />
            </span>
          </button>

          {toolkitOpen && (
            <ul className="flex flex-col gap-0.5">
              {TOOLKIT_ITEMS.map((item) => {
                if (item.soon) {
                  return (
                    <li key={item.label}>
                      <div
                        className="flex items-center gap-3 px-3 py-2 rounded-lg border border-transparent cursor-default select-none"
                        title="Launching soon"
                      >
                        <span className="w-4 h-4 shrink-0 text-[var(--text-3)] opacity-40">
                          {item.icon}
                        </span>
                        <span className="flex-1 text-sm font-medium text-[var(--text-3)] opacity-50 truncate">
                          {item.label}
                        </span>
                        <span
                          className="text-[8px] font-bold px-1.5 py-0.5 rounded-full tracking-wide shrink-0"
                          style={{ background: "rgba(74,69,53,0.25)", color: "#4A4535", border: "1px solid rgba(74,69,53,0.35)" }}
                        >
                          Soon
                        </span>
                      </div>
                    </li>
                  );
                }

                const active = path === item.href || path.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href!}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                        active
                          ? "border border-[var(--accent)]/20 text-[var(--accent)]"
                          : "text-[var(--text-2)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-1)] border border-transparent"
                      }`}
                    >
                      <span className={`w-4 h-4 shrink-0 ${active ? "text-[var(--accent)]" : "text-[var(--text-3)]"}`}>
                        {item.icon}
                      </span>
                      <span className="flex-1 truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Settings — single link */}
        <div>
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              settingsActive
                ? "border border-[var(--accent)]/20 text-[var(--accent)]"
                : "text-[var(--text-2)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-1)] border border-transparent"
            }`}
          >
            <span className={`w-4 h-4 shrink-0 ${settingsActive ? "text-[var(--accent)]" : "text-[var(--text-3)]"}`}>
              <GearIcon />
            </span>
            <span className="flex-1">Settings</span>
          </Link>
        </div>

      </nav>

      {/* User footer — opens popup menu */}
      <div className="relative shrink-0 px-3 py-3 border-t border-[var(--border)]" ref={menuRef}>
        {/* Popup menu — renders above the trigger */}
        {menuOpen && (
          <div
            className="absolute bottom-full left-3 right-3 mb-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-xl overflow-hidden"
            style={{ zIndex: 100 }}
          >
            <Link
              href="/settings"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-2)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-1)] transition-colors"
            >
              <GearIcon />
              Settings
            </Link>
            <Link
              href="/settings?tab=billing"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-2)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-1)] transition-colors border-t border-[var(--border)]"
            >
              <BillingIcon />
              Billing
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors border-t border-[var(--border)]"
            >
              <LogoutIcon />
              Log out
            </button>
          </div>
        )}

        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border-mid)] cursor-pointer transition-all text-left"
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: "linear-gradient(135deg, #D4A85F, #C9785F)", color: "#08080A" }}>
            {userInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[var(--text-1)] text-xs font-semibold truncate leading-none">{userEmail || "Account"}</p>
            <p className="text-[var(--text-3)] text-[10px] truncate mt-0.5">Settings & billing</p>
          </div>
          <span className={`text-[var(--text-3)] transition-transform duration-150 ${menuOpen ? "rotate-180" : ""}`}>
            <ChevronIcon />
          </span>
        </button>
      </div>
    </aside>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

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
function SmallChevron() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
function GridIcon()    { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>; }
function CalIcon()     { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>; }
function StoreIcon()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l1-5h16l1 5" /><path d="M3 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0" /><path d="M5 20h14V9" /></svg>; }
function SparkleIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" /></svg>; }
function WalletIcon()  { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M16 12h2" /><path d="M2 10h20" /></svg>; }
function ShieldIcon()  { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L4 6v6c0 5.25 3.5 9.74 8 11 4.5-1.26 8-5.75 8-11V6L12 2z" /></svg>; }
function GearIcon()    { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>; }
function BillingIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h22" /></svg>; }
function AiIcon()      { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>; }
function ChevronIcon() { return <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6" /></svg>; }
function LogoutIcon()  { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>; }

// Toolkit item icons
function ToolBudgetIcon()  { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 7H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3" /><rect x="9" y="3" width="6" height="5" rx="1" /><path d="M9 14h.01M12 14h.01M15 14h.01M9 17h.01M12 17h.01" /></svg>; }
function ToolRunIcon()     { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>; }
function ToolSocialIcon()  { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13" /><path d="M22 2L15 22l-4-9-9-4 20-7z" /></svg>; }
function ToolCanvaIcon()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>; }
function ToolBlenderIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a9 9 0 1 0 0 18A9 9 0 0 0 12 3z" /><path d="M12 8v8M8 12h8" /></svg>; }
