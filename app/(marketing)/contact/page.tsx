import type { Metadata } from "next";
import Link from "next/link";

// CSS hover for channel cards (server component — no JS handlers allowed)
const hoverStyles = `
  .contact-channel { transition: border-color 300ms, background 300ms; }
  .contact-channel:hover { border-color: rgba(212,168,95,0.35) !important; background: rgba(212,168,95,0.04) !important; }
`;

export const metadata: Metadata = {
  title: "Contact — Kunjara OS™",
  description: "Get in touch with the Kunjara OS team. We're based in Mumbai and built for Indian event professionals.",
};

const ACCENT = "#D4A85F";

const channels = [
  {
    icon: "✉",
    title: "Email",
    desc: "For general inquiries, partnerships, and press.",
    action: "hello@kunjaraos.com",
    href: "mailto:hello@kunjaraos.com",
    cta: "Send an email",
  },
  {
    icon: "🛠",
    title: "Support",
    desc: "Technical issues, billing, or account help.",
    action: "support@kunjaraos.com",
    href: "mailto:support@kunjaraos.com",
    cta: "Get help",
  },
  {
    icon: "◎",
    title: "Partnerships",
    desc: "Vendor integrations, venue tie-ups, agency referrals.",
    action: "partners@kunjaraos.com",
    href: "mailto:partners@kunjaraos.com",
    cta: "Partner with us",
  },
];

const faqs = [
  { q: "Do you offer onboarding for new planners?", a: "Yes. Every new account gets a 30-minute walkthrough call with a member of our team. Book it from inside the dashboard after signing up." },
  { q: "Is Kunjara OS available outside India?", a: "Currently focused on the Indian market — GST logic, regional pricing, and vendor databases are all India-specific. International expansion is planned for 2026." },
  { q: "Can I migrate my existing proposals?", a: "Yes. We accept CSV, PDF, and Word imports. Our team will help you map your existing format to the Kunjara template during onboarding." },
  { q: "Do you have a WhatsApp or phone support line?", a: "Not yet. All support is currently handled via email with a target response time under 4 business hours." },
];

export default function ContactPage() {
  return (
    <div style={{ background: "#0A0A0C", color: "#F4F1EA", minHeight: "100vh" }}>
      <style dangerouslySetInnerHTML={{ __html: hoverStyles }} />

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
        <div style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, letterSpacing: "0.25em", color: ACCENT, marginBottom: 24 }}>◆ CONTACT US</div>
        <h1 style={{ fontFamily: "var(--font-instrument-serif, serif)", fontSize: "clamp(44px, 6vw, 80px)", lineHeight: 1.0, fontWeight: 400, margin: "0 0 28px", letterSpacing: "-0.025em" }}>
          Let&apos;s talk events.<br />
          <span style={{ fontStyle: "italic", color: ACCENT }}>We&apos;re listening.</span>
        </h1>
        <p style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 18, lineHeight: 1.6, color: "rgba(244,241,234,0.6)", maxWidth: 560, margin: 0 }}>
          Based in Mumbai. Building for Indian event professionals. We respond to every message — usually within 4 business hours.
        </p>
      </section>

      {/* Contact channels */}
      <section style={{ padding: "0 6vw 100px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {channels.map((c) => (
            <a
              key={c.title}
              href={c.href}
              className="contact-channel"
              style={{ display: "flex", flexDirection: "column", gap: 16, padding: "36px 32px", borderRadius: 18, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", textDecoration: "none", color: "inherit" }}
            >
              <span style={{ fontSize: 28 }} aria-hidden>{c.icon}</span>
              <div>
                <div style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 17, fontWeight: 600, color: "#F4F1EA", marginBottom: 8 }}>{c.title}</div>
                <div style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 14, lineHeight: 1.65, color: "rgba(244,241,234,0.5)" }}>{c.desc}</div>
              </div>
              <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, color: ACCENT, letterSpacing: "0.02em" }}>{c.action}</div>
                <div style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 13, color: "rgba(244,241,234,0.45)", marginTop: 6 }}>{c.cta} →</div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Office */}
      <section style={{ padding: "80px 6vw", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, letterSpacing: "0.2em", color: ACCENT, marginBottom: 20 }}>◆ OFFICE</div>
            <h2 style={{ fontFamily: "var(--font-instrument-serif, serif)", fontSize: "clamp(28px, 3vw, 44px)", lineHeight: 1.1, fontWeight: 400, margin: "0 0 24px", letterSpacing: "-0.02em" }}>
              Mumbai,<br /><em style={{ color: ACCENT }}>Maharashtra.</em>
            </h2>
            <div style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 15, lineHeight: 1.8, color: "rgba(244,241,234,0.55)" }}>
              Indigo Events & Promotions<br />
              Bandra Kurla Complex<br />
              Mumbai 400 051<br />
              Maharashtra, India
            </div>
          </div>
          <div style={{ padding: "40px", borderRadius: 16, background: "rgba(212,168,95,0.05)", border: "1px solid rgba(212,168,95,0.15)" }}>
            <div style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, letterSpacing: "0.15em", color: "rgba(212,168,95,0.7)", marginBottom: 20 }}>BUSINESS HOURS</div>
            {[
              ["Monday – Friday", "10:00 AM – 7:00 PM IST"],
              ["Saturday", "11:00 AM – 4:00 PM IST"],
              ["Sunday / Public Holidays", "Closed"],
            ].map(([day, time]) => (
              <div key={day} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", gap: 20 }}>
                <span style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 13, color: "rgba(244,241,234,0.6)" }}>{day}</span>
                <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, color: "#F4F1EA" }}>{time}</span>
              </div>
            ))}
            <div style={{ marginTop: 24, fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, color: "rgba(244,241,234,0.35)", letterSpacing: "0.05em" }}>
              Email response target: &lt;4 business hours
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "100px 6vw 120px", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, letterSpacing: "0.2em", color: ACCENT, marginBottom: 20 }}>◆ QUICK ANSWERS</div>
        <h2 style={{ fontFamily: "var(--font-instrument-serif, serif)", fontSize: "clamp(28px, 4vw, 52px)", lineHeight: 1.05, fontWeight: 400, margin: "0 0 52px", letterSpacing: "-0.02em" }}>
          Common questions.
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {faqs.map((faq) => (
            <div key={faq.q} style={{ padding: "28px 0", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 16, fontWeight: 600, color: "#F4F1EA", marginBottom: 12 }}>{faq.q}</div>
              <div style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 14, lineHeight: 1.7, color: "rgba(244,241,234,0.55)" }}>{faq.a}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 48, fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 14, color: "rgba(244,241,234,0.4)" }}>
          More questions? See our <Link href="/support" style={{ color: ACCENT, textDecoration: "none" }}>Support & FAQ page</Link>.
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "32px 6vw", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, color: "rgba(244,241,234,0.3)", letterSpacing: "0.06em" }}>© 2026 Kunjara OS™ by Indigo Events & Promotions.</span>
        <div style={{ display: "flex", gap: 20 }}>
          {[["Home", "/"], ["About", "/about"], ["Support", "/support"], ["Privacy", "/privacy"]].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: 12, color: "rgba(244,241,234,0.35)", textDecoration: "none" }}>{l}</Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
