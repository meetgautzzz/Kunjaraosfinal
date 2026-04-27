import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DPDP Compliance · Kunjara OS",
  description: "How Kunjara OS complies with India's Digital Personal Data Protection Act 2023.",
};

const EFFECTIVE = "27 April 2026";

export default function DpdpPage() {
  return (
    <article style={prose}>
      <p style={eyebrow}>DPDP Compliance</p>
      <h1 style={h1}>Digital Personal Data Protection Act, 2023</h1>
      <p style={meta}>Effective date: {EFFECTIVE}</p>
      <p style={lead}>
        Kunjara OS is committed to complying with India's Digital Personal Data Protection
        (DPDP) Act, 2023. This page explains your rights under the Act and how we honour them.
      </p>

      <Section title="About the DPDP Act">
        <P>
          The Digital Personal Data Protection Act, 2023 ("DPDP Act") is India's primary
          legislation governing how businesses collect, process, and store personal data of
          Indian residents. As a Data Fiduciary under the Act, Kunjara OS is responsible for
          ensuring your personal data is processed lawfully, fairly, and transparently.
        </P>
      </Section>

      <Section title="Lawful basis for processing">
        <P>We process your personal data on the following bases:</P>
        <Dl items={[
          ["Consent", "When you register an account, you consent to us collecting and processing your data as described in our Privacy Policy. You may withdraw consent at any time by deleting your account."],
          ["Contractual necessity", "Processing required to deliver the Service you subscribed to — for example, storing your proposals and processing your payments."],
          ["Legal obligation", "We retain payment and transaction records for 7 years as required under Indian taxation laws."],
          ["Legitimate interests", "Anonymised usage analytics to improve the product, subject to your interests not overriding ours."],
        ]} />
      </Section>

      <Section title="Your rights under the DPDP Act">
        <P>As a Data Principal (the person whose data we process), you have the following rights:</P>
        <Dl items={[
          ["Right to access", "Request a summary of the personal data we hold about you and how it is being processed."],
          ["Right to correction", "Request that we correct inaccurate or incomplete personal data."],
          ["Right to erasure", "Request deletion of your personal data, subject to legal retention requirements."],
          ["Right to grievance redressal", "Raise a complaint about our data practices and receive a timely response."],
          ["Right to nominate", "Nominate another person to exercise your rights on your behalf in the event of your incapacity."],
        ]} />
        <P>
          To exercise any of these rights, contact our Data Protection Officer at{" "}
          <A href="mailto:support@kunjaraos.com">support@kunjaraos.com</A>. We will respond
          within 30 days as required by the Act.
        </P>
      </Section>

      <Section title="Data minimisation">
        <P>
          We collect only the personal data that is necessary to provide the Service.
          We do not collect sensitive personal data (as defined under the DPDP Act)
          such as financial account numbers, biometric data, health data, or caste information.
          Payment details are processed by Razorpay and are not stored on our servers.
        </P>
      </Section>

      <Section title="Cross-border data transfers">
        <P>
          Some of our service providers — including OpenAI (AI processing) and Vercel
          (hosting) — operate outside India. Where personal data is transferred
          internationally, we ensure appropriate safeguards are in place consistent with
          the DPDP Act and any rules notified by the Indian Government.
        </P>
        <P>
          Your primary data (account, proposals) is stored on Supabase infrastructure
          in the ap-south-1 region (Mumbai, India).
        </P>
      </Section>

      <Section title="Data retention">
        <P>
          We retain personal data only for as long as necessary:
        </P>
        <Dl items={[
          ["Account & proposal data", "Retained while your account is active. Deleted within 30 days of an account deletion request."],
          ["Payment records", "Retained for 7 years as required under the Income Tax Act, 1961."],
          ["Usage logs", "Retained for 90 days for security and performance monitoring, then automatically deleted."],
        ]} />
      </Section>

      <Section title="Grievance redressal">
        <P>
          If you have a complaint regarding how we handle your personal data, you may
          contact our Data Protection Officer:
        </P>
        <div style={contactBox}>
          <strong style={{ fontSize: 13, color: "var(--text-1)", display: "block", marginBottom: 4 }}>Data Protection Officer</strong>
          <p style={{ fontSize: 13, color: "var(--text-2)", margin: 0 }}>Kunjara OS</p>
          <a href="mailto:support@kunjaraos.com" style={link}>support@kunjaraos.com</a>
        </div>
        <P>
          We will acknowledge your complaint within 48 hours and resolve it within 30 days.
          If you are not satisfied with our response, you may approach the Data Protection
          Board of India once it is constituted by the Government of India.
        </P>
      </Section>

      <Section title="Updates to this notice">
        <P>
          We will update this page as the DPDP Act's rules and regulations are notified.
          Material changes will be communicated to registered users by email.
        </P>
      </Section>
    </article>
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
const contactBox: React.CSSProperties = { padding: "16px 18px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg-card)", margin: "10px 0 14px", display: "flex", flexDirection: "column", gap: 4 };
