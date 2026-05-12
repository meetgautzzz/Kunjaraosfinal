import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kunjara OS™ — Events run intelligently.",
  description: "India's first AI-powered event operating system. Client-ready proposals in 5–10 minutes. GST-compliant. Made in Bharat.",
};

export default function HomePage() {
  const GOLD = "#D4A85F";

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0C", color: "#F4F1EA", fontFamily: "var(--font-poppins, system-ui, sans-serif)" }}>

      {/* Nav */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        padding: "18px 6vw", display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(10,10,12,0.75)", backdropFilter: "blur(18px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <span style={{ fontFamily: "serif", fontSize: 20, fontStyle: "italic", color: GOLD }}>Kunjara OS™</span>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/login" style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", color: "rgba(244,241,234,0.75)", fontSize: 13, textDecoration: "none" }}>
            Log in
          </Link>
          <Link href="/signup" style={{ padding: "8px 20px", borderRadius: 8, background: GOLD, color: "#0A0A0C", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
            Get started →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "120px 24px 80px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: GOLD, marginBottom: 24, opacity: 0.8 }}>
          ◆ AI-Powered Event OS · Made in Bharat
        </p>
        <h1 style={{ fontSize: "clamp(36px, 7vw, 72px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: 24, maxWidth: 800 }}>
          Events run{" "}
          <span style={{ fontFamily: "serif", fontStyle: "italic", color: GOLD }}>intelligently.</span>
        </h1>
        <p style={{ fontSize: "clamp(15px, 2vw, 18px)", color: "rgba(244,241,234,0.65)", lineHeight: 1.75, maxWidth: 560, marginBottom: 48 }}>
          India&apos;s first AI-powered event operating system. Client-ready proposals in 5–10 minutes. GST-compliant. Replace six tools with one.
        </p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/signup" style={{
            padding: "16px 36px", borderRadius: 999,
            background: `linear-gradient(135deg, ${GOLD}, #E5C07B)`,
            color: "#0A0A0C", fontWeight: 700, fontSize: 15, textDecoration: "none",
          }}>
            Start free →
          </Link>
          <Link href="/features" style={{
            padding: "16px 32px", borderRadius: 999,
            border: "1px solid rgba(244,241,234,0.15)",
            color: "rgba(244,241,234,0.75)", fontSize: 15, textDecoration: "none",
          }}>
            See features
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 48, marginTop: 72, flexWrap: "wrap", justifyContent: "center" }}>
          {[["500+", "Event professionals"], ["5 min", "Avg. proposal time"], ["₹0", "To get started"]].map(([stat, label]) => (
            <div key={stat} style={{ textAlign: "center" }}>
              <p style={{ fontSize: 28, fontWeight: 800, color: GOLD, marginBottom: 4 }}>{stat}</p>
              <p style={{ fontSize: 12, color: "rgba(244,241,234,0.45)", letterSpacing: "0.05em" }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features strip */}
      <section style={{ padding: "80px 24px", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {[
            { icon: "✦", title: "AI Proposal Generator", desc: "5 questions → complete proposal with concept, budget, timeline, vendors." },
            { icon: "🎭", title: "Design & Layout Studio", desc: "Mood boards, 3D renders, floor plans, stage design — all in one tab." },
            { icon: "₹",  title: "GST-Compliant Budgets", desc: "Auto-calculated breakdowns, tax-inclusive line items, PDF export." },
            { icon: "📋", title: "Client Portal",         desc: "Share a link. Clients approve, comment, and sign off — no login needed." },
            { icon: "📐", title: "Floor Plan Builder",    desc: "Drag-and-drop layout + AI-suggest for optimal guest flow." },
            { icon: "⚖",  title: "Compliance Tracker",   desc: "Venue permits, catering licenses, safety checklist — auto-generated." },
          ].map((f) => (
            <div key={f.title} style={{
              padding: 24, borderRadius: 12,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            }}>
              <span style={{ fontSize: 22, marginBottom: 12, display: "block" }}>{f.icon}</span>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#F4F1EA", marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: "rgba(244,241,234,0.5)", lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>Ready to close more clients?</h2>
        <p style={{ fontSize: 15, color: "rgba(244,241,234,0.55)", marginBottom: 36 }}>Free to start. No credit card required.</p>
        <Link href="/signup" style={{
          padding: "18px 48px", borderRadius: 999,
          background: `linear-gradient(135deg, ${GOLD}, #E5C07B)`,
          color: "#0A0A0C", fontWeight: 700, fontSize: 16, textDecoration: "none",
          display: "inline-block",
        }}>
          Create your first proposal →
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ padding: "40px 6vw 32px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16, fontSize: 12, color: "rgba(244,241,234,0.3)" }}>
        <span>© 2025 Kunjara OS™ · Made in Mumbai 🇮🇳</span>
        <div style={{ display: "flex", gap: 24 }}>
          {[["Pricing", "/pricing"], ["Features", "/features"], ["Privacy", "/privacy"], ["Terms", "/terms"]].map(([label, href]) => (
            <Link key={href} href={href} style={{ color: "rgba(244,241,234,0.35)", textDecoration: "none" }}>{label}</Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
