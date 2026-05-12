import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "DPDP Act 2023 Compliance — Kunjara OS™",
  description: "Kunjara OS is fully compliant with India's Digital Personal Data Protection Act 2023. Learn how we collect, store, and protect your data.",
};

const ACCENT = "#D4A85F";

const rights = [
  { title: "Right to Access", desc: "You can request a complete copy of all personal data we hold about you at any time. We will provide it within 72 hours in a machine-readable format." },
  { title: "Right to Correction", desc: "If any data we hold is inaccurate or incomplete, you can request a correction. We will update it within 48 hours of verification." },
  { title: "Right to Erasure", desc: "You may request deletion of your personal data at any time. We will permanently erase it within 30 days, except where retention is required by law." },
  { title: "Right to Grievance Redressal", desc: "You have the right to lodge a complaint about our data practices. Our Data Protection Officer will respond within 7 business days." },
  { title: "Right to Nominate", desc: "Under DPDP Act 2023, you may nominate another individual to exercise your data rights in the event of your death or incapacitation." },
];

const dataCategories = [
  { category: "Account Data", examples: "Name, email address, phone number, password (hashed)", purpose: "Account creation, authentication, and communication", retention: "Duration of account + 30 days after deletion" },
  { category: "Event & Proposal Data", examples: "Client names, event briefs, budgets, vendor details", purpose: "Core platform functionality — proposal generation, Event Rooms", retention: "Duration of account + 30 days after deletion" },
  { category: "Usage Data", examples: "Pages visited, features used, session duration", purpose: "Product improvement, bug fixing, analytics", retention: "12 months, then anonymised" },
  { category: "Payment Data", examples: "Card last 4 digits, billing address, transaction ID", purpose: "Billing and subscription management", retention: "7 years (statutory financial record requirement)" },
  { category: "Support Communications", examples: "Emails, chat messages, support tickets", purpose: "Customer support and dispute resolution", retention: "3 years" },
];

