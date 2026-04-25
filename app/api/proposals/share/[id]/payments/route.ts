import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { parseParams } from "@/lib/validate";
import { apiLimiter, limit } from "@/lib/ratelimit";
import { rowToPayment, type ProposalPaymentRow } from "@/lib/payments";

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

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
  }
  const admin = createSupabaseAdmin(url, serviceKey);

  const { data, error } = await admin
    .from("proposal_payments")
    .select("*")
    .eq("proposal_id", parsed.data.id)
    .neq("status", "CANCELLED")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Could not load payments." }, { status: 500 });
  }
  // Strip planner_notes — those are internal.
  const sanitized = ((data ?? []) as ProposalPaymentRow[]).map((row) => {
    const p = rowToPayment(row);
    return { ...p, plannerNotes: "" };
  });
  return NextResponse.json(sanitized);
}
