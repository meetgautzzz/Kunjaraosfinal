"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "kunjara_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Small delay so it doesn't flash immediately on load
    const t = setTimeout(() => {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  function save(value: "all" | "essential") {
    localStorage.setItem(STORAGE_KEY, value);
    // Set a real cookie so server-side code can read it if needed
    document.cookie = `${STORAGE_KEY}=${value};max-age=31536000;path=/;SameSite=Lax`;
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Cookie consent"
      style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        zIndex: 9999,
        padding: "16px",
        display: "flex", justifyContent: "center",
        animation: "slideUp 0.4s cubic-bezier(0.2,0.8,0.2,1) both",
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      <div style={{
        maxWidth: 680,
        width: "100%",
        background: "#141220",
        border: "1px solid rgba(212,168,95,0.2)",
        borderRadius: 16,
        padding: "20px 24px",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)",
        display: "flex",
        flexWrap: "wrap",
        gap: 16,
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        {/* Left — copy */}
        <div style={{ flex: "1 1 280px" }}>
          <div style={{
            fontFamily: '"JetBrains Mono",monospace',
            fontSize: 10,
            letterSpacing: "0.18em",
            color: "#D4A85F",
            marginBottom: 6,
          }}>◆ COOKIE NOTICE</div>
          <p style={{
            fontFamily: '"Geist",sans-serif',
            fontSize: 13,
            color: "rgba(244,241,234,0.75)",
            lineHeight: 1.6,
            margin: 0,
          }}>
            We use cookies to keep you signed in and to understand how the platform is used.
            No data is sold or shared.{" "}
            <Link href="/privacy" style={{ color: "#D4A85F", textDecoration: "underline" }}>
              Privacy Policy
            </Link>
          </p>
        </div>

        {/* Right — buttons */}
        <div style={{ display: "flex", gap: 10, flexShrink: 0, flexWrap: "wrap" }}>
          <button
            onClick={() => save("essential")}
            style={{
              padding: "9px 16px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "transparent",
              color: "rgba(244,241,234,0.65)",
              fontFamily: '"Geist",sans-serif',
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Essential only
          </button>
          <button
            onClick={() => save("all")}
            style={{
              padding: "9px 20px",
              borderRadius: 999,
              border: "none",
              background: "linear-gradient(135deg,#D4A85F,#E5C07B)",
              color: "#08080A",
              fontFamily: '"Geist",sans-serif',
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              boxShadow: "0 4px 16px rgba(212,168,95,0.35)",
            }}
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
