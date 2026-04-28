import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseParams } from "@/lib/validate";
import { apiLimiter, limit } from "@/lib/ratelimit";
import type { ProposalData } from "@/lib/proposals";

const ParamsSchema = z.object({ batchId: z.string().uuid() });

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const rawParams = await params;
  const parsed = parseParams(rawParams, ParamsSchema);
  if (parsed.error) return parsed.error;
  const { batchId } = parsed.data;

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const rl = await limit(apiLimiter, `user:${user.id}`);
  if (rl) return rl;

  // Filter by user_id + batchId stored inside the jsonb data column.
  const { data: rows, error } = await supabase
    .from("proposals")
    .select("id, data")
    .eq("user_id", user.id)
    .filter("data->>batchId", "eq", batchId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[proposals/batch] query failed:", error.message);
    return NextResponse.json({ error: "Could not fetch batch." }, { status: 500 });
  }

  const proposals = (rows ?? [])
    .map((r) => ({ ...(r.data as ProposalData), id: r.id }))
    .sort((a, b) => (a.batchIndex ?? 0) - (b.batchIndex ?? 0));

  return NextResponse.json({ batchId, proposals });
}
