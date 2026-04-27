import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service · Kunjara OS",
  description: "The terms that govern your use of Kunjara OS.",
};

const EFFECTIVE = "27 April 2026";

export default function TermsPage() {
  return (
    <article style={prose}>
      <p style={eyebrow}>Terms of Service</p>
      <h1 style={h1}>Terms of Service</h1>
      <p style={meta}>Effective date: {EFFECTIVE}</p>
      <p style={lead}>
        These Terms of Service ("Terms") govern your access to and use of Kunjara OS
        ("Service", "we", "us"). By creating an account, you agree to these Terms.
        Please read them carefully.
      </p>

      <Section title="1. Eligibility">
        <P>
          You must be at least 18 years old and legally capable of entering into a binding
          contract to use Kunjara OS. By registering, you confirm that you meet these
          requirements.
        </P>
      </Section>

      <Section title="2. Your account">
        <P>
          You are responsible for maintaining the security of your account credentials.
          Do not share your password or allow others to access your account. You are
          responsible for all activity that occurs under your account.
        </P>
        <P>
          We reserve the right to suspend or terminate accounts that violate these Terms,
          engage in fraud, or are inactive for an extended period.
        </P>
      </Section>

      <Section title="3. Acceptable use">
        <P>You agree not to:</P>
        <Bullets items={[
          "Use the platform to generate content that is false, misleading, defamatory, or illegal.",
          "Attempt to reverse-engineer, scrape, or extract data from the platform in bulk.",
          "Use automated tools to generate proposals for resale without our written consent.",
          "Upload content that infringes intellectual property rights of others.",
          "Use the platform to harm, harass, or defraud clients or third parties.",
          "Attempt to circumvent credit limits, billing systems, or access controls.",
          "Share your account with others or allow others to use your AI credits.",
        ]} />
      </Section>

      <Section title="4. AI-generated content">
        <P>
          Kunjara OS uses artificial intelligence to generate proposal content. You
          acknowledge that:
        </P>
        <Bullets items={[
          "AI-generated content is a starting point and should be reviewed before sharing with clients.",
          "We do not guarantee the accuracy, completeness, or suitability of AI-generated content.",
          "You are solely responsible for the proposals you share with your clients.",
          "You own the proposals you create. We claim no intellectual property rights over your content.",
        ]} />
      </Section>

      <Section title="5. Credits and payments">
        <P>
          Kunjara OS operates on an AI credit system. Credits are consumed each time you
          use an AI feature (proposal generation, regeneration, AI tools).
        </P>
        <Bullets items={[
          "Credits are non-refundable once consumed.",
          "Unused credits in a credit pack do not expire unless your account is terminated.",
          "Subscription credits renew monthly. Unused monthly credits do not carry over.",
          "All prices are in Indian Rupees (INR) inclusive of applicable taxes.",
          "In the event of a billing error, contact us within 14 days for a resolution.",
          "We reserve the right to change pricing with 14 days' notice to registered users.",
        ]} />
        <P>
          Payments are processed by Razorpay. By making a payment, you also agree to
          Razorpay's terms of service.
        </P>
      </Section>

      <Section title="6. Subscription plans">
        <P>
          If you purchase a subscription plan, it will automatically renew at the end of
          each billing period unless you cancel before the renewal date. To cancel, email
          us at <A href="mailto:support@kunjaraos.com">support@kunjaraos.com</A> at least
          24 hours before the renewal date. Cancellation takes effect at the end of the
          current period — you will not be charged again.
        </P>
      </Section>

      <Section title="7. Intellectual property">
        <P>
          The Kunjara OS platform, its design, code, and branding are owned by us and
          protected by applicable intellectual property laws. You may not copy, modify,
          or distribute any part of the platform without our written permission.
        </P>
        <P>
          You retain full ownership of the content you upload and the proposals you
          generate using the Service.
        </P>
      </Section>

      <Section title="8. Privacy">
        <P>
          Your use of the Service is also governed by our{" "}
          <A href="/privacy">Privacy Policy</A>, which is incorporated into these Terms
          by reference.
        </P>
      </Section>

      <Section title="9. Limitation of liability">
        <P>
          To the maximum extent permitted by applicable law, Kunjara OS and its operators
          shall not be liable for:
        </P>
        <Bullets items={[
          "Any indirect, incidental, special, or consequential damages arising from your use of the Service.",
          "Loss of data, revenue, clients, or business opportunities.",
          "Errors or inaccuracies in AI-generated content.",
          "Downtime, service interruptions, or technical failures.",
        ]} />
        <P>
          Our total liability to you in any 12-month period shall not exceed the amount
          you paid us during that period.
        </P>
      </Section>

      <Section title="10. Disclaimer of warranties">
        <P>
          The Service is provided "as is" and "as available" without warranties of any kind,
          express or implied. We do not warrant that the Service will be error-free,
          uninterrupted, or meet your specific requirements.
        </P>
      </Section>

      <Section title="11. Governing law">
        <P>
          These Terms are governed by the laws of India. Any disputes shall be subject to
          the exclusive jurisdiction of the courts in Mumbai, Maharashtra.
        </P>
      </Section>

      <Section title="12. Changes to these Terms">
        <P>
          We may update these Terms as the platform evolves. We will notify users of
          material changes by email at least 14 days in advance. Continued use of the
          platform after changes take effect constitutes acceptance of the new Terms.
        </P>
      </Section>

      <Section title="13. Contact">
        <P>
          Questions about these Terms:{" "}
          <A href="mailto:support@kunjaraos.com">support@kunjaraos.com</A>
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

const prose: React.CSSProperties = { maxWidth: 680 };
const eyebrow: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 12 };
const h1: React.CSSProperties = { fontSize: 32, fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.15, color: "var(--text-1)", marginBottom: 8, marginTop: 0 };
const meta: React.CSSProperties = { fontSize: 12, color: "var(--text-3)", marginBottom: 24 };
const lead: React.CSSProperties = { fontSize: 16, lineHeight: 1.65, color: "var(--text-2)", marginBottom: 8, borderLeft: "3px solid var(--accent)", paddingLeft: 16 };
const h2: React.CSSProperties = { fontSize: 16, fontWeight: 700, color: "var(--text-1)", marginTop: 0, marginBottom: 10 };
const p: React.CSSProperties = { fontSize: 14, lineHeight: 1.7, color: "var(--text-2)", marginBottom: 10 };
const link: React.CSSProperties = { color: "var(--accent)", textDecoration: "none" };
