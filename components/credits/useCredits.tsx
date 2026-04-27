"use client";

// Single source of truth for the user's AI credit balance across the
// app. Components subscribe via useCredits(); any component that mutates
// credits (post-AI-call, post-purchase) calls refresh() to repaint
// everything. No prop drilling.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type Ctx = {
  remaining: number | null; // null = not yet loaded
  loading:   boolean;
  error:     string | null;
  refresh:   () => Promise<void>;
  // Optimistic update — the AI success envelope returns credits_remaining,
  // so routes can hand that value straight in without a re-fetch.
  setRemaining: (n: number) => void;
  // Modal control lives here so any component can open it via the hook.
  buyModalOpen:  boolean;
  openBuyModal:  () => void;
  closeBuyModal: () => void;
};

const CreditsContext = createContext<Ctx | null>(null);

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const [remaining,    setRemainingState] = useState<number | null>(null);
  const [loading,      setLoading]        = useState(true);
  const [error,        setError]          = useState<string | null>(null);
  const [buyModalOpen, setBuyModalOpen]   = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/credits/summary", { cache: "no-store" });
      if (!r.ok) throw new Error("Could not load credits.");
      const d = await r.json();
      setRemainingState(typeof d.credits_remaining === "number" ? d.credits_remaining : 0);
    } catch (e: any) {
      setError(e.message ?? "Could not load credits.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const value = useMemo<Ctx>(() => ({
    remaining,
    loading,
    error,
    refresh,
    setRemaining: (n) => setRemainingState(n),
    buyModalOpen,
    openBuyModal:  () => setBuyModalOpen(true),
    closeBuyModal: () => setBuyModalOpen(false),
  }), [remaining, loading, error, refresh, buyModalOpen]);

  return <CreditsContext.Provider value={value}>{children}</CreditsContext.Provider>;
}

export function useCredits(): Ctx {
  const ctx = useContext(CreditsContext);
  if (!ctx) {
    // Tolerant fallback for components rendered outside the provider
    // (e.g. server tests). Never throws; returns sensible defaults.
    return {
      remaining: null, loading: false, error: null,
      refresh: async () => {}, setRemaining: () => {},
      buyModalOpen: false, openBuyModal: () => {}, closeBuyModal: () => {},
    };
  }
  return ctx;
}
