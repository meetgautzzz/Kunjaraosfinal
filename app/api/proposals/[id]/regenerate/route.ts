import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseJson, parseParams } from "@/lib/validate";
import { aiLimiter, limit } from "@/lib/ratelimit";
import { checkUsage, incrementUsage } from "@/lib/usage";
import {
  EXPERIENCE_SYSTEM_PROMPT,
  buildExperienceUserMessage,
  sanitizeExperiencePayload,
} from "@/lib/experiencePrompt";
import {
  MAX_REGENERATIONS,
  type ProposalData,
  type ProposalVersionSnapshot,
} from "@/lib/proposals";

const ParamsSchema = z.object({ id: z.string().uuid() });

const BodySchema = z.object({
  // Free-text guidance the user typed in the regen modal.
  guidance: z.string().trim().max(2000).optional().default(""),
  // Optional brief tweaks. If omitted, we replay originalBrief verbatim.
  requirements: z.string().trim().min(1).max(5000).optional(),
  budget:       z.number().positive().max(1_000_000_000).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "AI service not configured." }, { status: 503 });
  }

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const rl = await limit(aiLimiter, `user:${user.id}`);
  if (rl) return rl;

  const rawParams = await params;
  const parsedParams = parseParams(rawParams, ParamsSchema);
  if (parsedParams.error) return parsedParams.error;

  const parsedBody = await parseJson(req, BodySchema);
  if (parsedBody.error) return parsedBody.error;

  const { data: row, error: readErr } = await supabase
    .from("proposals")
    .select("data")
    .eq("id", parsedParams.data.id)
    .eq("user_id", user.id)
    .single();
  if (readErr || !row) return NextResponse.json({ error: "Proposal not found." }, { status: 404 });

  const current = row.data as ProposalData;
  const used = current.regenerationsUsed ?? 0;
  if (used >= MAX_REGENERATIONS) {
    return NextResponse.json(
      { error: `This proposal has reached the ${MAX_REGENERATIONS}-regeneration limit.` },
      { status: 409 }
    );
  }
  if (!current.originalBrief) {
    return NextResponse.json(
      { error: "This proposal cannot be regenerated — original brief is missing." },
      { status: 422 }
    );
  }

  const usage = await checkUsage(user.id);
  if (usage.overage) {
    return NextResponse.json(
      { error: "Plan limit reached. Upgrade to continue.", limit_reached: true },
      { status: 403 }
    );
  }

  // Brief that drives the new generation. originalBrief is the seed; the
  // user can override requirements/budget per-regen, plus add free-text
  // guidance that gets appended to the user message.
  const brief = {
    ...current.originalBrief,
    requirements: parsedBody.data.requirements ?? current.originalBrief.requirements,
    budget:       parsedBody.data.budget       ?? current.originalBrief.budget,
  };

  const userMessage = buildExperienceUserMessage({
    selectedIdea:        brief.selectedIdea,
    eventType:           brief.eventType,
    budget:              brief.budget,
    location:            brief.location,
    requirements:        brief.requirements,
    guestCount:          brief.guestCount,
    clientCompanyName:   brief.clientCompanyName,
    eventDate:           brief.eventDate,
    venueByClient:       brief.venueByClient,
    foodByClient:        brief.foodByClient,
    regenerationGuidance: parsedBody.data.guidance,
  });

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  let response;
  try {
    response = await client.chat.completions.create({
      model:           "gpt-4o",
      temperature:     0.65, // slightly higher than first gen to encourage divergence
      messages: [
        { role: "system", content: EXPERIENCE_SYSTEM_PROMPT },
        { role: "user",   content: userMessage },
      ],
      response_format: { type: "json_object" },
    });
  } catch (aiErr) {
    console.error("[regenerate] OpenAI error:", aiErr);
    return NextResponse.json({ error: "Kunjara Core failed. Try again in a minute." }, { status: 502 });
  }

  const content = response.choices[0]?.message?.content;
  if (!content) return NextResponse.json({ error: "AI returned an empty response." }, { status: 502 });

  let parsed: Partial<ProposalData>;
  try {
    parsed = JSON.parse(content);
  } catch {
    console.error("[regenerate] JSON parse failed; content length:", content.length);
    return NextResponse.json({ error: "AI returned invalid JSON." }, { status: 502 });
  }
  parsed = sanitizeExperiencePayload(parsed);

  await incrementUsage(user.id, usage.events_used);

  // Snapshot the *current* AI payload before overwriting.
  const versions = current.versions ?? [];
  const currentLabel = current.activeVersionLabel ?? `v${versions.length + 1}`;
  const snapshot: ProposalVersionSnapshot = {
    label:              currentLabel,
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

  const nextVersions = [...versions, snapshot];
  const nextRegens   = used + 1;
  const nextLabel    = `v${nextVersions.length + 1}`; // total versions including the new active one

  const next: ProposalData = {
    ...current,
    title:              parsed.title ?? current.title,
    concept:            parsed.concept ?? current.concept,
    budgetBreakdown:    parsed.budgetBreakdown ?? current.budgetBreakdown,
    timeline:           parsed.timeline ?? current.timeline,
    vendors:            parsed.vendors ?? current.vendors,
    riskFlags:          parsed.riskFlags ?? current.riskFlags,
    tips:               parsed.tips ?? current.tips,
    eventConcept:       parsed.eventConcept ?? current.eventConcept,
    visualDirection:    parsed.visualDirection ?? current.visualDirection,
    stageDesign:        parsed.stageDesign ?? current.stageDesign,
    decorPlan:          parsed.decorPlan ?? current.decorPlan,
    experienceElements: parsed.experienceElements ?? current.experienceElements,
    budget:             brief.budget,
    requirements:       brief.requirements,
    versions:           nextVersions,
    regenerationsUsed:  nextRegens,
    activeVersionLabel: nextLabel,
    updatedAt:          new Date().toISOString(),
    status:             "GENERATED",
  };
  // Tag the new active version with the guidance that produced it.
  // Stored on the snapshot when this version is later archived.
  (next as ProposalData & { _pendingGuidance?: string })._pendingGuidance = parsedBody.data.guidance;

  const { error: writeErr } = await supabase
    .from("proposals")
    .update({ data: next, updated_at: next.updatedAt })
    .eq("id", parsedParams.data.id);

  if (writeErr) {
    console.error("[regenerate] write failed:", writeErr.message);
    return NextResponse.json({ error: "Could not save regeneration." }, { status: 500 });
  }

  return NextResponse.json(next);
}
