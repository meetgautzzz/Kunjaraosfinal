import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Support & FAQ — Kunjara OS™",
  description: "Get help with Kunjara OS. Find answers to common questions about proposals, Event Rooms, billing, and more.",
};

const ACCENT = "#D4A85F";

const sections = [
  {
    category: "Getting Started",
    icon: "◎",
    faqs: [
      { q: "How do I create my first proposal?", a: "After signing up, click 'New Proposal' from your dashboard. Proposal Architect™ will ask 5–7 questions about your event — client name, date, guest count, venue type, and budget range. From there, it generates a complete draft in under 3 minutes." },
      { q: "What is an Event Room™?", a: "An Event Room is a shared, real-time workspace for a single event. You can invite your client, co-planners, and vendors to a single link. Everyone sees the latest proposal, can leave comments, approve line items, and track changes — no email chains." },
      { q: "Do I need a credit card to sign up?", a: "No. The free plan is genuinely free — no credit card required. You can generate proposals, share Event Rooms, and export PDFs on the free tier with no time limit." },
      { q: "Can I import my existing client data?", a: "Yes. Go to Settings → Import and upload a CSV file with client names, event types, and budget ranges. Our team can also do a full data migration for Pro accounts — email support@kunjaraos.com to schedule it." },
    ],
  },
  {
    category: "Proposals & Event Rooms",
    icon: "◈",
    faqs: [
      { q: "Are the budgets in proposals GST-inclusive?", a: "Yes, by default. Every line item shows the base amount, GST rate (typically 18% for events, 5% for food & beverage), and the GST-inclusive total. You can toggle to display ex-GST if your client prefers." },
      { q: "Can I use my own logo and branding?", a: "Yes. Upload your logo and set your brand colours in Settings → Branding. Every PDF and client-facing Event Room will use your identity, not ours." },
      { q: "How many proposals can I share simultaneously?", a: "Free plan: up to 3 active Event Rooms at a time. Pro plan: unlimited. Past rooms are always accessible in your archive even on the free tier." },
      { q: "Can clients sign off on a proposal inside an Event Room?", a: "Yes. Clients can approve individual sections, add a digital signature, and mark the proposal as accepted. You'll receive an instant notification and email confirmation when they do." },
    ],
  },
  {
    category: "Billing & Plans",
    icon: "◇",
    faqs: [
      { q: "What's included in the free plan?", a: "Free plan includes: 3 active Event Rooms, unlimited proposal drafts, PDF export, client sharing links, GST-correct budgets, and basic mood board generation." },
      { q: "What does Pro add?", a: "Pro unlocks: unlimited Event Rooms, white-label branding, AI mood boards with DALL-E visuals, floor plan AI suggestions, vendor rate database, run-of-show builder, and priority email support." },
      { q: "How does billing work?", a: "Pro is billed monthly or annually. Annual billing saves ~20%. We accept all major credit/debit cards and UPI. Invoices are GST-compliant and can be sent directly to your accountant." },
      { q: "Can I get a refund?", a: "Yes. If you're on a monthly plan, you can cancel anytime and receive a prorated refund for unused days. Annual plans have a 14-day full refund window from the billing date." },
    ],
  },
  {
    category: "Data & Privacy",
    icon: "◉",
    faqs: [
      { q: "Where is my data stored?", a: "All data is stored on servers within India, compliant with the Digital Personal Data Protection (DPDP) Act 2023. We do not transfer your data outside India." },
      { q: "Who can see my proposals and client data?", a: "Only you and the people you explicitly invite to an Event Room can see your data. Kunjara OS staff access data only for support purposes, with your permission, and this access is logged." },
      { q: "How do I delete my account and data?", a: "Go to Settings → Account → Delete Account. This permanently removes your account and all associated proposals within 30 days, per DPDP Act requirements. You can also request deletion by emailing privacy@kunjaraos.com." },
      { q: "Is Kunjara OS DPDP Act 2023 compliant?", a: "Yes. We are fully compliant with the Digital Personal Data Protection Act 2023. See our full compliance statement on the DPDP Compliance page." },
    ],
  },
];

