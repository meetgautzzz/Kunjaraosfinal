import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { parseJson, parseParams } from "@/lib/validate";
import {
  rowToPayment, isMissingTableError, PAYMENT_TABLE_MISSING_MESSAGE,
  type ProposalPaymentRow,
} from "@/lib/payments";

const ParamsSchema = z.object({ id: z.string().uuid() });

const CreateBodySchema = z.object({
  amount:        z.number().int().positive().max(100_000_000),
  description:   z.string().trim().max(500).optional().default(""),
  dueDate:       z.string().datetime().nullable().optional().default(null),
  method:        z.enum(["UPI", "BANK"]),
  paymentTarget: z.string().trim().min(1).max(500),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const rawParams = await params;
  const parsed = parseParams(rawParams, ParamsSchema);
  if (parsed.error) return parsed.error;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const { data, error } = await supabase
    .from("proposal_payments")
    .select("*")
    .eq("proposal_id", parsed.data.id)
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error)) {
      console.error("[payments] table missing — apply the proposal_payments migration");
      return NextResponse.json({ error: PAYMENT_TABLE_MISSING_MESSAGE }, { status: 503 });
    }
    return NextResponse.json({ error: "Could not load payments." }, { status: 500 });
  }
  return NextResponse.json(((data ?? []) as ProposalPaymentRow[]).map(rowToPayment));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const rawParams = await params;
  const parsedParams = parseParams(rawParams, ParamsSchema);
  if (parsedParams.error) return parsedParams.error;

  const parsedBody = await parseJson(req, CreateBodySchema);
  if (parsedBody.error) return parsedBody.error;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  // Ensure the proposal belongs to this user (RLS would also block, but a
  // clean 404 is friendlier than a constraint failure).
  const { data: proposal } = await supabase
    .from("proposals")
    .select("id")
    .eq("id", parsedParams.data.id)
    .eq("user_id", auth.user.id)
    .single();
  if (!proposal) return NextResponse.json({ error: "Proposal not found." }, { status: 404 });

  const { data, error } = await supabase
    .from("proposal_payments")
    .insert({
      proposal_id:    parsedParams.data.id,
      user_id:        auth.user.id,
      amount:         parsedBody.data.amount,
      description:    parsedBody.data.description,
      due_date:       parsedBody.data.dueDate,
      method:         parsedBody.data.method,
      payment_target: parsedBody.data.paymentTarget,
      status:         "REQUESTED",
    })
    .select("*")
    .single();

  if (error || !data) {
    if (isMissingTableError(error)) {
      console.error("[payments] table missing — apply the proposal_payments migration");
      return NextResponse.json({ error: PAYMENT_TABLE_MISSING_MESSAGE }, { status: 503 });
    }
    console.error("[payments] insert failed:", error?.message);
    return NextResponse.json({ error: "Could not create payment request." }, { status: 500 });
  }
  return NextResponse.json(rowToPayment(data as ProposalPaymentRow), { status: 201 });
}
