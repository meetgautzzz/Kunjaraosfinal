"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import type { FpElement } from "@/components/toolkit/FloorPlanBuilder";

const FloorPlanBuilder = dynamic(
  () => import("@/components/toolkit/FloorPlanBuilder"),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--text-3)", fontSize: 13 }}>Loading floor plan…</p>
      </div>
    ),
  }
);

const STORAGE_KEY = "kunjara_floor_plan_v1";

function load(): FpElement[] {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export default function FloorPlanPage() {
  const [initial, setInitial] = useState<FpElement[]>([]);
  const [saved,   setSaved]   = useState(false);
  const [current, setCurrent] = useState<FpElement[]>([]);

  useEffect(() => {
    const els = load();
    setInitial(els);
    setCurrent(els);
  }, []);

  function handleChange(els: FpElement[]) {
    setCurrent(els);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(els)); } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--border)] shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-500/15 text-amber-400 text-xl">
            ⬛
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-1)]">Floor Plan Builder</h1>
            <p className="text-[var(--text-3)] text-xs">Grid-based event layout · 1 cell = 1 metre · auto-saved locally</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-xs text-emerald-400 font-medium">✓ Saved</span>
          )}
          <span className="text-[var(--text-3)] text-xs">{current.length} element{current.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 min-h-0">
        <FloorPlanBuilder
          initialElements={initial}
          onElementsChange={handleChange}
        />
      </div>
    </div>
  );
}