export default function SupportPage() {
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
      <section style={{ padding: "100px 6vw 80px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, letterSpacing: "0.25em", color: ACCENT, marginBottom: 24 }}>◆ SUPPORT & FAQ</div>
        <h1 style={{ fontFamily: "var(--font-instrument-serif, serif)", fontSize: "clamp(44px, 6vw, 80px)", lineHeight: 1.0, fontWeight: 400, margin: "0 0 28px", letterSpacing: "-0.025em" }}>
          How can we<br />
          <span style={{ fontStyle: "italic", color: ACCENT }}>help you?</span>
        </h1>
        <p style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 18, lineHeight: 1.6, color: "rgba(244,241,234,0.6)", maxWidth: 560, margin: 0 }}>
          Answers to the most common questions about Kunjara OS. Can&apos;t find what you need? Email{" "}
          <a href="mailto:support@kunjaraos.com" style={{ color: ACCENT, textDecoration: "none" }}>support@kunjaraos.com</a>.
        </p>
      </section>

      {/* Quick contact strip */}
      <section style={{ padding: "0 6vw 80px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {[
            { label: "Email Support", value: "support@kunjaraos.com", href: "mailto:support@kunjaraos.com", note: "< 4 hour response" },
            { label: "General Inquiries", value: "hello@kunjaraos.com", href: "mailto:hello@kunjaraos.com", note: "Partnerships & press" },
            { label: "Data & Privacy", value: "privacy@kunjaraos.com", href: "mailto:privacy@kunjaraos.com", note: "DPDP requests" },
          ].map((c) => (
            <a key={c.label} href={c.href} style={{ padding: "20px 24px", borderRadius: 14, background: "rgba(212,168,95,0.05)", border: "1px solid rgba(212,168,95,0.15)", textDecoration: "none", color: "inherit" }}>
              <div style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 10, letterSpacing: "0.15em", color: "rgba(212,168,95,0.7)", marginBottom: 10 }}>{c.label.toUpperCase()}</div>
              <div style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 13, color: ACCENT, marginBottom: 6 }}>{c.value}</div>
              <div style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 12, color: "rgba(244,241,234,0.4)" }}>{c.note}</div>
            </a>
          ))}
        </div>
      </section>

      {/* FAQ sections */}
      <section style={{ padding: "0 6vw 120px", maxWidth: 1000, margin: "0 auto" }}>
        {sections.map((section, si) => (
          <div key={section.category} style={{ marginBottom: si < sections.length - 1 ? 80 : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 36, paddingBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <span style={{ fontSize: 20, color: "rgba(212,168,95,0.6)" }} aria-hidden>{section.icon}</span>
              <h2 style={{ fontFamily: "var(--font-instrument-serif, serif)", fontSize: "clamp(22px, 3vw, 32px)", fontStyle: "italic", fontWeight: 400, margin: 0, color: "#F4F1EA" }}>{section.category}</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {section.faqs.map((faq) => (
                <div key={faq.q} style={{ padding: "24px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <h3 style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 15, fontWeight: 600, color: "#F4F1EA", margin: "0 0 12px", lineHeight: 1.4 }}>{faq.q}</h3>
                  <p style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 14, lineHeight: 1.75, color: "rgba(244,241,234,0.55)", margin: 0 }}>{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Still stuck */}
      <section style={{ padding: "80px 6vw 100px", borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "center", background: "rgba(212,168,95,0.02)" }}>
        <div style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, letterSpacing: "0.2em", color: ACCENT, marginBottom: 20 }}>◆ STILL STUCK?</div>
        <h2 style={{ fontFamily: "var(--font-instrument-serif, serif)", fontSize: "clamp(28px, 4vw, 48px)", lineHeight: 1.1, fontWeight: 400, margin: "0 0 20px", letterSpacing: "-0.02em" }}>
          We&apos;ll sort it out.<br /><em style={{ color: ACCENT }}>Personally.</em>
        </h2>
        <p style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 16, lineHeight: 1.65, color: "rgba(244,241,234,0.5)", maxWidth: 480, margin: "0 auto 40px" }}>
          Every support request is handled by a human who understands events — not a bot running down a script.
        </p>
        <a href="mailto:support@kunjaraos.com" style={{ padding: "16px 32px", borderRadius: 999, background: ACCENT, color: "#0A0A0C", fontSize: 15, fontWeight: 600, textDecoration: "none", display: "inline-block" }}>
          Email support →
        </a>
      </section>

      {/* Footer */}
      <footer style={{ padding: "32px 6vw", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, color: "rgba(244,241,234,0.3)", letterSpacing: "0.06em" }}>© 2026 Kunjara OS™ by Indigo Events & Promotions.</span>
        <div style={{ display: "flex", gap: 20 }}>
          {[["Home", "/"], ["About", "/about"], ["Contact", "/contact"], ["Privacy", "/privacy"]].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: 12, color: "rgba(244,241,234,0.35)", textDecoration: "none" }}>{l}</Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
