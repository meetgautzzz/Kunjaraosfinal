import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us — Kunjara OS™",
  description: "Built by event professionals, for event professionals. 20+ years of field intelligence distilled into an AI-powered OS.",
};

const ACCENT = "#D4A85F";


const values = [
  { title: "The planner comes first", body: "Every feature is designed for the person behind the proposal, not the tech stack underneath it." },
  { title: "Field intelligence, not lab theory", body: "20+ years of real event data — pricing, vendor rates, guest flow, run-of-show timing — baked into every AI output." },
  { title: "Lex Mercatoria", body: "We grow only when you grow. The ecosystem wins together — planner, client, vendor. That's the founding principle." },
  { title: "India-first, always", body: "GST-correct from day one. DPDP-compliant. Regional pricing. Hindi support coming. Built for Bharat, not Silicon Valley." },
];

export default function AboutPage() {
  return (
    <div style={{ background: "#0A0A0C", color: "#F4F1EA", minHeight: "100vh" }}>

      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, padding: "16px 6vw", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(10,10,12,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <Link href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 10, color: "#F4F1EA" }}>
          <svg width={36} height={36} viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="29" stroke="#F4F1EA" strokeWidth="1.25" opacity="0.35" /><circle cx="32" cy="32" r="29" stroke="#F4F1EA" strokeWidth="1.25" strokeDasharray="2 6" opacity="0.5" transform="rotate(-30 32 32)" /><g stroke="#F4F1EA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"><path d="M16 38 C 16 22, 48 22, 48 38" /><path d="M22 38 C 22 48, 32 50, 34 42 C 35 38, 30 36, 30 40" /><path d="M40 40 L 44 46" /><circle cx="40" cy="32" r="1.4" fill="#F4F1EA" stroke="none" /></g><circle cx="58" cy="22" r="1.6" fill="#F4F1EA" /></svg>
          <span style={{ fontFamily: "var(--font-instrument-serif, serif)", fontSize: 20, fontStyle: "italic" }}>Kunjara<span style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 16, fontStyle: "normal", fontWeight: 500, marginLeft: 4 }}>OS</span></span>
        </Link>
        <Link href="/signup" style={{ padding: "9px 20px", borderRadius: 999, background: ACCENT, color: "#0A0A0C", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Get started →</Link>
      </nav>

      {/* Hero */}
      <section style={{ padding: "100px 6vw 80px", maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, letterSpacing: "0.25em", color: ACCENT, marginBottom: 24 }}>◆ ABOUT US · INDIGO EP</div>
        <h1 style={{ fontFamily: "var(--font-instrument-serif, serif)", fontSize: "clamp(48px, 7vw, 96px)", lineHeight: 1.0, fontWeight: 400, margin: "0 0 32px", letterSpacing: "-0.025em", maxWidth: 900 }}>
          Built by event professionals,<br /><span style={{ fontStyle: "italic", color: ACCENT }}>for event professionals.</span>
        </h1>
        <p style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 19, lineHeight: 1.6, color: "rgba(244,241,234,0.65)", maxWidth: 660 }}>
          Kunjara OS is the operating system behind India's fastest-growing event businesses.
        </p>
      </section>

      {/* Founder */}
      <section style={{ padding: "0 6vw 100px", maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 80, alignItems: "start" }}>
          <div style={{ position: "relative" }}>
            <div style={{ aspectRatio: "4/5", borderRadius: 18, overflow: "hidden", background: "linear-gradient(135deg, #1A1612 0%, #15110A 100%)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-instrument-serif, serif)", fontSize: 72, fontStyle: "italic", color: "rgba(212,168,95,0.2)", lineHeight: 1 }}>GS</div>
                <div style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 10, color: "rgba(212,168,95,0.4)", letterSpacing: "0.15em", marginTop: 12 }}>FOUNDER</div>
              </div>
            </div>
            <div style={{ marginTop: 20, padding: "16px 20px", background: "rgba(212,168,95,0.06)", border: "1px solid rgba(212,168,95,0.15)", borderRadius: 12 }}>
              <div style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 15, fontWeight: 600, color: "#F4F1EA", marginBottom: 4 }}>Gautam Shah</div>
              <div style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, color: "rgba(244,241,234,0.5)", letterSpacing: "0.05em" }}>Founder · Kunjara OS<br />Founder · Indigo Events & Promotions<br />Mumbai, India · Est. 2004</div>
            </div>
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, letterSpacing: "0.2em", color: ACCENT, marginBottom: 24 }}>◆ THE FOUNDER</div>
            <blockquote style={{ fontFamily: "var(--font-instrument-serif, serif)", fontSize: "clamp(22px, 2.5vw, 32px)", lineHeight: 1.3, fontWeight: 400, margin: "0 0 32px", color: "#F4F1EA", fontStyle: "italic" }}>
              &ldquo;I&apos;ve sat across clients with a proposal that took my team three days to build. Then watched them sign with a competitor who sent something in an hour. That can&apos;t be the model.&rdquo;
            </blockquote>
            <p style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 16, lineHeight: 1.7, color: "rgba(244,241,234,0.6)", marginBottom: 20 }}>
              Gautam Shah has been running events in India since 2004 — weddings, corporate galas, brand launches, concerts. Indigo Events & Promotions has produced events across Mumbai, Delhi, Bangalore, and Hyderabad.
            </p>
            <p style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 16, lineHeight: 1.7, color: "rgba(244,241,234,0.6)" }}>
              Kunjara OS is the software he wished he had in 2004. Every feature maps to a real problem his team solved (or failed to solve) in the field. The pricing is what the Mumbai market actually charges. The GST logic is what real Indian event budgets require.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section style={{ padding: "100px 6vw 120px", maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, letterSpacing: "0.25em", color: ACCENT, marginBottom: 20 }}>◆ WHAT WE BELIEVE</div>
        <h2 style={{ fontFamily: "var(--font-instrument-serif, serif)", fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 1.05, fontWeight: 400, margin: "0 0 60px", letterSpacing: "-0.02em" }}>
          The principles we<br /><span style={{ fontStyle: "italic", color: ACCENT }}>build everything on.</span>
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {values.map((v, i) => (
            <div key={v.title} style={{ padding: "32px", borderRadius: 16, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 10, color: "rgba(212,168,95,0.5)", letterSpacing: "0.15em", marginBottom: 16 }}>0{i + 1}</div>
              <div style={{ fontFamily: "var(--font-instrument-serif, serif)", fontSize: 22, fontStyle: "italic", color: "#F4F1EA", marginBottom: 16, lineHeight: 1.2 }}>{v.title}</div>
              <div style={{ width: 28, height: 1, background: "rgba(212,168,95,0.4)", marginBottom: 20 }} />
              <p style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 14, lineHeight: 1.7, color: "rgba(244,241,234,0.55)", margin: 0 }}>{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 6vw 100px", borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--font-instrument-serif, serif)", fontSize: "clamp(32px, 4vw, 56px)", lineHeight: 1.1, fontWeight: 400, margin: "0 0 24px", letterSpacing: "-0.02em" }}>
          Ready to run events<br /><span style={{ fontStyle: "italic", color: ACCENT }}>intelligently?</span>
        </h2>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginTop: 36 }}>
          <Link href="/signup" style={{ padding: "16px 32px", borderRadius: 999, background: ACCENT, color: "#0A0A0C", fontSize: 15, fontWeight: 600, textDecoration: "none", boxShadow: `0 12px 36px -8px ${ACCENT}80` }}>
            Start free →
          </Link>
          <Link href="/contact" style={{ padding: "16px 28px", borderRadius: 999, border: "1px solid rgba(244,241,234,0.15)", color: "rgba(244,241,234,0.75)", fontSize: 15, textDecoration: "none" }}>
            Talk to us
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "32px 6vw", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, color: "rgba(244,241,234,0.3)", letterSpacing: "0.06em" }}>© 2026 Kunjara OS™ by Indigo Events & Promotions.</span>
        <div style={{ display: "flex", gap: 20 }}>
          {[["Home", "/"], ["Pricing", "/pricing"], ["Contact", "/contact"], ["Privacy", "/privacy"]].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: 12, color: "rgba(244,241,234,0.35)", textDecoration: "none" }}>{l}</Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
