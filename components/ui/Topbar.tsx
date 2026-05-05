"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import CreditMeter from "@/components/credits/CreditMeter";
import MobileNav from "@/components/ui/MobileNav";

const PAGE_LABELS: Record<string, string> = {
  "/dashboard":  "Dashboard",
  "/events":     "Event Room™",
  "/vendors":    "Vendors",
  "/compliance": "Compliance",
  "/proposals":  "Kunjara Vision Board",
  "/budget":     "Budget Builder",
  "/settings":   "Settings",
};

export default function Topbar() {
  const path = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const title = PAGE_LABELS[path] ?? "Kunjara OS";

  return (
    <>
      <header className="sticky top-0 z-30 h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 border-b border-[var(--border)] bg-[var(--bg-surface)]/90 backdrop-blur-md shrink-0">
        {/* Left: hamburger (mobile) + title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button
            onClick={() => setNavOpen(true)}
            className="md:hidden w-10 h-10 -ml-1 flex items-center justify-center rounded-lg text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--bg-hover)] transition-colors"
            aria-label="Open navigation"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>

          <div className="min-w-0">
            <h1 className="text-[var(--text-1)] font-semibold text-sm sm:text-base truncate">
              {title}
            </h1>
            <p className="hidden sm:block text-[var(--text-3)] text-xs truncate">
              Kunjara OS<sup className="text-[8px]">™</sup> · Business Suite
            </p>
          </div>
        </div>

        {/* Right: credit meter only */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <CreditMeter />
        </div>
      </header>

      <MobileNav open={navOpen} onClose={() => setNavOpen(false)} />
    </>
  );
}