export default function DPDPPage() {
  return (
    <div style={{ background: "#0A0A0C", color: "#F4F1EA", minHeight: "100vh" }}>

      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, padding: "16px 6vw", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(10,10,12,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <Link href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 10, color: "#F4F1EA" }}>
          <svg width={32} height={32} viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="29" stroke="#F4F1EA" strokeWidth="1.25" opacity="0.35" /><circle cx="32" cy="32" r="29" stroke="#F4F1EA" strokeWidth="1.25" strokeDasharray="2 6" opacity="0.5" transform="rotate(-30 32 32)" /><g stroke="#F4F1EA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"><path d="M16 38 C 16 22, 48 22, 48 38" /><path d="M22 38 C 22 48, 32 50, 34 42 C 35 38, 30 36, 30 40" /><path d="M40 40 L 44 46" /><circle cx="40" cy="32" r="1.4" fill="#F4F1EA" stroke="none" /></g><circle cx="58" cy="22" r="1.6" fill="#F4F1EA" /></svg>
          <span style={{ fontFamily: "var(--font-instrument-serif, serif)", fontSize: 20, fontStyle: "italic" }}>Kunjara<span style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 16, fontStyle: "normal", fontWeight: 500, marginLeft: 4 }}>OS</span></span>
        </Link>
        <Link href="/signup" style={{ padding: "9px 20px", borderRadius: 999, background: ACCENT, color: "#0A0A0C", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Get started →</Link>
      </nav>

      {/* Hero */}
      <section style={{ padding: "100px 6vw 80px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, letterSpacing: "0.25em", color: ACCENT, marginBottom: 24 }}>◆ LEGAL · DATA PROTECTION</div>
        <h1 style={{ fontFamily: "var(--font-instrument-serif, serif)", fontSize: "clamp(40px, 5.5vw, 76px)", lineHeight: 1.0, fontWeight: 400, margin: "0 0 28px", letterSpacing: "-0.025em" }}>
          DPDP Act 2023<br />
          <span style={{ fontStyle: "italic", color: ACCENT }}>Compliance Statement.</span>
        </h1>
        <p style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 17, lineHeight: 1.65, color: "rgba(244,241,234,0.6)", maxWidth: 660, margin: "0 0 32px" }}>
          Kunjara OS is built and operated in full compliance with India&apos;s <strong style={{ color: "#F4F1EA", fontWeight: 600 }}>Digital Personal Data Protection Act, 2023</strong> (DPDP Act). This page explains what data we collect, why we collect it, how we store it, and how you can exercise your rights as a Data Principal.
        </p>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "12px 20px", borderRadius: 10, background: "rgba(212,168,95,0.08)", border: "1px solid rgba(212,168,95,0.2)", fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, color: "rgba(212,168,95,0.9)", letterSpacing: "0.05em" }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: ACCENT, display: "block" }} />
          Last updated: 1 January 2026 · Effective: 11 August 2023 (Act commencement)
        </div>
      </section>

      {/* Who we are */}
      <section style={{ padding: "0 6vw 80px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ padding: "40px 44px", borderRadius: 18, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 10, letterSpacing: "0.2em", color: ACCENT, marginBottom: 16 }}>DATA FIDUCIARY</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
            <div>
              <div style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 15, fontWeight: 600, color: "#F4F1EA", marginBottom: 12 }}>Kunjara OS (Indigo Events & Promotions)</div>
              <div style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 13, lineHeight: 1.8, color: "rgba(244,241,234,0.5)" }}>
                Bandra Kurla Complex<br />
                Mumbai 400 051<br />
                Maharashtra, India<br />
                CIN: [Registered Entity]
              </div>
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 15, fontWeight: 600, color: "#F4F1EA", marginBottom: 12 }}>Data Protection Officer</div>
              <div style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 13, lineHeight: 1.8, color: "rgba(244,241,234,0.5)" }}>
                For all DPDP-related requests:<br />
                <a href="mailto:privacy@kunjaraos.com" style={{ color: ACCENT, textDecoration: "none" }}>privacy@kunjaraos.com</a><br />
                Response time: 7 business days
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Data we collect */}
      <section style={{ padding: "0 6vw 80px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, letterSpacing: "0.2em", color: ACCENT, marginBottom: 20 }}>◆ WHAT WE COLLECT</div>
        <h2 style={{ fontFamily: "var(--font-instrument-serif, serif)", fontSize: "clamp(28px, 3.5vw, 48px)", lineHeight: 1.05, fontWeight: 400, margin: "0 0 40px", letterSpacing: "-0.02em" }}>
          Data categories &amp; retention.
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {dataCategories.map((row) => (
            <div key={row.category} style={{ display: "grid", gridTemplateColumns: "180px 1fr 1fr 1fr", gap: 24, padding: "24px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", alignItems: "start" }}>
              <div style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 13, fontWeight: 600, color: "#F4F1EA" }}>{row.category}</div>
              <div style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 12, lineHeight: 1.65, color: "rgba(244,241,234,0.45)" }}>{row.examples}</div>
              <div style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 12, lineHeight: 1.65, color: "rgba(244,241,234,0.55)" }}>{row.purpose}</div>
              <div style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, color: "rgba(212,168,95,0.7)", lineHeight: 1.6 }}>{row.retention}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "180px 1fr 1fr 1fr", gap: 24 }}>
          <div />
          <div style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 10, color: "rgba(244,241,234,0.3)", letterSpacing: "0.08em" }}>EXAMPLES</div>
          <div style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 10, color: "rgba(244,241,234,0.3)", letterSpacing: "0.08em" }}>PURPOSE</div>
          <div style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 10, color: "rgba(244,241,234,0.3)", letterSpacing: "0.08em" }}>RETENTION</div>
        </div>
      </section>

      {/* Your rights */}
      <section style={{ padding: "80px 6vw", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, letterSpacing: "0.2em", color: ACCENT, marginBottom: 20 }}>◆ YOUR RIGHTS AS DATA PRINCIPAL</div>
          <h2 style={{ fontFamily: "var(--font-instrument-serif, serif)", fontSize: "clamp(28px, 3.5vw, 48px)", lineHeight: 1.05, fontWeight: 400, margin: "0 0 48px", letterSpacing: "-0.02em" }}>
            What the DPDP Act guarantees you.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {rights.map((r, i) => (
              <div key={r.title} style={{ padding: "28px 28px", borderRadius: 14, background: "rgba(10,10,12,0.8)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 10, color: "rgba(212,168,95,0.5)", letterSpacing: "0.15em", marginBottom: 14 }}>0{i + 1}</div>
                <div style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 15, fontWeight: 600, color: "#F4F1EA", marginBottom: 12 }}>{r.title}</div>
                <div style={{ width: 24, height: 1, background: "rgba(212,168,95,0.3)", marginBottom: 16 }} />
                <p style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 13, lineHeight: 1.7, color: "rgba(244,241,234,0.5)", margin: 0 }}>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Storage & Security */}
      <section style={{ padding: "80px 6vw 100px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, letterSpacing: "0.2em", color: ACCENT, marginBottom: 20 }}>◆ STORAGE & SECURITY</div>
        <h2 style={{ fontFamily: "var(--font-instrument-serif, serif)", fontSize: "clamp(28px, 3.5vw, 48px)", lineHeight: 1.05, fontWeight: 400, margin: "0 0 40px", letterSpacing: "-0.02em" }}>
          How we protect your data.
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {[
            { title: "Data localisation", body: "All personal data is stored on servers physically located within India. We do not transfer data outside Indian jurisdiction." },
            { title: "Encryption at rest", body: "All databases are encrypted using AES-256. Backups are encrypted and stored in geographically separate Indian data centres." },
            { title: "Encryption in transit", body: "All data transmitted between your browser/device and our servers uses TLS 1.3. We enforce HTTPS across all endpoints." },
            { title: "Access controls", body: "Internal staff access to user data is role-based and logged. No employee can access raw user data without an audit trail." },
            { title: "Third-party processors", body: "We only share data with processors who are contractually bound to DPDP Act compliance and who process data within India." },
            { title: "Breach notification", body: "In the event of a data breach, we will notify affected users and the Data Protection Board within 72 hours, as required by the DPDP Act." },
          ].map((item) => (
            <div key={item.title} style={{ padding: "28px", borderRadius: 14, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 14, fontWeight: 600, color: "#F4F1EA", marginBottom: 10 }}>{item.title}</div>
              <p style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 13, lineHeight: 1.7, color: "rgba(244,241,234,0.5)", margin: 0 }}>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Exercise rights CTA */}
      <section style={{ padding: "80px 6vw 100px", borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, letterSpacing: "0.2em", color: ACCENT, marginBottom: 20 }}>◆ EXERCISE YOUR RIGHTS</div>
        <h2 style={{ fontFamily: "var(--font-instrument-serif, serif)", fontSize: "clamp(28px, 4vw, 52px)", lineHeight: 1.1, fontWeight: 400, margin: "0 0 20px", letterSpacing: "-0.02em" }}>
          Make a data request.
        </h2>
        <p style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 16, lineHeight: 1.65, color: "rgba(244,241,234,0.5)", maxWidth: 520, margin: "0 auto 40px" }}>
          To access, correct, or delete your data — or to exercise any other DPDP Act right — email our Data Protection Officer. We respond within 7 business days.
        </p>
        <a href="mailto:privacy@kunjaraos.com" style={{ padding: "16px 32px", borderRadius: 999, background: ACCENT, color: "#0A0A0C", fontSize: 15, fontWeight: 600, textDecoration: "none", display: "inline-block", marginRight: 14 }}>
          Email privacy@kunjaraos.com →
        </a>
        <Link href="/support" style={{ padding: "16px 24px", borderRadius: 999, border: "1px solid rgba(244,241,234,0.15)", color: "rgba(244,241,234,0.7)", fontSize: 14, textDecoration: "none", display: "inline-block" }}>
          See FAQ
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ padding: "32px 6vw", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, color: "rgba(244,241,234,0.3)", letterSpacing: "0.06em" }}>© 2026 Kunjara OS™ by Indigo Events & Promotions. Mumbai, India · IT Act 2000 · DPDP Act 2023.</span>
        <div style={{ display: "flex", gap: 20 }}>
          {[["Home", "/"], ["Privacy", "/privacy"], ["Terms", "/terms"], ["Support", "/support"]].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: 12, color: "rgba(244,241,234,0.35)", textDecoration: "none" }}>{l}</Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
