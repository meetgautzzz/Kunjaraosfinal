import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service · Kunjara OS",
  description: "The terms and conditions that govern your use of Kunjara OS.",
};

const EFFECTIVE  = "6 May 2026";
const COMPANY    = "Kunjara Technologies";
const PRODUCT    = "Kunjara OS™";
const SUPPORT    = "support@kunjaraos.com";
const LEGAL      = "legal@kunjaraos.com";

export default function TermsPage() {
  return (
    <article style={prose}>
      <p style={eyebrow}>Legal · Terms of Service</p>
      <h1 style={h1}>Terms of Service</h1>
      <p style={meta}>Effective: {EFFECTIVE} · Version 1.0</p>
      <p style={lead}>
        These Terms of Service ("Terms") constitute a legally binding agreement between you ("User",
        "you") and {COMPANY} ("Company", "we", "us", "our"), the operator of {PRODUCT} available at
        kunjaraos.com ("Platform"). By creating an account or using the Platform in any way, you
        accept and agree to be bound by these Terms in full. If you do not agree, do not use the Platform.
      </p>

      <Section title="1. Eligibility">
        <P>
          To use {PRODUCT} you must: (a) be at least 18 years of age; (b) be legally capable of
          entering into a binding contract under applicable law; (c) not be barred from receiving
          services under the laws of India or any other applicable jurisdiction; and (d) if acting
          on behalf of a business entity, have the authority to bind that entity to these Terms.
        </P>
        <P>
          By registering an account you represent and warrant that all of the above conditions are
          satisfied. The Company reserves the right to refuse registration or suspend accounts
          where eligibility cannot be established.
        </P>
      </Section>

      <Section title="2. Account obligations">
        <P>You are responsible for:</P>
        <Bullets items={[
          "Maintaining the confidentiality of your login credentials and not sharing them with any third party.",
          "All activity that occurs under your account, whether authorised by you or not.",
          "Providing accurate and current information during registration and keeping it updated.",
          "Immediately notifying us at " + SUPPORT + " if you suspect unauthorised access to your account.",
          "Ensuring your use complies with applicable laws including those of your country of residence.",
        ]} />
        <P>
          One account per person or legal entity. Creating multiple accounts to circumvent credit
          limits, access restrictions, or any other platform rule is strictly prohibited and grounds
          for immediate permanent termination.
        </P>
      </Section>

      <Section title="3. Acceptable use">
        <P>You agree not to use the Platform to:</P>
        <Bullets items={[
          "Generate, distribute, or publish content that is false, misleading, defamatory, obscene, or otherwise unlawful.",
          "Infringe the intellectual property rights of any third party.",
          "Reverse-engineer, decompile, disassemble, scrape, or extract any part of the Platform's source code, AI models, or data structures.",
          "Use automated scripts, bots, or crawlers to access, test, or stress-test the Platform.",
          "Resell, sublicense, or commercially exploit AI-generated outputs without disclosure to your clients that AI assistance was used.",
          "Circumvent, disable, or interfere with security features, rate limits, or credit systems.",
          "Upload or transmit malware, viruses, or any code designed to disrupt the Platform or its users.",
          "Use the Platform to facilitate fraud, money laundering, or any criminal activity.",
          "Share, sell, or transfer your account or AI credits to any third party.",
          "Systematically generate proposals for resale as a white-label service without a signed commercial agreement with us.",
        ]} />
        <P>
          Violation of acceptable use policies may result in immediate suspension or permanent
          termination of your account without refund of any remaining credits or subscription fees.
        </P>
      </Section>

      <Section title="4. AI-generated content — limitations and responsibility">
        <P>
          {PRODUCT} uses large language models (OpenAI) and image generation APIs to produce
          proposals, 3D renders, run-of-show documents, and other outputs. You expressly acknowledge:
        </P>
        <Bullets items={[
          "AI outputs are probabilistic and may contain errors, inaccuracies, hallucinations, or omissions.",
          "No AI-generated output constitutes legal, financial, architectural, or professional advice.",
          "You bear sole responsibility for reviewing, verifying, and approving all AI-generated content before sharing with clients.",
          "We make no warranty that AI outputs will meet your specific requirements or your client's expectations.",
          "AI-generated event visuals and 3D renders are artistic representations; actual execution may differ.",
          "You own the proposals and content you generate. We claim no intellectual property rights over your outputs.",
        ]} />
        <P>
          The Company shall not be liable for any loss, damage, or claim arising from a client's
          reliance on unreviewed AI-generated content shared by you.
        </P>
      </Section>

      <Section title="5. AI credit system">
        <P>
          Access to AI features is governed by a credit system. Credits are purchased in packs or
          included in subscription plans. The following rules apply:
        </P>
        <Bullets items={[
          "Credits are deducted at the point of AI feature use, before results are returned.",
          "Credits are non-refundable once consumed, regardless of whether the output met your expectations.",
          "Subscription credits are allocated monthly and do not roll over to the next billing period.",
          "Top-up credit pack credits do not expire unless your account is terminated.",
          "Attempting to reverse, dispute, or charge back credit purchases in bad faith will result in account termination.",
          "We reserve the right to adjust credit costs for specific features with 14 days' notice.",
          "Fair usage limits apply. Accounts showing abnormal consumption patterns may be reviewed and throttled.",
        ]} />
        <P>
          For a full breakdown of what costs how many credits, see our{" "}
          <a href="/credits" style={linkStyle}>Credit Usage Policy</a>.
        </P>
      </Section>

      <Section title="6. Subscriptions and billing">
        <P>
          Subscription plans are billed in advance on a monthly or annual basis in Indian Rupees (INR)
          inclusive of all applicable taxes (including GST where applicable). By subscribing you authorise
          us to charge your payment method through Razorpay on a recurring basis until you cancel.
        </P>
        <Bullets items={[
          "Subscriptions auto-renew at the end of each billing period unless cancelled before the renewal date.",
          "To cancel, log in to Settings → Billing → Cancel Plan, or email " + SUPPORT + " at least 24 hours before your renewal date.",
          "Cancellation takes effect at the end of the current paid period. You retain access until then.",
          "No partial refunds are issued for unused days within a billing period.",
          "Downgrading to a lower plan takes effect at the next billing cycle.",
          "If a payment fails, we will retry up to three times over 5 business days. If payment remains unsuccessful, your plan is downgraded to the Free tier.",
          "All prices are subject to change with 14 days' advance notice to registered users.",
        ]} />
        <P>
          Payments are processed by Razorpay Financial Services Pvt. Ltd. By making a payment you also
          agree to Razorpay's terms and privacy policy. We do not store card numbers, UPI handles, or
          bank account details on our servers.
        </P>
      </Section>

      <Section title="7. Refunds">
        <P>
          Our refund policy is as follows:
        </P>
        <Bullets items={[
          "Subscription fees are non-refundable once the billing period has commenced.",
          "Credit pack purchases are non-refundable once any credits from the pack have been consumed.",
          "In the event of a verifiable billing error by us (duplicate charge, incorrect amount), we will issue a full correction within 7 business days of notification.",
          "Refund requests must be submitted to " + SUPPORT + " within 14 days of the charge date.",
          "We reserve discretion to issue goodwill credits (not cash refunds) in exceptional circumstances.",
        ]} />
        <P>
          For the complete refund policy see our{" "}
          <a href="/refund" style={linkStyle}>Refund & Billing Policy</a>.
        </P>
      </Section>

      <Section title="8. Intellectual property">
        <P>
          All intellectual property in {PRODUCT} — including but not limited to source code, design
          systems, AI prompt architectures, database schemas, business logic, trade secrets,
          trademarks, and all derivative works — is the exclusive property of {COMPANY}. Nothing
          in these Terms grants you any right, title, or licence to any part of the Platform itself.
        </P>
        <P>
          You retain full ownership of: (a) content you upload to the Platform; and (b) proposals,
          documents, floor plans, and visual outputs you generate using the Platform.
        </P>
        <P>
          You grant us a limited, non-exclusive licence to store, process, and transmit your content
          solely for the purpose of delivering the Service to you. This licence terminates when you
          delete your account.
        </P>
        <P>
          "Kunjara OS™" and the Kunjara mark are trademarks of {COMPANY}. You may not use them
          without our prior written consent.
        </P>
      </Section>

      <Section title="9. Privacy and data">
        <P>
          Your use of the Service is governed by our{" "}
          <a href="/privacy" style={linkStyle}>Privacy Policy</a>, which is incorporated into these Terms
          by reference. By using the Platform you consent to the collection and use of your data as
          described therein.
        </P>
      </Section>

      <Section title="10. Limitation of liability">
        <P>
          To the maximum extent permitted by applicable Indian law:
        </P>
        <Bullets items={[
          "The Company shall not be liable for any indirect, incidental, special, consequential, punitive, or exemplary damages, including but not limited to loss of profit, revenue, data, goodwill, or business opportunity.",
          "The Company shall not be liable for errors, inaccuracies, or omissions in AI-generated content.",
          "The Company shall not be liable for service interruptions, data loss, or downtime caused by third-party providers (including OpenAI, Razorpay, Supabase, or Vercel).",
          "The Company shall not be liable for any loss arising from your reliance on AI outputs shared with clients without your own review and verification.",
          "Our total aggregate liability to you in any 12-month period shall not exceed the total amount you paid us during that same 12-month period.",
        ]} />
      </Section>

      <Section title="11. Disclaimer of warranties">
        <P>
          The Platform is provided on an "as is" and "as available" basis. The Company expressly
          disclaims all warranties, express or implied, including but not limited to implied warranties
          of merchantability, fitness for a particular purpose, and non-infringement. We do not
          warrant that the Platform will be error-free, secure, or continuously available.
        </P>
      </Section>

      <Section title="12. Termination">
        <P>
          We may suspend or terminate your account immediately and without notice if:
        </P>
        <Bullets items={[
          "You materially breach any provision of these Terms.",
          "We detect fraud, abuse, payment chargebacks made in bad faith, or misuse of the credit system.",
          "You engage in any activity that harms the Platform, other users, or third parties.",
          "You violate any applicable law or regulation.",
          "Your payment method fails and remains unresolved after our retry period.",
        ]} />
        <P>
          You may terminate your account at any time via Settings → Account → Delete Account,
          or by emailing {SUPPORT}. Upon termination, all your data is deleted in accordance with our
          Privacy Policy. No refund of remaining credits or subscription fees is provided upon
          voluntary termination.
        </P>
        <P>
          Provisions of these Terms that by their nature should survive termination (including
          intellectual property, liability, dispute resolution, and governing law) shall so survive.
        </P>
      </Section>

      <Section title="13. Dispute resolution">
        <P>
          In the event of a dispute, you agree to first contact us at {LEGAL} and allow us 30 days
          to attempt an informal resolution. If the dispute cannot be resolved informally, it shall
          be submitted to binding arbitration under the Arbitration and Conciliation Act, 1996
          (India), with the seat of arbitration in Mumbai, Maharashtra. The language of arbitration
          shall be English.
        </P>
        <P>
          Notwithstanding the above, the Company may seek injunctive or other equitable relief from
          any court of competent jurisdiction to protect its intellectual property rights.
        </P>
      </Section>

      <Section title="14. Governing law and jurisdiction">
        <P>
          These Terms are governed by and construed in accordance with the laws of the Republic of
          India, without regard to conflict of laws principles. Subject to the arbitration clause
          above, all disputes shall be subject to the exclusive jurisdiction of the courts in
          Mumbai, Maharashtra, India.
        </P>
      </Section>

      <Section title="15. Modifications">
        <P>
          We reserve the right to modify these Terms at any time. Material changes will be
          communicated by email to the address associated with your account at least 14 days before
          taking effect. The updated Terms will always be available at kunjaraos.com/terms.
          Continued use of the Platform after changes take effect constitutes your acceptance.
        </P>
      </Section>

      <Section title="16. Severability and entire agreement">
        <P>
          If any provision of these Terms is held to be unenforceable, that provision shall be
          modified to the minimum extent necessary to make it enforceable, and the remaining
          provisions shall remain in full force and effect. These Terms, together with our Privacy
          Policy, Refund Policy, and Credit Usage Policy, constitute the entire agreement between
          you and {COMPANY} with respect to the Platform.
        </P>
      </Section>

      <Section title="17. Contact">
        <P>
          General support: <a href={"mailto:" + SUPPORT} style={linkStyle}>{SUPPORT}</a><br />
          Legal notices: <a href={"mailto:" + LEGAL} style={linkStyle}>{LEGAL}</a>
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

const linkStyle: React.CSSProperties = { color: "var(--accent)", textDecoration: "none" };
const prose:   React.CSSProperties  = { maxWidth: 680 };
const eyebrow: React.CSSProperties  = { fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 12 };
const h1:      React.CSSProperties  = { fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.2, color: "var(--text-1)", marginBottom: 8, marginTop: 0 };
const meta:    React.CSSProperties  = { fontSize: 12, color: "var(--text-3)", marginBottom: 24 };
const lead:    React.CSSProperties  = { fontSize: 15, lineHeight: 1.7, color: "var(--text-2)", marginBottom: 8, borderLeft: "3px solid var(--accent)", paddingLeft: 16 };
const h2:      React.CSSProperties  = { fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginTop: 0, marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid var(--border)" };
const p:       React.CSSProperties  = { fontSize: 14, lineHeight: 1.7, color: "var(--text-2)", marginBottom: 10 };
