import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support · Kunjara OS",
  description: "Get help with Kunjara OS — FAQs, troubleshooting, and how to reach us.",
};

export default function SupportPage() {
  return (
    <article style={prose}>
      <p style={eyebrow}>Support</p>
      <h1 style={h1}>How can we help?</h1>
      <p style={lead}>
        We're committed to making sure Kunjara OS works smoothly for you. Here's how to
        get answers fast.
      </p>

      <h2 style={h2}>Contact support</h2>
      <p style={p}>
        Email us at{" "}
        <a href="mailto:support@kunjaraos.com" style={link}>support@kunjaraos.com</a>
        {" "}and we'll respond within <strong style={{ color: "var(--text-1)" }}>24–48 hours</strong> on
        business days. Please include your registered email address and a brief description
        of the issue so we can help you quickly.
      </p>

      <h2 style={h2}>Common issues</h2>

      <div style={faqList}>
        <Faq q="I can't log in to my account.">
          Try resetting your password using the "Forgot password" link on the login page.
          If you signed up with Google, make sure you're using the same Google account.
          If the problem persists, email us with your registered email address.
        </Faq>
        <Faq q="My proposal didn't generate — what happened?">
          Proposal generation requires AI credits. Check your credit balance in the top bar.
          If you have credits remaining, try again. If the issue continues, email us with
          the proposal ID visible in the URL.
        </Faq>
        <Faq q="I was charged but my credits didn't appear.">
          Credits are applied automatically within a few seconds of a successful payment.
          If it's been more than 5 minutes, email us with your payment reference (UTR or
          Razorpay payment ID) and we'll apply them manually.
        </Faq>
        <Faq q="How do I share a proposal with my client?">
          Open the proposal, click "Share" in the toolbar, and copy the link. Your client
          can view the full proposal and approve or request changes — no login required.
        </Faq>
        <Faq q="Can I export my proposal as a PDF?">
          Yes. Open the proposal, click "Export" in the toolbar, and select "Export as PDF."
          Your browser's print dialog will open — choose "Save as PDF" as the destination.
        </Faq>
        <Faq q="How do I cancel my subscription?">
          Email us at{" "}
          <a href="mailto:support@kunjaraos.com" style={link}>support@kunjaraos.com</a>
          {" "}with your account email and we'll cancel it immediately. You'll retain access
          until the end of the current billing period.
        </Faq>
        <Faq q="How do I delete my account and data?">
          See our{" "}
          <a href="/data-deletion" style={link}>Data Deletion Policy</a>{" "}
          for the full process. In short, email us and we'll delete your account within 30 days.
        </Faq>
      </div>

      <h2 style={h2}>Still need help?</h2>
      <p style={p}>
        If your question isn't covered above, email us at{" "}
        <a href="mailto:support@kunjaraos.com" style={link}>support@kunjaraos.com</a>.
        We read every message and respond personally — no bots.
      </p>
    </article>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div style={faqItem}>
      <p style={faqQ}>{q}</p>
      <p style={faqA}>{children}</p>
    </div>
  );
}

const prose: React.CSSProperties = { maxWidth: 680 };
const eyebrow: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 12 };
const h1: React.CSSProperties = { fontSize: 32, fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.15, color: "var(--text-1)", marginBottom: 20, marginTop: 0 };
const lead: React.CSSProperties = { fontSize: 17, lineHeight: 1.65, color: "var(--text-2)", marginBottom: 36, borderLeft: "3px solid var(--accent)", paddingLeft: 16 };
const h2: React.CSSProperties = { fontSize: 18, fontWeight: 700, color: "var(--text-1)", marginTop: 36, marginBottom: 10 };
const p: React.CSSProperties = { fontSize: 15, lineHeight: 1.7, color: "var(--text-2)", marginBottom: 14 };
const link: React.CSSProperties = { color: "var(--accent)", textDecoration: "none" };
const faqList: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 2, marginBottom: 14 };
const faqItem: React.CSSProperties = { padding: "16px 18px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg-card)", marginBottom: 8 };
const faqQ: React.CSSProperties = { fontSize: 14, fontWeight: 700, color: "var(--text-1)", marginBottom: 8, marginTop: 0 };
const faqA: React.CSSProperties = { fontSize: 14, lineHeight: 1.65, color: "var(--text-2)", margin: 0 };
