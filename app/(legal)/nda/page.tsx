import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NDA & IP Agreement · Kunjara OS",
  description: "Non-disclosure and intellectual property agreement for Kunjara Technologies employees, contractors, and freelancers.",
};

const EFFECTIVE = "6 May 2026";
const COMPANY   = "Kunjara Technologies";
const LEGAL     = "legal@kunjaraos.com";

export default function NdaPage() {
  return (
    <article style={prose}>
      <p style={eyebrow}>Legal · Internal</p>
      <h1 style={h1}>Non-Disclosure &amp; Intellectual Property Agreement</h1>
      <p style={meta}>Effective: {EFFECTIVE} · Version 1.0 · Applies to all employees, contractors, and freelancers</p>
      <p style={lead}>
        This Non-Disclosure and Intellectual Property Agreement ("Agreement") is entered into
        between {COMPANY} ("Company") and you ("Recipient"), a person engaging with the Company
        in any capacity including but not limited to employment, freelance work, consulting,
        internship, or technical advisory. By commencing work with the Company you agree to be
        bound by this Agreement.
      </p>

      <Section title="1. Definitions">
        <P>
          <strong>"Confidential Information"</strong> means all non-public information disclosed
          by the Company to the Recipient in any form — written, oral, electronic, or visual —
          including but not limited to: source code, AI prompt architectures, database schemas,
          business logic, product roadmaps, pricing strategies, customer data, investor
          information, financial data, sales figures, and any information marked as confidential
          or that a reasonable person would understand to be confidential given the context of
          disclosure.
        </P>
        <P>
          <strong>"Work Product"</strong> means any and all works, inventions, innovations,
          improvements, software, code, designs, algorithms, documentation, or other creative
          output produced by the Recipient in connection with or arising from their engagement
          with the Company, whether or not produced during working hours or on Company equipment.
        </P>
      </Section>

      <Section title="2. Confidentiality obligations">
        <P>The Recipient agrees to:</P>
        <Bullets items={[
          "Keep all Confidential Information strictly secret and not disclose it to any third party without prior written consent from the Company.",
          "Use Confidential Information solely for the purposes of performing their duties for the Company.",
          "Not copy, reproduce, reverse-engineer, or extract Confidential Information beyond what is strictly necessary for their work.",
          "Immediately notify the Company at legal@kunjaraos.com upon discovering or suspecting any unauthorised disclosure or breach.",
          "Return or destroy all materials containing Confidential Information upon termination of engagement at the Company's direction.",
          "Ensure that any third-party tools or services used in the course of work do not inadvertently expose Confidential Information (e.g., pasting source code into public AI chatbots).",
        ]} />
      </Section>

      <Section title="3. Exclusions">
        <P>The obligations in Section 2 do not apply to information that:</P>
        <Bullets items={[
          "Is or becomes publicly known through no act or omission of the Recipient.",
          "Was already lawfully known to the Recipient before disclosure by the Company, as evidenced by written records predating the disclosure.",
          "Is independently developed by the Recipient without reference to the Confidential Information.",
          "Is required to be disclosed by applicable law, court order, or regulatory authority — in which case the Recipient must give the Company maximum permissible advance notice.",
        ]} />
      </Section>

      <Section title="4. Intellectual property ownership">
        <P>
          All Work Product created by the Recipient in connection with their engagement with the
          Company is a work made for hire and shall be the sole and exclusive property of the
          Company from the moment of creation. To the extent any Work Product does not qualify
          as a work made for hire under applicable law, the Recipient hereby irrevocably assigns
          all right, title, and interest in and to such Work Product — including all intellectual
          property rights — to the Company.
        </P>
        <P>
          The Recipient retains no rights whatsoever in any Work Product after this assignment,
          including no right to use, display, reproduce, or create derivative works based on
          the Work Product without the Company's express prior written consent.
        </P>
      </Section>

      <Section title="5. Prior inventions">
        <P>
          If the Recipient believes any prior invention, work, or intellectual property owned
          by them (predating this engagement) is relevant to the Work Product, they must disclose
          this in writing to <A href={`mailto:${LEGAL}`}>{LEGAL}</A> before commencing the
          relevant work. Failure to disclose creates a presumption that no prior inventions are
          implicated and that all relevant Work Product belongs to the Company.
        </P>
      </Section>

      <Section title="6. Non-solicitation">
        <P>
          During the term of engagement and for a period of 12 months thereafter, the Recipient
          agrees not to:
        </P>
        <Bullets items={[
          "Solicit, induce, or attempt to recruit any employee, contractor, or advisor of the Company to leave their engagement with the Company.",
          "Solicit any customer or prospective customer of the Company with whom the Recipient had material contact during their engagement, for the purpose of providing competing services.",
        ]} />
      </Section>

      <Section title="7. Non-compete (limited)">
        <P>
          The Recipient agrees that during their engagement with the Company they will not,
          without prior written consent, engage in or assist any business that directly competes
          with the Company's core product — an AI-powered event management and proposal platform
          — in any material way.
        </P>
        <P>
          This restriction applies only during the active engagement period and does not extend
          post-termination, except where otherwise agreed in a separate written instrument.
        </P>
      </Section>

      <Section title="8. Term and survival">
        <P>
          This Agreement takes effect on the date the Recipient commences work with the Company
          and continues indefinitely. The obligations under Sections 2 (Confidentiality),
          4 (IP Ownership), and 6 (Non-solicitation) survive the termination of the engagement
          for a period of 5 years, or indefinitely where Trade Secret law affords broader protection.
        </P>
      </Section>

      <Section title="9. Remedies">
        <P>
          The Recipient acknowledges that any breach of this Agreement would cause the Company
          irreparable harm for which monetary damages alone would be an inadequate remedy. The
          Company is therefore entitled to seek injunctive or other equitable relief from any
          court of competent jurisdiction in addition to any other remedies available at law.
        </P>
      </Section>

      <Section title="10. Governing law">
        <P>
          This Agreement is governed by the laws of the Republic of India. Any dispute arising
          under or in connection with this Agreement shall be subject to the exclusive jurisdiction
          of the courts in Mumbai, Maharashtra, India.
        </P>
      </Section>

      <Section title="11. Entire agreement">
        <P>
          This Agreement constitutes the entire understanding between the parties regarding
          confidentiality and intellectual property and supersedes all prior oral or written
          representations on these subjects. Amendments must be in writing and signed by an
          authorised representative of the Company.
        </P>
      </Section>

      <Section title="12. Contact">
        <P>
          Legal queries: <A href={`mailto:${LEGAL}`}>{LEGAL}</A>
        </P>
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section style={{ marginTop: 36 }}><h2 style={h2}>{title}</h2>{children}</section>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p style={p}>{children}</p>;
}
function A({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} style={{ color: "var(--accent)", textDecoration: "none" }}>{children}</a>;
}
function Bullets({ items }: { items: string[] }) {
  return (
    <ul style={{ paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8, margin: "10px 0 14px" }}>
      {items.map((item, i) => (
        <li key={i} style={{ fontSize: 14, lineHeight: 1.65, color: "var(--text-2)", paddingLeft: 16, borderLeft: "2px solid var(--border-mid)" }}>
          {item}
        </li>
      ))}
    </ul>
  );
}

const prose:   React.CSSProperties = { maxWidth: 680 };
const eyebrow: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 12 };
const h1:      React.CSSProperties = { fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.2, color: "var(--text-1)", marginBottom: 8, marginTop: 0 };
const meta:    React.CSSProperties = { fontSize: 12, color: "var(--text-3)", marginBottom: 24 };
const lead:    React.CSSProperties = { fontSize: 15, lineHeight: 1.7, color: "var(--text-2)", marginBottom: 8, borderLeft: "3px solid var(--accent)", paddingLeft: 16 };
const h2:      React.CSSProperties = { fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginTop: 0, marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid var(--border)" };
const p:       React.CSSProperties = { fontSize: 14, lineHeight: 1.7, color: "var(--text-2)", marginBottom: 10 };
