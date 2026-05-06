import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Credit Usage Policy · Kunjara OS",
  description: "How AI credits work on Kunjara OS — costs per feature, fair usage limits, and credit expiry rules.",
};

const EFFECTIVE = "6 May 2026";
const SUPPORT   = "support@kunjaraos.com";

export default function CreditsPage() {
  return (
    <article style={prose}>
      <p style={eyebrow}>Legal · Credits</p>
      <h1 style={h1}>Credit Usage Policy</h1>
      <p style={meta}>Effective: {EFFECTIVE} · Version 1.0</p>
      <p style={lead}>
        Kunjara OS uses an AI credit system to meter access to compute-intensive features powered
        by large language models and image generation APIs. This policy explains how credits work,
        what each feature costs, and the rules governing credit allocation and expiry.
      </p>

      <Section title="1. What are credits?">
        <P>
          Credits are the unit of consumption for AI-powered features on the platform. Each time
          you invoke an AI feature, the corresponding credit cost is deducted from your balance
          before the output is generated. Credits are not a currency and have no cash value.
        </P>
      </Section>

      <Section title="2. How credits are allocated">
        <Bullets items={[
          "Free plan: 10 credits per month, allocated on the 1st of each calendar month.",
          "Starter plan: 100 credits per month, allocated at the start of each billing cycle.",
          "Pro plan: 500 credits per month, allocated at the start of each billing cycle.",
          "Agency plan: 2,000 credits per month, allocated at the start of each billing cycle.",
          "Top-up credit packs: purchased separately, added to your balance immediately on payment confirmation.",
          "Goodwill credits: issued by support at our discretion — treated as top-up credits.",
        ]} />
        <P>
          Subscription credits are allocated on a rolling monthly basis and reset at the start of
          each new billing cycle. Unused subscription credits do <strong>not</strong> roll over.
          Top-up pack credits carry forward indefinitely while your account remains active.
        </P>
      </Section>

      <Section title="3. Credit costs per feature">
        <P>
          The following table shows the credit cost for each AI feature. Costs reflect the
          compute intensity and third-party API costs of each generation:
        </P>
        <table style={tbl}>
          <thead>
            <tr>
              <th style={th}>Feature</th>
              <th style={th}>Credits per use</th>
              <th style={th}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {COSTS.map((row) => (
              <tr key={row.feature}>
                <td style={td}>{row.feature}</td>
                <td style={{ ...td, fontWeight: 600, color: "var(--accent)" }}>{row.cost}</td>
                <td style={{ ...td, color: "var(--text-3)", fontSize: 12 }}>{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <P>
          Credit costs are subject to change with 14 days' advance notice. We will communicate
          changes via email and in-app notification.
        </P>
      </Section>

      <Section title="4. When credits are deducted">
        <P>
          Credits are deducted at the moment you submit a generation request — before the output
          is returned. If a generation fails due to a server-side error on our infrastructure,
          credits are refunded to your balance automatically within 60 seconds. Credits are
          <strong> not</strong> refunded if the generation completes successfully but you are
          dissatisfied with the result.
        </P>
      </Section>

      <Section title="5. Fair usage">
        <P>
          Credits exist to ensure equitable access across all users. Accounts that exhibit
          patterns consistent with automated abuse — such as scripted generation loops, systematic
          scraping of outputs, or sharing credentials to pool credits — may have their credit
          consumption throttled or their account suspended pending review.
        </P>
        <P>
          If you require high-volume access for legitimate business purposes, contact us at{" "}
          <A href={`mailto:${SUPPORT}`}>{SUPPORT}</A> to discuss an enterprise arrangement.
        </P>
      </Section>

      <Section title="6. Credit expiry">
        <Bullets items={[
          "Subscription credits expire at the end of each billing cycle and are replaced by a fresh allocation.",
          "Top-up pack credits do not expire while your account is active.",
          "All credits (subscription and top-up) are forfeited when an account is closed or terminated.",
          "Credits cannot be transferred between accounts.",
          "Credits cannot be converted to cash or applied as payment toward a subscription.",
        ]} />
      </Section>

      <Section title="7. Checking your balance">
        <P>
          Your current credit balance and usage history are visible in{" "}
          <strong>Settings → Billing → Credit Usage</strong>. The balance displayed reflects
          real-time deductions. If you notice a discrepancy, contact{" "}
          <A href={`mailto:${SUPPORT}`}>{SUPPORT}</A> within 7 days of the suspected error.
        </P>
      </Section>

      <Section title="8. Changes to this policy">
        <P>
          We reserve the right to adjust credit allocations, costs, and rules with reasonable
          notice. Material changes will be communicated by email at least 14 days in advance.
          Continued use of the platform after changes take effect constitutes acceptance.
        </P>
      </Section>
    </article>
  );
}

const COSTS = [
  { feature: "Proposal generation (full)",        cost: "10",  note: "Complete AI proposal from brief" },
  { feature: "Proposal section regeneration",     cost: "3",   note: "Per section (concept, budget, etc.)" },
  { feature: "3D Event Visual",                   cost: "15",  note: "OpenAI image generation" },
  { feature: "Budget Builder",                    cost: "5",   note: "Itemised budget with GST" },
  { feature: "Run of Show",                       cost: "5",   note: "Minute-by-minute cue sheet" },
  { feature: "Social Caption Pack",               cost: "3",   note: "Captions for 4 platforms" },
  { feature: "Presentation Deck",                 cost: "8",   note: "Slide-by-slide content" },
  { feature: "Atlas X brain query",               cost: "2",   note: "Per AI conversation turn" },
  { feature: "Compliance check",                  cost: "2",   note: "Regulatory checklist generation" },
  { feature: "PDF export",                        cost: "1",   note: "Rendered proposal PDF" },
];

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
        <li key={i} style={{ fontSize: 14, lineHeight: 1.65, color: "var(--text-2)", paddingLeft: 16, borderLeft: "2px solid var(--border-mid)" }}>{item}</li>
      ))}
    </ul>
  );
}

const prose:   React.CSSProperties = { maxWidth: 720 };
const eyebrow: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 12 };
const h1:      React.CSSProperties = { fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.2, color: "var(--text-1)", marginBottom: 8, marginTop: 0 };
const meta:    React.CSSProperties = { fontSize: 12, color: "var(--text-3)", marginBottom: 24 };
const lead:    React.CSSProperties = { fontSize: 15, lineHeight: 1.7, color: "var(--text-2)", marginBottom: 8, borderLeft: "3px solid var(--accent)", paddingLeft: 16 };
const h2:      React.CSSProperties = { fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginTop: 0, marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid var(--border)" };
const p:       React.CSSProperties = { fontSize: 14, lineHeight: 1.7, color: "var(--text-2)", marginBottom: 10 };
const tbl:     React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 16 };
const th:      React.CSSProperties = { textAlign: "left", padding: "8px 12px", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-3)", borderBottom: "1px solid var(--border)" };
const td:      React.CSSProperties = { padding: "9px 12px", color: "var(--text-2)", borderBottom: "1px solid var(--border)" };
