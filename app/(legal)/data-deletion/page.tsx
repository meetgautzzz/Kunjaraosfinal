import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Deletion Policy · Kunjara OS",
  description: "How to request deletion of your Kunjara OS account and personal data.",
};

const EFFECTIVE = "27 April 2026";

export default function DataDeletionPage() {
  return (
    <article style={prose}>
      <p style={eyebrow}>Data Deletion</p>
      <h1 style={h1}>You own your data. You can delete it.</h1>
      <p style={meta}>Effective date: {EFFECTIVE}</p>
      <p style={lead}>
        We believe you should have full control over your personal data. This page
        explains how to request deletion of your account and data, what gets deleted,
        and what we must legally retain.
      </p>

      <Section title="How to request deletion">
        <P>Send an email to <A href="mailto:support@kunjaraos.com">support@kunjaraos.com</A> with:</P>
        <Bullets items={[
          "Subject line: \"Account Deletion Request\"",
          "Your registered email address",
          "A brief confirmation that you want your account and data permanently deleted",
        ]} />
        <P>
          We will confirm receipt within 48 hours and complete the deletion within
          30 days of your request. You will receive a final confirmation email when
          the deletion is complete.
        </P>
      </Section>

      <Section title="What gets deleted">
        <Dl items={[
          ["Account", "Your email address, name, and authentication data."],
          ["Profile & branding", "Company name, phone number, address, and uploaded logo."],
          ["Proposals", "All proposals you have created, including all versions and client responses."],
          ["AI credit balance", "Your remaining credits are forfeited upon deletion."],
          ["Usage logs", "AI usage logs and credit transaction history associated with your account."],
        ]} />
      </Section>

      <Section title="What we must legally retain">
        <P>
          Some data cannot be immediately deleted due to legal obligations:
        </P>
        <Dl items={[
          ["Payment records", "Transaction records (amount, date, Razorpay payment ID) are retained for 7 years as required by Indian tax law (Income Tax Act, 1961). No card or UPI credentials are stored by us."],
          ["Fraud prevention", "In cases of suspected fraud or abuse, we may retain limited records as required by law enforcement or applicable regulations."],
        ]} />
        <P>
          This retained data is isolated and not used for any purpose other than legal compliance.
        </P>
      </Section>

      <Section title="What happens to shared proposals">
        <P>
          If you have shared a proposal with a client via a public link (<code style={code}>/p/[id]</code>),
          that link will stop working once your account is deleted. Client data entered
          through that link (e.g., approval responses) is deleted along with the proposal.
        </P>
      </Section>

      <Section title="Active subscriptions">
        <P>
          If you have an active subscription, cancelling your account will not automatically
          cancel it. Please contact us to cancel your subscription before requesting
          account deletion to avoid further charges.
        </P>
      </Section>

      <Section title="Reactivation">
        <P>
          Deletion is permanent and cannot be undone. Once your account is deleted,
          your proposals, credits, and settings cannot be recovered. If you would like
          to use Kunjara OS again, you will need to register a new account.
        </P>
      </Section>

      <Section title="In-app deletion (coming soon)">
        <P>
          We are building an in-app account deletion feature so you can delete your account
          directly from Settings without emailing us. Until then, email is the only method.
        </P>
      </Section>

      <Section title="Contact">
        <P>
          For all deletion requests and questions:{" "}
          <A href="mailto:support@kunjaraos.com">support@kunjaraos.com</A>
        </P>
        <div style={timelineBox}>
          <Step n="1" label="You email us" desc="Send a deletion request to support@kunjaraos.com" />
          <Step n="2" label="We confirm" desc="We acknowledge within 48 hours" />
          <Step n="3" label="Data deleted" desc="All eligible data removed within 30 days" />
          <Step n="4" label="Confirmation" desc="You receive a final confirmation email" />
        </div>
      </Section>
    </article>
  );
}

function Step({ n, label, desc }: { n: string; label: string; desc: string }) {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        background: "var(--accent-dim)", border: "1px solid var(--accent)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 700, color: "var(--accent)", flexShrink: 0,
      }}>{n}</div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", margin: "4px 0 2px" }}>{label}</p>
        <p style={{ fontSize: 13, color: "var(--text-2)", margin: 0 }}>{desc}</p>
      </div>
    </div>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section style={{ marginTop: 32 }}><h2 style={h2}>{title}</h2>{children}</section>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p style={p}>{children}</p>;
}
function A({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} style={link}>{children}</a>;
}
function Bullets({ items }: { items: string[] }) {
  return (
    <ul style={{ paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8, margin: "10px 0 14px" }}>
      {items.map((item) => (
        <li key={item} style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-2)", paddingLeft: 16, borderLeft: "2px solid var(--border-mid)" }}>
          {item}
        </li>
      ))}
    </ul>
  );
}
function Dl({ items }: { items: [string, string][] }) {
  return (
    <dl style={{ margin: "10px 0 14px", display: "flex", flexDirection: "column", gap: 12 }}>
      {items.map(([term, def]) => (
        <div key={term} style={{ paddingLeft: 16, borderLeft: "2px solid var(--border-mid)" }}>
          <dt style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", marginBottom: 3 }}>{term}</dt>
          <dd style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-2)", margin: 0 }}>{def}</dd>
        </div>
      ))}
    </dl>
  );
}

const prose: React.CSSProperties = { maxWidth: 680 };
const eyebrow: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 12 };
const h1: React.CSSProperties = { fontSize: 32, fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.15, color: "var(--text-1)", marginBottom: 8, marginTop: 0 };
const meta: React.CSSProperties = { fontSize: 12, color: "var(--text-3)", marginBottom: 24 };
const lead: React.CSSProperties = { fontSize: 16, lineHeight: 1.65, color: "var(--text-2)", marginBottom: 8, borderLeft: "3px solid var(--accent)", paddingLeft: 16 };
const h2: React.CSSProperties = { fontSize: 16, fontWeight: 700, color: "var(--text-1)", marginTop: 0, marginBottom: 10 };
const p: React.CSSProperties = { fontSize: 14, lineHeight: 1.7, color: "var(--text-2)", marginBottom: 10 };
const link: React.CSSProperties = { color: "var(--accent)", textDecoration: "none" };
const code: React.CSSProperties = { fontFamily: "monospace", fontSize: 13, background: "var(--bg-hover)", padding: "1px 5px", borderRadius: 4 };
const timelineBox: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 16, padding: "20px 18px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg-card)", marginTop: 14 };
