import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund & Billing Policy · Kunjara OS",
  description: "Refund terms, billing cycles, and dispute resolution for Kunjara OS subscriptions and credit packs.",
};

const EFFECTIVE = "6 May 2026";
const SUPPORT   = "support@kunjaraos.com";
const COMPANY   = "Kunjara Technologies";

export default function RefundPage() {
  return (
    <article style={prose}>
      <p style={eyebrow}>Legal · Billing</p>
      <h1 style={h1}>Refund &amp; Billing Policy</h1>
      <p style={meta}>Effective: {EFFECTIVE} · Version 1.0</p>
      <p style={lead}>
        This policy governs all payments, subscription billing, credit pack purchases, and refund
        requests made on the Kunjara OS platform operated by {COMPANY}. By making any payment you
        agree to the terms below in addition to our Terms of Service.
      </p>

      <Section title="1. Payment processing">
        <P>
          All payments are processed by Razorpay Financial Services Pvt. Ltd., a PCI-DSS compliant
          payment gateway. We accept UPI, credit cards, debit cards, and net banking. Prices are
          displayed and charged in Indian Rupees (INR) inclusive of all applicable taxes including GST.
        </P>
        <P>
          We do not store card numbers, UPI handles, bank account details, or any raw payment
          credentials on our servers. All payment data is tokenised and handled exclusively by
          Razorpay under their own security and privacy standards.
        </P>
      </Section>

      <Section title="2. Subscription billing">
        <Bullets items={[
          "Subscriptions are billed in advance on a monthly or annual cycle beginning on the date you subscribe.",
          "Your subscription renews automatically at the end of each billing period unless you cancel before the renewal date.",
          "Annual subscriptions are charged as a single upfront payment covering 12 months.",
          "If a recurring payment fails, we retry up to 3 times over 5 business days. If payment remains unsuccessful, your account is downgraded to the Free tier.",
          "You will receive an email invoice for every successful charge.",
          "Price changes take effect at the next renewal after 14 days' advance notice by email.",
        ]} />
      </Section>

      <Section title="3. Cancellation">
        <P>
          You may cancel your subscription at any time through <strong>Settings → Billing → Cancel Plan</strong>,
          or by emailing <A href={`mailto:${SUPPORT}`}>{SUPPORT}</A> at least 24 hours before your
          next renewal date.
        </P>
        <Bullets items={[
          "Cancellation takes effect at the end of the current paid billing period.",
          "You retain full access to paid features until your billing period ends.",
          "No partial refunds are issued for unused days within a billing period.",
          "Downgrading to a lower plan takes effect at the start of the next billing cycle.",
          "If you cancel an annual plan mid-year, no pro-rata refund is issued for the remaining months.",
        ]} />
      </Section>

      <Section title="4. Credit packs">
        <Bullets items={[
          "Credit packs are one-time purchases that add AI credits to your account balance.",
          "Credits from packs do not expire as long as your account remains active.",
          "Credits are deducted at the point of use, before AI output is returned.",
          "Credit pack purchases are non-refundable once any credits from the pack have been consumed.",
          "Unused credits from a credit pack are non-refundable if you voluntarily close your account.",
          "We reserve the right to adjust the credit cost of specific features with 14 days' notice.",
        ]} />
      </Section>

      <Section title="5. Refund eligibility">
        <P>
          We operate a strict no-refund policy except in the circumstances listed below:
        </P>
        <Bullets items={[
          "Duplicate charge: you were billed more than once for the same billing period or credit pack.",
          "Incorrect amount: you were charged a different amount than the price displayed at checkout.",
          "Billing error on our part: a verifiable technical fault on our systems caused an unintended charge.",
        ]} />
        <P>
          The following are explicitly <strong>not</strong> eligible for refunds:
        </P>
        <Bullets items={[
          "Subscription fees after the billing period has commenced.",
          "Credit pack fees after any credits from the pack have been consumed.",
          "Dissatisfaction with AI-generated outputs — outputs are probabilistic in nature.",
          "Accidental purchases where you did not cancel before renewal.",
          "Account termination due to violation of our Terms of Service.",
          "Requests submitted more than 14 days after the charge date.",
        ]} />
      </Section>

      <Section title="6. How to request a refund">
        <P>
          To request a refund for an eligible billing error, email{" "}
          <A href={`mailto:${SUPPORT}`}>{SUPPORT}</A> with the subject line
          "Refund Request — [your registered email]" and include:
        </P>
        <Bullets items={[
          "Your registered email address.",
          "The Razorpay payment ID (found in your invoice email).",
          "A brief description of the error.",
          "Any supporting evidence (screenshot of duplicate charge, etc.).",
        ]} />
        <P>
          We will acknowledge your request within 2 business days and issue a resolution within
          7 business days of receiving sufficient documentation. Approved refunds are returned to
          the original payment method via Razorpay and may take 5–10 business days to appear
          depending on your bank.
        </P>
      </Section>

      <Section title="7. Goodwill credits">
        <P>
          In exceptional circumstances — such as extended service downtime caused by us — we may
          at our sole discretion issue goodwill credits to affected accounts rather than cash
          refunds. Goodwill credits have no cash value, cannot be withdrawn, and expire if your
          account is closed.
        </P>
      </Section>

      <Section title="8. Chargebacks">
        <P>
          Initiating a payment chargeback with your bank without first contacting us constitutes
          a breach of our Terms of Service and will result in immediate suspension of your account
          pending investigation. If a chargeback is filed in bad faith for a charge that is not
          eligible for a refund under this policy, we reserve the right to permanently terminate
          the account and refer the matter to legal counsel.
        </P>
        <P>
          We strongly encourage you to contact us at{" "}
          <A href={`mailto:${SUPPORT}`}>{SUPPORT}</A> before involving your bank — disputes are
          almost always resolved faster and more favourably through direct contact.
        </P>
      </Section>

      <Section title="9. Taxes">
        <P>
          All prices shown on the platform include GST where applicable under Indian law. We are
          not responsible for any additional taxes, duties, or levies that may apply in your
          jurisdiction outside India.
        </P>
      </Section>

      <Section title="10. Contact">
        <P>
          Billing support: <A href={`mailto:${SUPPORT}`}>{SUPPORT}</A><br />
          Response time: within 2 business days (Mon–Fri, 10:00–18:00 IST)
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
