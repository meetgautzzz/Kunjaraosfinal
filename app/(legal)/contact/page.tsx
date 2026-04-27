import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact · Kunjara OS",
  description: "Get in touch with the Kunjara OS team for support, sales, or partnerships.",
};

export default function ContactPage() {
  return (
    <article style={prose}>
      <p style={eyebrow}>Contact</p>
      <h1 style={h1}>We'd love to hear from you.</h1>
      <p style={lead}>
        Whether you have a question about your account, want to explore a partnership,
        or just want to say hello — we're here.
      </p>

      <div style={cardGrid}>
        <ContactCard
          icon="✉️"
          title="General & Support"
          body="For account help, billing questions, and technical issues."
          cta="support@kunjaraos.com"
          href="mailto:support@kunjaraos.com"
        />
        <ContactCard
          icon="🤝"
          title="Partnerships"
          body="Interested in integrating with Kunjara OS or exploring a business collaboration."
          cta="support@kunjaraos.com"
          href="mailto:support@kunjaraos.com?subject=Partnership Inquiry"
        />
        <ContactCard
          icon="💬"
          title="Sales"
          body="Want to discuss a plan for your team or agency? Let's talk."
          cta="support@kunjaraos.com"
          href="mailto:support@kunjaraos.com?subject=Sales Inquiry"
        />
      </div>

      <h2 style={h2}>Response times</h2>
      <p style={p}>
        We aim to respond to all emails within <strong style={{ color: "var(--text-1)" }}>24–48 hours</strong> on
        business days (Monday–Saturday, IST). For urgent account issues, include "Urgent" in
        your subject line and we will prioritise your request.
      </p>

      <h2 style={h2}>Before you write</h2>
      <p style={p}>
        Many common questions are answered in our{" "}
        <a href="/support" style={link}>Support page</a>. If your question is about a specific
        proposal, credit transaction, or payment, please include your registered email address
        so we can locate your account quickly.
      </p>
    </article>
  );
}

function ContactCard({ icon, title, body, cta, href }: {
  icon: string; title: string; body: string; cta: string; href: string;
}) {
  return (
    <a href={href} style={card}>
      <span style={{ fontSize: 24 }}>{icon}</span>
      <strong style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{title}</strong>
      <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.55, margin: 0 }}>{body}</p>
      <span style={{ fontSize: 12, color: "var(--accent)", marginTop: "auto" }}>{cta}</span>
    </a>
  );
}

const prose: React.CSSProperties = { maxWidth: 680 };
const eyebrow: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 12 };
const h1: React.CSSProperties = { fontSize: 32, fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.15, color: "var(--text-1)", marginBottom: 20, marginTop: 0 };
const lead: React.CSSProperties = { fontSize: 17, lineHeight: 1.65, color: "var(--text-2)", marginBottom: 36, borderLeft: "3px solid var(--accent)", paddingLeft: 16 };
const h2: React.CSSProperties = { fontSize: 18, fontWeight: 700, color: "var(--text-1)", marginTop: 36, marginBottom: 10 };
const p: React.CSSProperties = { fontSize: 15, lineHeight: 1.7, color: "var(--text-2)", marginBottom: 14 };
const link: React.CSSProperties = { color: "var(--accent)", textDecoration: "none" };
const cardGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 36 };
const card: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: 8, padding: "20px 18px",
  borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg-card)",
  textDecoration: "none", transition: "border-color 0.15s",
};
