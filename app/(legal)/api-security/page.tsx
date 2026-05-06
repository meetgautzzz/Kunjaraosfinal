import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Security Guidelines · Kunjara OS",
  description: "Security standards, key management rules, and responsible disclosure policy for Kunjara OS APIs.",
};

const EFFECTIVE = "6 May 2026";
const SECURITY  = "security@kunjaraos.com";
const COMPANY   = "Kunjara Technologies";

export default function ApiSecurityPage() {
  return (
    <article style={prose}>
      <p style={eyebrow}>Legal · Security</p>
      <h1 style={h1}>API Security Guidelines</h1>
      <p style={meta}>Effective: {EFFECTIVE} · Version 1.0</p>
      <p style={lead}>
        These guidelines define the security standards that govern how {COMPANY} builds, operates,
        and protects the Kunjara OS API and related infrastructure. They also establish rules for
        authorised developers and partners integrating with our platform, and describe our
        responsible disclosure process for security researchers.
      </p>

      <Section title="1. Authentication and authorisation">
        <P>All access to the Kunjara OS API requires authentication:</P>
        <Bullets items={[
          "User sessions are managed via Supabase JWT tokens with a 1-hour expiry and automatic refresh.",
          "API routes validate session tokens on every request server-side — no client-side trust.",
          "Row-Level Security (RLS) is enforced at the database layer; users can only access their own data regardless of API-layer bugs.",
          "Service-role keys (Supabase admin) are never exposed to the client and never committed to version control.",
          "All privileged operations require a valid authenticated session scoped to the owning user_id.",
          "Failed authentication attempts are rate-limited per IP and per email address.",
        ]} />
      </Section>

      <Section title="2. Secret and key management">
        <Bullets items={[
          "All secrets (OpenAI API keys, Razorpay keys, Supabase service role, Upstash tokens) are stored exclusively as server-side environment variables.",
          "Secrets are never logged, returned in API responses, or interpolated into client-side bundles.",
          "Environment variables are injected by Vercel at build/runtime — never stored in .env files committed to the repository.",
          "Secret rotation is performed immediately upon any suspected exposure. Rotation does not require a code deployment.",
          "Webhooks are verified using HMAC-SHA256 signatures before processing. Raw request bodies are preserved for signature validation.",
          "Any developer or contractor with access to production secrets must acknowledge the NDA & IP Agreement.",
        ]} />
      </Section>

      <Section title="3. Input validation">
        <P>
          All API endpoints validate incoming request bodies using Zod schemas before executing
          any business logic. Validation rules include:
        </P>
        <Bullets items={[
          "String fields: trimmed, maximum length enforced, type coercion disabled.",
          "Numeric fields: parsed and range-checked — no raw user-supplied values are passed to third-party APIs.",
          "Enum fields: validated against an exhaustive allowlist.",
          "File uploads: type and size validated server-side; MIME type sniffing is not relied upon.",
          "SQL injection: not possible — all database access uses Supabase's typed query builder with parameterised queries.",
          "XSS: React escapes all JSX output by default; dangerouslySetInnerHTML is prohibited without a security review.",
        ]} />
      </Section>

      <Section title="4. Rate limiting">
        <P>
          Rate limiting is enforced on all public-facing and authenticated API routes using
          Upstash Redis with a sliding window algorithm:
        </P>
        <Bullets items={[
          "AI generation endpoints: 10 requests per user per minute.",
          "Authentication endpoints (login, signup, reset): 5 requests per IP per 15 minutes.",
          "General API endpoints: 60 requests per user per minute.",
          "Public endpoints (room share link, public proposal view): 30 requests per IP per minute.",
          "Webhook endpoints: verified by signature before rate limit check — signature failures return 401 without rate limit consumption.",
          "Accounts exceeding limits repeatedly are flagged for manual review.",
        ]} />
      </Section>

      <Section title="5. Data in transit and at rest">
        <Bullets items={[
          "All traffic is encrypted in transit using TLS 1.2+ enforced by Vercel's edge network.",
          "HTTPS is mandatory — HTTP requests are redirected to HTTPS at the edge.",
          "Data at rest is encrypted by Supabase (AES-256) at the storage layer.",
          "AI-generated images returned as base64 data URIs are stored in Supabase JSONB columns — not in public blob storage — to prevent unauthorised URL access.",
          "Payment data (card numbers, UPI handles) is never stored by us; it is tokenised by Razorpay.",
          "Personally identifiable information (email, name) is stored only in the Supabase auth schema with access restricted to service-role operations.",
        ]} />
      </Section>

      <Section title="6. Third-party dependency security">
        <Bullets items={[
          "Dependencies are pinned to specific minor versions in package.json to prevent unexpected breaking changes.",
          "Dependabot (or equivalent) alerts are reviewed weekly.",
          "Third-party AI providers (OpenAI) receive only the minimum data necessary to fulfil the generation request — no user PII is sent unless explicitly part of the prompt submitted by the user.",
          "Razorpay webhook payloads are verified using the Razorpay SDK's built-in signature validation before any order state is updated.",
          "Supabase is hosted in a region compliant with applicable data localisation requirements.",
        ]} />
      </Section>

      <Section title="7. Logging and monitoring">
        <Bullets items={[
          "Server-side API errors are logged with request metadata (route, method, status code, timestamp) but without request bodies that may contain sensitive data.",
          "Logs do not contain API keys, passwords, card numbers, or user PII beyond anonymised identifiers.",
          "Unusual patterns (spike in 4xx/5xx errors, abnormal credit consumption) trigger alerts for manual review.",
          "Vercel runtime logs are retained for 30 days and access is restricted to authorised engineers.",
        ]} />
      </Section>

      <Section title="8. Prohibited API usage">
        <P>The following are strictly prohibited and will result in immediate account termination:</P>
        <Bullets items={[
          "Automated scripted access to AI generation endpoints at a rate exceeding published rate limits.",
          "Attempting to extract, scrape, or systematically collect AI model outputs for training competing models.",
          "Probing, fuzzing, or attempting to exploit API endpoints without written authorisation from the Company.",
          "Attempting to access data belonging to other users by manipulating request parameters (IDOR attacks).",
          "Using the API to relay requests to third-party services in a way that bypasses our content moderation.",
          "Reselling API access or API-generated outputs as a white-label service without a signed commercial agreement.",
        ]} />
      </Section>

      <Section title="9. Responsible disclosure">
        <P>
          We take security seriously and welcome reports from security researchers. If you
          discover a vulnerability in the Kunjara OS platform, please disclose it responsibly:
        </P>
        <Bullets items={[
          "Email a detailed description of the vulnerability to security@kunjaraos.com with subject line \"Security Disclosure\".",
          "Include the affected endpoint or component, steps to reproduce, potential impact, and any proof-of-concept (non-destructive).",
          "Do not access, modify, or delete any data belonging to other users in the course of your research.",
          "Do not disclose the vulnerability publicly until we have acknowledged receipt and had a reasonable time (typically 30 days) to patch it.",
          "We will acknowledge receipt within 3 business days and provide a remediation timeline.",
          "We do not currently operate a paid bug bounty programme, but we will publicly credit researchers who report valid issues (with their consent).",
        ]} />
        <P>
          Report vulnerabilities to: <A href={`mailto:${SECURITY}`}>{SECURITY}</A>
        </P>
      </Section>

      <Section title="10. Contact">
        <P>
          Security disclosures: <A href={`mailto:${SECURITY}`}>{SECURITY}</A><br />
          General legal queries: <A href="mailto:legal@kunjaraos.com">legal@kunjaraos.com</A>
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
