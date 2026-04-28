import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { parseParams } from "@/lib/validate";
import { apiLimiter, limit } from "@/lib/ratelimit";
import type { ProposalData } from "@/lib/proposals";

const ParamsSchema = z.object({ id: z.string().uuid() });

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rawParams = await params;
  const parsedParams = parseParams(rawParams, ParamsSchema);
  if (parsedParams.error) return parsedParams.error;

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

  const { data: row, error: readErr } = await supabase
    .from("proposals")
    .select("data")
    .eq("id", parsedParams.data.id)
    .eq("user_id", user.id)
    .single();

  if (readErr || !row) {
    return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  }

  const source = (row.data ?? {}) as ProposalData;
  const now    = new Date().toISOString();
  const newId  = randomUUID();

  // Strip per-instance metadata so the duplicate starts fresh.
  const duplicateData: ProposalData = {
    ...source,
    id:                 newId,
    status:             "DRAFT",
    title:              `${source.title} (copy)`,
    createdAt:          now,
    updatedAt:          now,
    versions:           [],
    regenerationsUsed:  0,
    activeVersionLabel: "v1",
    clientResponse:     undefined,
    // Remove batch linkage — the copy is an independent document.
    batchId:            undefined,
    batchIndex:         undefined,
    isLocked:           undefined,
  };

  const { error: writeErr } = await supabase
    .from("proposals")
    .insert({ id: newId, user_id: user.id, data: duplicateData });

  if (writeErr) {
    console.error("[proposals/duplicate] insert failed:", writeErr.message);
    return NextResponse.json({ error: "Could not duplicate proposal." }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: newId });
}
