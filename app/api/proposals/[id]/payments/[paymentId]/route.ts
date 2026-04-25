import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { parseJson, parseParams } from "@/lib/validate";
import { rowToPayment, type ProposalPaymentRow } from "@/lib/payments";

const ParamsSchema = z.object({
  id:        z.string().uuid(),
  paymentId: z.string().uuid(),
});

const PatchBodySchema = z.object({
  status:       z.enum(["REQUESTED", "PAID", "CONFIRMED", "CANCELLED"]).optional(),
  plannerNotes: z.string().trim().max(2000).optional(),
}).refine((v) => Object.keys(v).length > 0, { message: "Provide at least one field to update." });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const rawParams = await params;
  const parsedParams = parseParams(rawParams, ParamsSchema);
  if (parsedParams.error) return parsedParams.error;

  const parsedBody = await parseJson(req, PatchBodySchema);
  if (parsedBody.error) return parsedBody.error;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsedBody.data.status) {
    update.status = parsedBody.data.status;
    if (parsedBody.data.status === "CONFIRMED") update.confirmed_at = new Date().toISOString();
  }
  if (parsedBody.data.plannerNotes !== undefined) {
    update.planner_notes = parsedBody.data.plannerNotes;
  }

  const { data, error } = await supabase
    .from("proposal_payments")
    .update(update)
    .eq("id", parsedParams.data.paymentId)
    .eq("proposal_id", parsedParams.data.id)
    .eq("user_id", auth.user.id)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  }
  return NextResponse.json(rowToPayment(data as ProposalPaymentRow));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const rawParams = await params;
  const parsed = parseParams(rawParams, ParamsSchema);
  if (parsed.error) return parsed.error;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const { error } = await supabase
    .from("proposal_payments")
    .delete()
    .eq("id", parsed.data.paymentId)
    .eq("proposal_id", parsed.data.id)
    .eq("user_id", auth.user.id);

  if (error) {
    return NextResponse.json({ error: "Could not delete payment request." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
