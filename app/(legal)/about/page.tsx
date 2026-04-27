import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us · Kunjara OS",
  description: "Learn about Kunjara OS — the AI-powered event proposal platform built for Indian event planners.",
};

export default function AboutPage() {
  return (
    <article style={prose}>
      <p style={eyebrow}>About</p>
      <h1 style={h1}>Built for event planners who move fast.</h1>
      <p style={lead}>
        Kunjara OS is an AI-powered event management platform that helps event planners, agencies,
        and businesses create structured, professional proposals in minutes — not days.
      </p>

      <h2 style={h2}>What we do</h2>
      <p style={p}>
        Planning an event involves dozens of moving parts: concept, budget, timeline, vendors,
        compliance, and client communication. Traditionally, planners spend hours building proposals
        from scratch in Word documents or spreadsheets — work that is repetitive, error-prone,
        and hard to scale.
      </p>
      <p style={p}>
        Kunjara OS changes that. Enter your event brief, and our AI generates a complete proposal
        — concept, budget breakdown, timeline, vendor list, risk assessment, and client-ready
        presentation — in under two minutes. Every proposal is editable, shareable, and
        professionally formatted.
      </p>

      <h2 style={h2}>Who it's for</h2>
      <ul style={ul}>
        <li style={li}><strong>Independent event planners</strong> who need to pitch clients quickly and professionally.</li>
        <li style={li}><strong>Event management agencies</strong> looking to standardise their proposal process across teams.</li>
        <li style={li}><strong>Corporate event teams</strong> planning internal events, conferences, and brand activations.</li>
        <li style={li}><strong>Wedding and social event planners</strong> managing high-value, detail-intensive projects.</li>
      </ul>

      <h2 style={h2}>Our mission</h2>
      <p style={p}>
        We believe great event planning should be accessible to every planner — not just those
        with large teams or expensive software. Our mission is to give every event professional
        the tools to plan smarter, present better, and grow faster.
      </p>

      <h2 style={h2}>Built in India, for India</h2>
      <p style={p}>
        Kunjara OS is designed with the Indian events industry in mind — covering INR-denominated
        budgets, local compliance requirements, regional vendor categories, and the scale of
        India's ₹1.5 lakh crore events market. We are growing toward international markets,
        but India is our home.
      </p>

      <h2 style={h2}>Contact us</h2>
      <p style={p}>
        Have questions or want to partner with us?{" "}
        <a href="mailto:support@kunjaraos.com" style={link}>support@kunjaraos.com</a>
      </p>
    </article>
  );
}

const prose: React.CSSProperties = { maxWidth: 680 };
const eyebrow: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 12 };
const h1: React.CSSProperties = { fontSize: 32, fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.15, color: "var(--text-1)", marginBottom: 20, marginTop: 0 };
const lead: React.CSSProperties = { fontSize: 17, lineHeight: 1.65, color: "var(--text-2)", marginBottom: 36, borderLeft: "3px solid var(--accent)", paddingLeft: 16 };
const h2: React.CSSProperties = { fontSize: 18, fontWeight: 700, color: "var(--text-1)", marginTop: 36, marginBottom: 10 };
const p: React.CSSProperties = { fontSize: 15, lineHeight: 1.7, color: "var(--text-2)", marginBottom: 14 };
const ul: React.CSSProperties = { paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 };
const li: React.CSSProperties = { fontSize: 15, lineHeight: 1.6, color: "var(--text-2)", paddingLeft: 16, borderLeft: "2px solid var(--border-mid)" };
const link: React.CSSProperties = { color: "var(--accent)", textDecoration: "none" };
