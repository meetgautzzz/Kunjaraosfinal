import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing | Kunjara OS™",
  description: "Simple, transparent pricing for event professionals. Start free — upgrade when you need more.",
};

const FREE_FEATURES = ["2 proposals/month", "Basic templates", "PDF export", "Mobile access"];
const PRO_FEATURES  = ["30 proposals/month", "All templates", "PDF + PPT export", "Client sharing", "Team access", "Priority support"];

export default function PricingPage() {
  return (
    <div style={{ padding: "60px 24px", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 60 }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: "var(--text-1)", marginBottom: 12 }}>
          Simple, Transparent Pricing
        </h1>
        <p style={{ fontSize: 16, color: "var(--text-2)" }}>
          Start free. Upgrade when you need more.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
        {/* Free */}
        <div style={{ padding: 32, border: "1px solid var(--border)", borderRadius: 12, background: "var(--bg-card)" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-1)", marginBottom: 8 }}>Free</h2>
          <p style={{ fontSize: 32, fontWeight: 800, color: "var(--text-1)", marginBottom: 24 }}>
            ₹0<span style={{ fontSize: 16, color: "var(--text-3)" }}>/month</span>
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px" }}>
            {FREE_FEATURES.map((f) => (
              <li key={f} style={{ padding: "8px 0", fontSize: 14, color: "var(--text-2)", borderBottom: "1px solid var(--border)" }}>
                ✓ {f}
              </li>
            ))}
          </ul>
          <Link href="/signup" style={{
            display: "block", textAlign: "center", padding: "12px",
            background: "var(--bg-surface)", border: "1px solid var(--border)",
            borderRadius: 8, fontWeight: 600, fontSize: 14, color: "var(--text-1)", textDecoration: "none",
          }}>
            Get Started Free
          </Link>
        </div>

        {/* Pro */}
        <div style={{ padding: 32, border: "2px solid #6366f1", borderRadius: 12, background: "rgba(99,102,241,0.05)" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#6366f1", marginBottom: 12 }}>MOST POPULAR</p>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-1)", marginBottom: 8 }}>Pro</h2>
          <p style={{ fontSize: 32, fontWeight: 800, color: "var(--text-1)", marginBottom: 24 }}>
            ₹3,000<span style={{ fontSize: 16, color: "var(--text-3)" }}>/month</span>
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px" }}>
            {PRO_FEATURES.map((f) => (
              <li key={f} style={{ padding: "8px 0", fontSize: 14, color: "var(--text-2)", borderBottom: "1px solid rgba(99,102,241,0.15)" }}>
                ✓ {f}
              </li>
            ))}
          </ul>
          <Link href="/signup" style={{
            display: "block", textAlign: "center", padding: "12px",
            background: "#6366f1", color: "#fff",
            borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: "none",
          }}>
            Start Pro Trial
          </Link>
        </div>
      </div>

      <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-3)", marginTop: 40 }}>
        All prices include GST. Cancel anytime. Questions?{" "}
        <Link href="/contact" style={{ color: "#6366f1", textDecoration: "none" }}>Contact us</Link>
      </p>
    </div>
  );
}
