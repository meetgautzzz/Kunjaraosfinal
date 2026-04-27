"use client";

// Topbar AI-credit indicator. "AI Power: X remaining". Click → opens
// the buy-credits modal. Visually de-emphasized so it never competes
// with primary content, but glanceable.

import { useCredits } from "./useCredits";

export default function CreditMeter() {
  const { remaining, loading, openBuyModal } = useCredits();

  // Color tier: green > 5, amber 1-5, red 0
  const tone =
    remaining === null ? "neutral" :
    remaining <= 0 ? "red"   :
    remaining <= 5 ? "amber" : "emerald";

  const colors = {
    neutral: "border-[var(--border)] text-[var(--text-3)]",
    emerald: "border-emerald-500/25 text-emerald-400 hover:border-emerald-500/40",
    amber:   "border-amber-500/30  text-amber-400  hover:border-amber-500/50",
    red:     "border-red-500/30    text-red-400    hover:border-red-500/50",
  }[tone];

  return (
    <button
      onClick={openBuyModal}
      title="Buy more AI credits"
      className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-[var(--bg-card)] text-xs font-medium transition-colors ${colors}`}
    >
      <span className="text-[10px] opacity-70 uppercase tracking-wide">AI Power</span>
      <span className="font-semibold tabular-nums">
        {loading || remaining === null ? "—" : remaining}
      </span>
      <span className="opacity-60">remaining</span>
      {tone !== "neutral" && (
        <span className="ml-1 text-[10px] opacity-60 hidden md:inline">+ buy</span>
      )}
    </button>
  );
}
