import { NextRequest } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseJson, parseParams } from "@/lib/validate";
import { requireAiCredits } from "@/lib/ai/middleware";
import { aiError, aiSuccess } from "@/lib/ai/responses";
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
  guidance:     z.string().trim().max(2000).optional().default(""),
  requirements: z.string().trim().min(1).max(5000).optional(),
  budget:       z.number().positive().max(1_000_000_000).optional(),
});

// Per-event edit cap. Even with the per-proposal MAX_REGENERATIONS hard
// stop, this defends against a planner spamming concept regens by hitting
// /regenerate from the API. Tracked via ai_usage_logs (action='edit').
const EDIT_LIMIT_PER_EVENT = MAX_REGENERATIONS;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!process.env.OPENAI_API_KEY) {
    return aiError("SERVICE_UNAVAILABLE", "AI service not configured.", 503);
  }

  const rawParams = await params;
  const parsedParams = parseParams(rawParams, ParamsSchema);
  if (parsedParams.error) return aiError("VALIDATION_ERROR", "Invalid request.", 400);

  const parsedBody = await parseJson(req, BodySchema);
  if (parsedBody.error) return aiError("VALIDATION_ERROR", "Invalid request.", 400);

  // Read the proposal first (needs user session) to check the per-proposal
  // 5-regen cap before consuming credits. This is intentionally outside the
  // requireAiCredits flow so we don't deduct, fail the cap check, and then
  // need to refund — that would still log a wasted "error" entry.
  const supabase = await createClient();
  if (!supabase) return aiError("SERVICE_UNAVAILABLE", "Service unavailable.", 503);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return aiError("UNAUTHORIZED", "Unauthorized.", 401);

  const { data: row, error: readErr } = await supabase
    .from("proposals")
    .select("data")
    .eq("id", parsedParams.data.id)
    .eq("user_id", user.id)
    .single();
  if (readErr || !row) {
    return aiError("VALIDATION_ERROR", "Proposal not found.", 404);
  }

  const current = row.data as ProposalData;
  const used = current.regenerationsUsed ?? 0;
  if (used >= MAX_REGENERATIONS) {
    return aiError("EDIT_LIMIT", `This proposal has reached the ${MAX_REGENERATIONS}-regeneration limit.`, 409, {
      edits_used: used,
      edit_limit: MAX_REGENERATIONS,
    });
  }
  if (!current.originalBrief) {
    return aiError("VALIDATION_ERROR", "This proposal cannot be regenerated — original brief is missing.", 422);
  }

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

  // Now run the standard pre-flight (auth re-resolved, rate limit, atomic
  // credit consume). Edit is the cheap-tier action.
  const pre = await requireAiCredits({
    req,
    action:       "edit",
    promptLength: userMessage.length,
    eventId:      parsedParams.data.id,
    editLimit:    EDIT_LIMIT_PER_EVENT,
  });
  if (!pre.ok) return pre.res;
  const { ctx } = pre;

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  let response;
  try {
    response = await openai.chat.completions.create({
      model:           ctx.model,
      temperature:     0.65,
      messages: [
        { role: "system", content: EXPERIENCE_SYSTEM_PROMPT },
        { role: "user",   content: userMessage },
      ],
      response_format: { type: "json_object" },
    });
  } catch (aiErr) {
    console.error("[regenerate] OpenAI error:", aiErr);
    await ctx.refund("openai_error");
    return aiError("AI_ERROR", "Kunjara Core failed. Try again in a minute.", 502);
  }

  const content = response.choices[0]?.message?.content;
  if (!content) {
    await ctx.refund("empty_response");
    return aiError("AI_ERROR", "AI returned an empty response.", 502);
  }

  let parsed: Partial<ProposalData>;
  try {
    parsed = JSON.parse(content);
  } catch {
    console.error("[regenerate] JSON parse failed; content length:", content.length);
    await ctx.refund("json_parse");
    return aiError("AI_ERROR", "AI returned invalid JSON.", 502);
  }
  parsed = sanitizeExperiencePayload(parsed);

  // Snapshot the current AI payload before overwriting.
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
  const nextLabel    = `v${nextVersions.length + 1}`;

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

  const { error: writeErr } = await supabase
    .from("proposals")
    .update({ data: next, updated_at: next.updatedAt })
    .eq("id", parsedParams.data.id);

  if (writeErr) {
    console.error("[regenerate] write failed:", writeErr.message);
    // DB write failed AFTER the AI call succeeded. Refund — the user
    // didn't get the new version persisted.
    await ctx.refund("db_write");
    return aiError("SERVICE_UNAVAILABLE", "Could not save regeneration.", 500);
  }

  const remaining = await ctx.finish({
    tokensUsed: response.usage?.total_tokens ?? null,
    eventId:    parsedParams.data.id,
  });

  return aiSuccess(next, ctx.creditsCharged, remaining);
}
