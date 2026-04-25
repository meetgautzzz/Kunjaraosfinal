import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseJson, parseParams } from "@/lib/validate";
import { apiLimiter, limit } from "@/lib/ratelimit";
import type { ProposalData, ProposalVersionSnapshot } from "@/lib/proposals";

const ParamsSchema = z.object({ id: z.string().uuid() });
const BodySchema   = z.object({ label: z.string().regex(/^v\d+$/) });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const rl = await limit(apiLimiter, `user:${user.id}`);
  if (rl) return rl;

  const rawParams = await params;
  const parsedParams = parseParams(rawParams, ParamsSchema);
  if (parsedParams.error) return parsedParams.error;

  const parsedBody = await parseJson(req, BodySchema);
  if (parsedBody.error) return parsedBody.error;
  const { label } = parsedBody.data;

  const { data: row, error: readErr } = await supabase
    .from("proposals")
    .select("data")
    .eq("id", parsedParams.data.id)
    .eq("user_id", user.id)
    .single();
  if (readErr || !row) return NextResponse.json({ error: "Proposal not found." }, { status: 404 });

  const current = row.data as ProposalData;
  if (label === current.activeVersionLabel) {
    return NextResponse.json(current); // no-op
  }

  const versions = current.versions ?? [];
  const targetIdx = versions.findIndex((v) => v.label === label);
  if (targetIdx < 0) {
    return NextResponse.json({ error: `Version ${label} not found.` }, { status: 404 });
  }
  const target = versions[targetIdx];

  // Archive the currently-active payload and slot the chosen version into
  // the active position. Versions array stays the same length — just swap.
  const archivedActive: ProposalVersionSnapshot = {
    label:              current.activeVersionLabel ?? `v${versions.length + 1}`,
    createdAt:          current.updatedAt ?? new Date().toISOString(),
    title:              current.title,
    concept:            current.concept,
    budgetBreakdown:    current.budgetBreakdown,
    timeline:           current.timeline,
    vendors:            current.vendors,
    riskFlags:          current.riskFlags,
    tips:               current.tips,
    eventConcept:       current.eventConcept,
    visualDirection:    current.visualDirection,
    stageDesign:        current.stageDesign,
    decorPlan:          current.decorPlan,
    experienceElements: current.experienceElements,
  };

  const nextVersions = versions.slice();
  nextVersions[targetIdx] = archivedActive;

  const next: ProposalData = {
    ...current,
    title:              target.title,
    concept:            target.concept,
    budgetBreakdown:    target.budgetBreakdown,
    timeline:           target.timeline,
    vendors:            target.vendors,
    riskFlags:          target.riskFlags,
    tips:               target.tips,
    eventConcept:       target.eventConcept,
    visualDirection:    target.visualDirection,
    stageDesign:        target.stageDesign,
    decorPlan:          target.decorPlan,
    experienceElements: target.experienceElements,
    versions:           nextVersions,
    activeVersionLabel: target.label,
    updatedAt:          new Date().toISOString(),
  };

  const { error: writeErr } = await supabase
    .from("proposals")
    .update({ data: next, updated_at: next.updatedAt })
    .eq("id", parsedParams.data.id);

  if (writeErr) {
    return NextResponse.json({ error: "Could not switch version." }, { status: 500 });
  }
  return NextResponse.json(next);
}
