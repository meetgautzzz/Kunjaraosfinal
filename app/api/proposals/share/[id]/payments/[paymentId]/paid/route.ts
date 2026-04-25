import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminClient } from "@/lib/supabase/admin";
import { parseJson, parseParams } from "@/lib/validate";
import { apiLimiter, limit } from "@/lib/ratelimit";
import {
  sendEmail, getPlannerEmail, getOriginFromRequest, tmplPaymentPaid,
} from "@/lib/email";
import { formatINR } from "@/lib/proposals";
import { isMissingTableError } from "@/lib/payments";

const ParamsSchema = z.object({
  id:        z.string().uuid(),
  paymentId: z.string().uuid(),
});

const BodySchema = z.object({
  payerName:      z.string().trim().min(1).max(120),
  payerReference: z.string().trim().min(1).max(120), // UTR / txn id
  payerNote:      z.string().trim().max(1000).optional().default(""),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  const rawParams = await params;
  const parsedParams = parseParams(rawParams, ParamsSchema);
  if (parsedParams.error) return parsedParams.error;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  const rl = await limit(apiLimiter, `share-paid:${ip}`);
  if (rl) return rl;

  const parsedBody = await parseJson(req, BodySchema);
  if (parsedBody.error) return parsedBody.error;

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
  }

  // Only allow marking REQUESTED → PAID. Already-paid or already-confirmed
  // rows get a 409 so the share link can't be used to overwrite history.
  const { data: existing, error: readErr } = await admin
    .from("proposal_payments")
    .select("id, status, proposal_id, user_id, amount")
    .eq("id", parsedParams.data.paymentId)
    .eq("proposal_id", parsedParams.data.id)
    .single();

  if (readErr || !existing) {
    if (isMissingTableError(readErr)) {
      return NextResponse.json({ error: "Payments unavailable." }, { status: 503 });
    }
    return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  }
  if (existing.status !== "REQUESTED") {
    return NextResponse.json(
      { error: "This payment is no longer accepting submissions." },
      { status: 409 }
    );
  }

  const { error: writeErr } = await admin
    .from("proposal_payments")
    .update({
      status:          "PAID",
      payer_name:      parsedBody.data.payerName,
      payer_reference: parsedBody.data.payerReference,
      payer_note:      parsedBody.data.payerNote,
      submitted_at:    new Date().toISOString(),
      updated_at:      new Date().toISOString(),
    })
    .eq("id", parsedParams.data.paymentId);

  if (writeErr) {
    if (isMissingTableError(writeErr)) {
      return NextResponse.json({ error: "Payments unavailable." }, { status: 503 });
    }
    console.error("[share/paid] write failed:", writeErr.message);
    return NextResponse.json({ error: "Could not record payment." }, { status: 500 });
  }

  void notifyPlanner({
    admin,
    plannerId:     existing.user_id as string,
    proposalId:    parsedParams.data.id,
    payerName:     parsedBody.data.payerName,
    payerRef:      parsedBody.data.payerReference,
    amount:        existing.amount as number,
    origin:        getOriginFromRequest(req),
  });

  return NextResponse.json({ ok: true });
}

async function notifyPlanner(args: {
  admin: any;
  plannerId: string;
  proposalId: string;
  payerName: string;
  payerRef: string;
  amount: number;
  origin: string;
}) {
  try {
    const to = await getPlannerEmail(args.plannerId);
    if (!to) return;
    const { data: prop } = await args.admin
      .from("proposals")
      .select("data")
      .eq("id", args.proposalId)
      .single();
    const proposalTitle = (prop?.data as { title?: string } | null)?.title || "Untitled proposal";
    const link = `${args.origin}/proposals/${args.proposalId}`;
    const tmpl = tmplPaymentPaid({
      payerName:    args.payerName,
      reference:    args.payerRef,
      amount:       formatINR(args.amount),
      proposalTitle,
      link,
    });
    await sendEmail({ to, subject: tmpl.subject, html: tmpl.html });
  } catch (err) {
    console.error("[share/paid] notify failed:", err);
  }
}
