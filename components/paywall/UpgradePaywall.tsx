"use client";

import { useState, useEffect } from "react";

interface Props {
  open:    boolean;
  onClose: () => void;
  used:    number;
  limit:   number;
}

const FEATURES = [
  "30 proposals per month",
  "Full PDF export with your branding",
  "GST-compliant invoicing",
  "Event Rooms™ — unlimited sharing",
  "Priority support (< 4 hour response)",
];

export default function UpgradePaywall({ open, onClose, used, limit }: Props) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else       document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  async function handleUpgrade() {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch("/api/subscriptions/upgrade", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
      if (data.payment_link) {
        window.location.href = data.payment_link;
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "100%", maxWidth: 480, margin: "16px",
        background: "#0f1117", borderRadius: 20,
        border: "1px solid rgba(99,102,241,0.3)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.12), 0 0 60px rgba(99,102,241,0.08)",
        overflow: "hidden",
      }}>
        {/* Gold accent bar */}
        <div style={{ height: 3, background: "linear-gradient(90deg, #6366f1, #D4A85F, #6366f1)" }} />

        <div style={{ padding: "32px 32px 28px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", color: "#D4A85F", marginBottom: 8, textTransform: "uppercase", fontFamily: "var(--font-space-grotesk, sans-serif)" }}>
                Proposal limit reached
              </div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#f4f4f5", lineHeight: 1.25, fontFamily: "var(--font-instrument-serif, serif)", fontStyle: "italic" }}>
                Unlock unlimited proposals
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", color: "rgba(244,244,245,0.4)", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "2px 4px", marginTop: -2 }}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Usage bar */}
          <div style={{ marginBottom: 24, padding: "14px 16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: "rgba(244,244,245,0.6)", fontFamily: "var(--font-space-grotesk, sans-serif)" }}>Free plan usage</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#f87171", fontFamily: "var(--font-jetbrains-mono, monospace)" }}>{used}/{limit} used</span>
            </div>
            <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 99 }}>
              <div style={{ height: "100%", width: "100%", background: "#ef4444", borderRadius: 99 }} />
            </div>
          </div>

          {/* Price */}
          <div style={{ textAlign: "center", marginBottom: 24, padding: "20px 0", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 36, fontWeight: 700, color: "#f4f4f5", letterSpacing: "-0.02em" }}>
              ₹3,000
            </div>
            <div style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 13, color: "rgba(244,244,245,0.4)", marginTop: 4 }}>
              per month · cancel anytime
            </div>
          </div>

          {/* Features */}
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 10 }}>
            {FEATURES.map((f) => (
              <li key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 18, height: 18, borderRadius: 99, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.35)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#818cf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 13, color: "rgba(244,244,245,0.75)" }}>{f}</span>
              </li>
            ))}
          </ul>

          {/* Error */}
          {error && (
            <div style={{ marginBottom: 16, padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 13, color: "#fca5a5" }}>
              {error}
            </div>
          )}

          {/* CTAs */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={handleUpgrade}
              disabled={loading}
              style={{
                width: "100%", padding: "14px 20px", borderRadius: 12,
                background: loading ? "rgba(99,102,241,0.5)" : "linear-gradient(135deg, #6366f1, #818cf8)",
                color: "#fff", border: "none", fontFamily: "var(--font-space-grotesk, sans-serif)",
                fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 8px 24px rgba(99,102,241,0.4)",
                transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {loading ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation: "spin 0.8s linear infinite" }}>
                    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity={0.25}/>
                    <path d="M21 12a9 9 0 00-9-9"/>
                  </svg>
                  Redirecting to Razorpay...
                </>
              ) : "Upgrade to Pro →"}
            </button>
            <button
              onClick={onClose}
              style={{
                width: "100%", padding: "12px 20px", borderRadius: 12,
                background: "transparent", color: "rgba(244,244,245,0.4)",
                border: "1px solid rgba(255,255,255,0.08)",
                fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 13, cursor: "pointer",
              }}
            >
              Remind me later
            </button>
          </div>

          <p style={{ marginTop: 16, textAlign: "center", fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 11, color: "rgba(244,244,245,0.25)", lineHeight: 1.5 }}>
            Secured by Razorpay · GST invoice provided · Cancel anytime from your settings
          </p>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
