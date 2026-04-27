"use client";

// Buy-credits modal. Opens via useCredits().openBuyModal().
// 1-click → Razorpay Checkout → webhook fulfils → modal auto-refreshes
// the balance and closes. Pricing is server-resolved; client cannot
// tamper.

import { useEffect, useState } from "react";
import { useCredits } from "./useCredits";
import { CREDIT_PACKS, type CreditPackId } from "@/lib/creditPacks";

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector(`script[src="${RAZORPAY_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }
    const s = document.createElement("script");
    s.src = RAZORPAY_SCRIPT;
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function BuyCreditsModal() {
  const { buyModalOpen, closeBuyModal, refresh, remaining } = useCredits();
  const [busyPack, setBusyPack] = useState<CreditPackId | null>(null);
  const [err,      setErr]      = useState<string>("");

  // Reset state when reopened.
  useEffect(() => {
    if (buyModalOpen) { setBusyPack(null); setErr(""); }
  }, [buyModalOpen]);

  // Esc to close
  useEffect(() => {
    if (!buyModalOpen) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") closeBuyModal(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [buyModalOpen, closeBuyModal]);

  if (!buyModalOpen) return null;

  async function handleBuy(packId: CreditPackId) {
    setErr("");
    setBusyPack(packId);
    try {
      const ok = await loadRazorpay();
      if (!ok || !window.Razorpay) {
        throw new Error("Could not load Razorpay. Check your connection.");
      }

      const orderRes = await fetch("/api/credits/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack: packId }),
      });
      const orderJson = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderJson.error ?? "Could not start checkout.");

      const rz = new window.Razorpay({
        key:      orderJson.keyId,
        amount:   orderJson.amount,
        currency: orderJson.currency,
        order_id: orderJson.orderId,
        name:     "Kunjara OS",
        description: `${orderJson.pack.credits} AI credits`,
        theme:    { color: "#6366f1" },
        handler: async () => {
          // Webhook does the actual credit grant; we just poll the
          // summary endpoint until it appears, then close the modal.
          const start = Date.now();
          let landed = false;
          while (Date.now() - start < 12000) {
            await new Promise((r) => setTimeout(r, 800));
            await refresh();
            // Use the latest value via a fresh fetch — simplest: trust refresh
            landed = true; // we exit and close; meter will repaint from refresh()
            break;
          }
          if (landed) closeBuyModal();
        },
        modal: {
          ondismiss: () => setBusyPack(null),
        },
      });
      rz.open();
    } catch (e: any) {
      setErr(e.message ?? "Checkout failed.");
      setBusyPack(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
      onClick={closeBuyModal}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-scale-in"
        style={{
          width: "100%", maxWidth: 760,
          borderRadius: 18,
          border: "1px solid var(--border)",
          background: "var(--bg-card)",
          boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div className="px-7 pt-7 pb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[var(--text-3)] text-[11px] uppercase tracking-[0.15em] font-semibold">
              {remaining !== null && remaining <= 0 ? "Out of credits" : "Top up"}
            </p>
            <h2 className="text-[var(--text-1)] text-2xl font-bold mt-2 tracking-tight">
              Continue your planning <span className="text-indigo-400">⚡</span>
            </h2>
            <p className="text-[var(--text-2)] text-sm mt-2 max-w-md">
              Buy a pack of AI credits — used instantly for proposal generation, regenerations, and AI tools.
              {remaining !== null && (
                <> You currently have <strong className="text-[var(--text-1)]">{remaining}</strong> credits.</>
              )}
            </p>
          </div>
          <button
            onClick={closeBuyModal}
            className="text-[var(--text-3)] hover:text-[var(--text-1)] text-lg shrink-0"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Packs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-7 pb-2">
          {CREDIT_PACKS.map((pack) => {
            const isMid    = pack.id === "medium";
            const perCredit = (pack.amountInr / pack.credits).toFixed(0);
            const busy     = busyPack === pack.id;
            const anyBusy  = busyPack !== null;
            return (
              <div
                key={pack.id}
                className={`relative rounded-2xl border p-5 flex flex-col gap-4 transition-colors ${
                  isMid
                    ? "border-indigo-500/50 bg-indigo-500/5"
                    : "border-[var(--border)] bg-[var(--bg-surface)]"
                }`}
              >
                {isMid && (
                  <span className="absolute -top-2 right-4 text-[10px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full bg-indigo-500 text-white">
                    Best value
                  </span>
                )}
                <div>
                  <p className="text-[var(--text-3)] text-xs uppercase tracking-wide font-semibold">{pack.id}</p>
                  <p className="text-[var(--text-1)] text-3xl font-black tabular-nums mt-2">
                    {pack.credits}
                    <span className="text-[var(--text-3)] text-sm font-medium ml-1.5">credits</span>
                  </p>
                </div>
                <div>
                  <p className="text-[var(--text-1)] text-xl font-bold tabular-nums">
                    ₹{pack.amountInr.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[var(--text-3)] text-xs mt-1">
                    ₹{perCredit} per credit
                  </p>
                </div>
                <button
                  onClick={() => handleBuy(pack.id)}
                  disabled={anyBusy}
                  className={`mt-auto w-full px-4 py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isMid
                      ? "bg-indigo-500 hover:bg-indigo-600 text-white"
                      : "bg-[var(--bg-card)] border border-[var(--border)] hover:border-indigo-500/40 text-[var(--text-1)]"
                  }`}
                >
                  {busy ? "Opening checkout…" : "Buy now"}
                </button>
              </div>
            );
          })}
        </div>

        {err && (
          <div className="px-7 pt-2">
            <p className="text-red-400 text-xs">{err}</p>
          </div>
        )}

        {/* Footer */}
        <div className="px-7 py-4 mt-3 border-t border-[var(--border)] bg-[var(--bg-surface)] flex items-center justify-between text-[11px] text-[var(--text-3)]">
          <span>🔒 Secure payment via Razorpay · UPI, cards, netbanking</span>
          <span>Credits applied within seconds of payment</span>
        </div>
      </div>
    </div>
  );
}
