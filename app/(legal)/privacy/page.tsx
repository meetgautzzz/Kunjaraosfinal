import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy · Kunjara OS",
  description: "How Kunjara OS collects, uses, and protects your personal data.",
};

const EFFECTIVE = "27 April 2026";

export default function PrivacyPage() {
  return (
    <article style={prose}>
      <p style={eyebrow}>Privacy Policy</p>
      <h1 style={h1}>Your privacy, clearly explained.</h1>
      <p style={meta}>Effective date: {EFFECTIVE}</p>
      <p style={lead}>
        Kunjara OS ("we", "us", "our") is committed to protecting your personal data.
        This policy explains what we collect, why we collect it, how we use it, and
        your rights as a user.
      </p>

      <Section title="1. Who we are">
        <P>
          Kunjara OS is an AI-powered event management platform operated from India.
          For privacy-related queries, contact us at{" "}
          <A href="mailto:support@kunjaraos.com">support@kunjaraos.com</A>.
        </P>
      </Section>

      <Section title="2. What data we collect">
        <P>We collect the following categories of data:</P>
        <Dl items={[
          ["Account data", "Your name and email address when you register or sign in with Google OAuth."],
          ["Profile / branding data", "Company name, phone number, address, and logo that you optionally add in Settings."],
          ["Proposal content", "Event briefs, client details, budgets, and AI-generated proposal content that you create on the platform."],
          ["Payment data", "Your payment history and credit balance. We do not store card numbers or UPI credentials — all payment processing is handled by Razorpay."],
          ["Usage data", "Pages visited, features used, AI credit consumption, and timestamps of actions. Used to improve the product."],
          ["Technical data", "IP address, browser type, device type, and session cookies required to keep you logged in."],
        ]} />
      </Section>

      <Section title="3. How we use your data">
        <Dl items={[
          ["Providing the service", "To create your account, generate proposals, process payments, and send share links to your clients."],
          ["AI generation", "Your event brief is sent to OpenAI to generate proposal content. OpenAI does not use your data to train its models under our API agreement."],
          ["Billing", "To process credit pack purchases and subscription payments via Razorpay."],
          ["Communications", "To send transactional emails (e.g., proposal approval notifications). We do not send marketing emails without your consent."],
          ["Product improvement", "Anonymised, aggregated usage data helps us understand what features to improve."],
          ["Legal compliance", "To comply with applicable Indian laws including the DPDP Act 2023."],
        ]} />
      </Section>

      <Section title="4. Third-party services">
        <P>We share data with the following trusted third parties only to the extent necessary to operate the platform:</P>
        <Dl items={[
          ["Supabase", "Database and authentication infrastructure. Your data is stored in Supabase's servers (region: ap-south-1 / Mumbai). Supabase is SOC 2 Type II certified."],
          ["OpenAI", "AI text generation for proposals. Event brief data is sent to OpenAI's API. See OpenAI's privacy policy at openai.com/policies/privacy-policy."],
          ["Razorpay", "Payment processing for credit packs and subscriptions. Razorpay is PCI DSS compliant. See their privacy policy at razorpay.com/privacy."],
          ["Resend", "Transactional email delivery (e.g., proposal response notifications)."],
          ["Vercel", "Application hosting and edge infrastructure."],
        ]} />
        <P>We do not sell your data to any third party. Ever.</P>
      </Section>

      <Section title="5. Data retention">
        <P>
          We retain your account data for as long as your account is active. Proposal data
          is retained until you delete it or request account deletion. Payment records are
          retained for 7 years as required by Indian tax law. You can request deletion of
          your personal data at any time — see Section 7.
        </P>
      </Section>

      <Section title="6. Data security">
        <P>
          All data is encrypted in transit (TLS 1.3) and at rest. Access to production
          databases is restricted to authorised personnel only. We use row-level security
          (RLS) policies so users can only access their own data. Service role credentials
          are never exposed to client-side code.
        </P>
        <P>
          No system is perfectly secure. If you believe your account has been compromised,
          contact us immediately at{" "}
          <A href="mailto:support@kunjaraos.com">support@kunjaraos.com</A>.
        </P>
      </Section>

      <Section title="7. Your rights">
        <P>You have the right to:</P>
        <Dl items={[
          ["Access", "Request a copy of the personal data we hold about you."],
          ["Correction", "Ask us to correct inaccurate data."],
          ["Deletion", "Request deletion of your personal data. See our Data Deletion Policy."],
          ["Portability", "Request your proposal data in a machine-readable format."],
          ["Withdrawal of consent", "Where processing is based on consent, withdraw it at any time."],
        ]} />
        <P>
          To exercise any of these rights, email{" "}
          <A href="mailto:support@kunjaraos.com">support@kunjaraos.com</A>. We will respond
          within 30 days.
        </P>
      </Section>

      <Section title="8. Cookies">
        <P>
          We use session cookies to keep you logged in. These are strictly necessary and
          cannot be disabled without breaking authentication. We do not use advertising
          cookies or cross-site tracking.
        </P>
      </Section>

      <Section title="9. Children">
        <P>
          Kunjara OS is not directed at children under 18. We do not knowingly collect
          data from minors. If you believe a minor has registered, contact us and we will
          delete the account promptly.
        </P>
      </Section>

      <Section title="10. Changes to this policy">
        <P>
          We may update this policy as the product evolves. We will notify registered users
          of material changes by email. The "Effective date" at the top of this page shows
          when the current version was last updated.
        </P>
      </Section>

      <Section title="11. Contact">
        <P>
          Privacy questions or requests: <A href="mailto:support@kunjaraos.com">support@kunjaraos.com</A>
        </P>
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 32 }}>
      <h2 style={h2}>{title}</h2>
      {children}
    </section>
  );
}
function P({ children }: { children: React.ReactNode }) {
  return <p style={p}>{children}</p>;
}
function A({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} style={link}>{children}</a>;
}
function Dl({ items }: { items: [string, string][] }) {
  return (
    <dl style={{ margin: "10px 0 14px", display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map(([term, def]) => (
        <div key={term} style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: "0 16px", alignItems: "baseline" }}>
          <dt style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{term}</dt>
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
