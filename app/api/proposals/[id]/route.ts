import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseJson, parseParams } from "@/lib/validate";
import { apiLimiter, limit } from "@/lib/ratelimit";
import { saveExample } from "@/lib/ai/examples";

const ParamsSchema = z.object({ id: z.string().uuid() });

// Editable fields on a proposal. Anything not listed here is rejected
// — clients cannot overwrite owner, id, timestamps, or the originalBrief.
// passthrough() so optional jsonb sub-objects (concept, timeline, vendors,
// etc.) survive validation without us having to mirror their shapes here.
const PatchSchema = z.object({
  title:              z.string().trim().max(300).optional(),
  status:             z.enum(["DRAFT","GENERATED","SAVED","SENT","SHARED","APPROVED","CHANGES_REQUESTED","LOST"]).optional(),
  concept:            z.unknown().optional(),
  budgetBreakdown:    z.unknown().optional(),
  timeline:           z.unknown().optional(),
  vendors:            z.unknown().optional(),
  riskFlags:          z.unknown().optional(),
  tips:               z.unknown().optional(),
  eventConcept:       z.unknown().optional(),
  visualDirection:    z.unknown().optional(),
  stageDesign:        z.unknown().optional(),
  decorPlan:          z.unknown().optional(),
  experienceElements: z.unknown().optional(),
  compliance:         z.unknown().optional(),
  isLocked:                  z.boolean().optional(),
  proposal_ready_for_client: z.boolean().optional(),
}).strict();

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rawParams = await params;
  const parsed = parseParams(rawParams, ParamsSchema);
  if (parsed.error) return parsed.error;
  const { id } = parsed.data;

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

  const { data, error } = await supabase
    .from("proposals")
    .select("id, data")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  }

  return NextResponse.json({
    ...(data.data as Record<string, unknown>),
    id: data.id,
  });
}

// Partial update — merges the validated patch into proposals.data (jsonb)
// while leaving id, user_id, originalBrief, versions, regenerationsUsed,
// and timestamps untouched.
export async function PATCH(
  req:  NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rawParams = await params;
  const parsedParams = parseParams(rawParams, ParamsSchema);
  if (parsedParams.error) return parsedParams.error;

  const parsedBody = await parseJson(req, PatchSchema);
  if (parsedBody.error) return parsedBody.error;

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

  // Read-modify-write under user_id scope so an attacker can't PATCH
  // someone else's proposal even with a guessed id (RLS enforces this
  // too, but we double-check at the route boundary).
  const { data: row, error: readErr } = await supabase
    .from("proposals")
    .select("data")
    .eq("id", parsedParams.data.id)
    .eq("user_id", user.id)
    .single();

  if (readErr || !row) {
    return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  }

  const current = (row.data ?? {}) as Record<string, unknown>;
  const updatedAt = new Date().toISOString();
  const next = { ...current, ...parsedBody.data, updatedAt };

  const { error: writeErr } = await supabase
    .from("proposals")
    .update({ data: next, updated_at: updatedAt })
    .eq("id", parsedParams.data.id)
    .eq("user_id", user.id);

  if (writeErr) {
    console.error("[proposals/PATCH] write failed:", writeErr.message);
    return NextResponse.json({ error: "Could not save." }, { status: 500 });
  }

  // Promote to few-shot example pool when a planner approves or shares a proposal.
  const newStatus = parsedBody.data.status;
  if (newStatus === "APPROVED" || newStatus === "SHARED" || newStatus === "SAVED") {
    const p = next as Record<string, unknown>;
    const eventType = p.eventType as string | undefined;
    const budget    = Number(p.budget ?? 0);
    if (eventType && budget > 0 && p.originalBrief) {
      saveExample({
        eventType,
        budget,
        location:        (p.location as string) ?? "",
        originalBrief:   p.originalBrief as Record<string, unknown>,
        generatedOutput: p as Record<string, unknown>,
      }).catch(() => {});
    }
  }

  return NextResponse.json({ success: true, id: parsedParams.data.id, updatedAt });
}

export async function DELETE(
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

  const { error } = await supabase
    .from("proposals")
    .delete()
    .eq("id", parsedParams.data.id)
    .eq("user_id", user.id);

  if (error) {
    console.error("[proposals/DELETE] failed:", error.message);
    return NextResponse.json({ error: "Could not delete." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
