// Provider-agnostic email sender. Currently wired to Resend's HTTP API
// (no SDK dependency — keeps deploys lean). Fail-open: if RESEND_API_KEY
// is missing, we warn once and return false so the calling route still
// succeeds. Email is a side-channel; never block the user response on it.

type SendArgs = {
  to:      string;
  subject: string;
  html:    string;
  text?:   string;
};

const FROM_FALLBACK = "Kunjara OS <onboarding@resend.dev>";

export async function sendEmail({ to, subject, html, text }: SendArgs): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — skipping send to", to);
    return false;
  }
  const from = process.env.EMAIL_FROM || FROM_FALLBACK;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({ from, to, subject, html, text }),
    });
    if (!r.ok) {
      const body = await r.text().catch(() => "");
      console.error("[email] send failed:", r.status, body.slice(0, 200));
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] send threw:", err);
    return false;
  }
}

// Look up a planner's email by user_id using the service-role admin client.
// The public share endpoints don't have a session, so they cannot use the
// session-scoped Supabase client to read auth.users.
import { getAdminClient } from "@/lib/supabase/admin";
export async function getPlannerEmail(userId: string): Promise<string | null> {
  const admin = getAdminClient();
  if (!admin) return null;
  try {
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error || !data?.user?.email) return null;
    return data.user.email;
  } catch (err) {
    console.error("[email] getPlannerEmail threw:", err);
    return null;
  }
}

// ── Templates ────────────────────────────────────────────────────────────────
// Inline styles only — most email clients strip <style>.

const SHELL = (body: string) => `
<!doctype html>
<html><body style="margin:0;padding:0;background:#f6f5f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f5f3;padding:32px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;border:1px solid #e8e6e1;overflow:hidden;">
      <tr><td style="padding:24px 28px 0;">
        <div style="font-size:11px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:#9b8c6e;">Kunjara OS</div>
      </td></tr>
      ${body}
      <tr><td style="padding:18px 28px 24px;border-top:1px solid #f0eee9;color:#9b8c6e;font-size:11px;">
        Sent automatically by Kunjara OS · You can reply directly to your client from inside the proposal.
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>
`;

export function tmplProposalApproved(args: {
  clientName: string;
  proposalTitle: string;
  comment: string;
  link: string;
}) {
  const note = args.comment
    ? `<p style="margin:18px 0 0;padding:14px 16px;background:#f0fdf4;border-left:3px solid #16a34a;color:#15803d;font-size:14px;font-style:italic;">"${escapeHtml(args.comment)}"</p>`
    : "";
  const body = `
    <tr><td style="padding:14px 28px 0;">
      <h1 style="margin:0;font-size:22px;color:#0f172a;letter-spacing:-0.01em;">✓ Proposal approved</h1>
      <p style="margin:10px 0 0;color:#475569;font-size:15px;line-height:1.55;">
        <strong>${escapeHtml(args.clientName)}</strong> has approved <strong>${escapeHtml(args.proposalTitle)}</strong>.
      </p>
      ${note}
      <div style="margin:24px 0 6px;">
        <a href="${args.link}" style="display:inline-block;padding:10px 18px;background:#4f46e5;color:#ffffff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">Open proposal</a>
      </div>
    </td></tr>`;
  return { subject: `✓ ${args.clientName} approved "${args.proposalTitle}"`, html: SHELL(body) };
}

export function tmplProposalChangesRequested(args: {
  clientName: string;
  proposalTitle: string;
  comment: string;
  link: string;
}) {
  const note = `<p style="margin:18px 0 0;padding:14px 16px;background:#fef3c7;border-left:3px solid #f59e0b;color:#92400e;font-size:14px;font-style:italic;">"${escapeHtml(args.comment || "(no note)")}"</p>`;
  const body = `
    <tr><td style="padding:14px 28px 0;">
      <h1 style="margin:0;font-size:22px;color:#0f172a;letter-spacing:-0.01em;">Changes requested</h1>
      <p style="margin:10px 0 0;color:#475569;font-size:15px;line-height:1.55;">
        <strong>${escapeHtml(args.clientName)}</strong> wants edits to <strong>${escapeHtml(args.proposalTitle)}</strong>.
      </p>
      ${note}
      <div style="margin:24px 0 6px;">
        <a href="${args.link}" style="display:inline-block;padding:10px 18px;background:#0f172a;color:#ffffff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">Review feedback</a>
      </div>
    </td></tr>`;
  return { subject: `Changes requested — ${args.proposalTitle}`, html: SHELL(body) };
}

export function tmplPaymentPaid(args: {
  payerName: string;
  amount: string;
  reference: string;
  proposalTitle: string;
  link: string;
}) {
  const body = `
    <tr><td style="padding:14px 28px 0;">
      <h1 style="margin:0;font-size:22px;color:#0f172a;letter-spacing:-0.01em;">Client says they've paid</h1>
      <p style="margin:10px 0 0;color:#475569;font-size:15px;line-height:1.55;">
        <strong>${escapeHtml(args.payerName)}</strong> just submitted a payment for
        <strong>${escapeHtml(args.proposalTitle)}</strong>.
      </p>
      <table style="margin:18px 0 0;width:100%;border-collapse:collapse;background:#f8fafc;border-radius:10px;">
        <tr>
          <td style="padding:14px 16px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:.08em;">Amount</td>
          <td style="padding:14px 16px;color:#0f172a;font-size:18px;font-weight:700;text-align:right;">${escapeHtml(args.amount)}</td>
        </tr>
        <tr>
          <td style="padding:0 16px 14px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:.08em;">UTR / Reference</td>
          <td style="padding:0 16px 14px;color:#0f172a;font-family:Menlo,monospace;font-size:14px;text-align:right;">${escapeHtml(args.reference)}</td>
        </tr>
      </table>
      <p style="margin:16px 0 0;color:#94a3b8;font-size:13px;line-height:1.5;">
        Verify this UTR appears in your bank statement, then confirm receipt inside the proposal.
      </p>
      <div style="margin:22px 0 6px;">
        <a href="${args.link}" style="display:inline-block;padding:10px 18px;background:#16a34a;color:#ffffff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">Confirm payment</a>
      </div>
    </td></tr>`;
  return { subject: `${args.payerName} marked ${args.amount} as paid`, html: SHELL(body) };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function getOriginFromRequest(req: Request): string {
  // Trust x-forwarded-host first (Vercel), then host header.
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host  = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "www.kunjaraos.com";
  return `${proto}://${host}`;
}
