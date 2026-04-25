import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminClient } from "@/lib/supabase/admin";
import { parseParams } from "@/lib/validate";
import { apiLimiter, limit } from "@/lib/ratelimit";
import {
  rowToPayment, isMissingTableError, PAYMENT_TABLE_MISSING_MESSAGE,
  type ProposalPaymentRow,
} from "@/lib/payments";

const ParamsSchema = z.object({ id: z.string().uuid() });

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rawParams = await params;
  const parsed = parseParams(rawParams, ParamsSchema);
  if (parsed.error) return parsed.error;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  const rl = await limit(apiLimiter, `share-payments:${ip}`);
  if (rl) return rl;

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
  }

  const { data, error } = await admin
    .from("proposal_payments")
    .select("*")
    .eq("proposal_id", parsed.data.id)
    .neq("status", "CANCELLED")
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error)) {
      // Public consumer — keep the message non-technical, but surface 503
      // so the share-page UI knows to hide the payments section.
      return NextResponse.json({ error: "Payments unavailable." }, { status: 503 });
    }
    return NextResponse.json({ error: "Could not load payments." }, { status: 500 });
  }
  // Strip planner_notes — those are internal.
  const sanitized = ((data ?? []) as ProposalPaymentRow[]).map((row) => {
    const p = rowToPayment(row);
    return { ...p, plannerNotes: "" };
  });
  return NextResponse.json(sanitized);
}
