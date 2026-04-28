import { NextRequest } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseJson } from "@/lib/validate";
import { requireAiCredits } from "@/lib/ai/middleware";
import { aiError, aiSuccess } from "@/lib/ai/responses";
import type { EventIdea, OriginalBrief, ProposalData } from "@/lib/proposals";
import {
  EXPERIENCE_SYSTEM_PROMPT,
  buildExperienceUserMessage,
  sanitizeExperiencePayload,
} from "@/lib/experiencePrompt";

// Full proposal generation (gpt-4o in JSON mode) takes 30-60 s.
// Default Vercel timeout is 10 s, which produces 502s.
export const maxDuration = 60;

const SelectedIdeaSchema = z.object({
  title:            z.string().min(1),
  headline:         z.string().min(1),
  concept:          z.string().min(1),
  experienceType:   z.string().min(1),
  vibe:             z.string().min(1),
  wowFactor:        z.string().min(1),
  brandIntegration: z.string().min(1),
}).passthrough();

const ClientInfoSchema = z.object({
  name:        z.string().trim().max(200).optional(),
  companyName: z.string().trim().max(200).optional(),
  mobile:      z.string().trim().max(40).optional(),
  email:       z.string().trim().email().max(200).optional().or(z.literal("")),
  address:     z.string().trim().max(500).optional(),
}).partial();

const BodySchema = z.object({
  proposalId:   z.string().uuid().optional(),
  selectedIdea: SelectedIdeaSchema,
  eventType:    z.string().trim().min(1).max(200),
  budget:       z.number().positive().max(1_000_000_000),
  location:     z.string().trim().min(1).max(500),
  requirements: z.string().trim().min(1).max(5000),
  guestCount:   z.number().int().positive().max(1_000_000).optional(),
  client:        ClientInfoSchema.optional(),
  eventDate:     z.string().trim().max(40).optional(),
  venueByClient: z.boolean().optional(),
  foodByClient:  z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return aiError("SERVICE_UNAVAILABLE", "AI service not configured.", 503);
  }

  const bodyResult = await parseJson(req, BodySchema);
  if (bodyResult.error) return aiError("VALIDATION_ERROR", "Invalid request.", 400);

  const {
    selectedIdea, eventType, budget, location, requirements, guestCount,
    client: clientInfo, eventDate, venueByClient, foodByClient,
  } = bodyResult.data;

  const userMessage = buildExperienceUserMessage({
    selectedIdea, eventType, budget, location, requirements, guestCount,
    clientCompanyName: clientInfo?.companyName,
    eventDate, venueByClient, foodByClient,
  });

  const pre = await requireAiCredits({
    req,
    action: "proposal",
    promptLength: userMessage.length,
  });
  if (!pre.ok) return pre.res;
  const { ctx } = pre;

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  let response;
  try {
    response = await openai.chat.completions.create({
      model:           ctx.model,
      temperature:     0.6,
      messages: [
        { role: "system", content: EXPERIENCE_SYSTEM_PROMPT },
        { role: "user",   content: userMessage },
      ],
      response_format: { type: "json_object" },
    });
  } catch (aiErr) {
    console.error("[generate-experience] OpenAI error:", aiErr);
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
    console.error("[generate-experience] JSON parse failed; content length:", content.length);
    await ctx.refund("json_parse");
    return aiError("AI_ERROR", "AI returned invalid JSON.", 502);
  }
  parsed = sanitizeExperiencePayload(parsed);

  const now = new Date().toISOString();
  const proposalId = bodyResult.data.proposalId ?? crypto.randomUUID();
  const originalBrief: OriginalBrief = {
    selectedIdea: selectedIdea as unknown as EventIdea,
    eventType, budget, location, requirements, guestCount,
    clientCompanyName: clientInfo?.companyName,
    eventDate, venueByClient, foodByClient,
  };
  const proposal: ProposalData = {
    id:           proposalId,
    title:        parsed.title ?? selectedIdea.title,
    eventType, location, budget, requirements,
    status:       "GENERATED",
    concept:      parsed.concept ?? { title: "", tagline: "", description: "", theme: "", highlights: [] },
    budgetBreakdown: parsed.budgetBreakdown ?? [],
    timeline:     parsed.timeline ?? [],
    vendors:      parsed.vendors  ?? [],
    riskFlags:    parsed.riskFlags ?? [],
    tips:         parsed.tips     ?? [],
    createdAt:    now,
    updatedAt:    now,
    selectedIdea: selectedIdea as unknown as EventIdea,
    eventConcept:       parsed.eventConcept,
    visualDirection:    parsed.visualDirection,
    stageDesign:        parsed.stageDesign,
    decorPlan:          parsed.decorPlan,
    experienceElements: parsed.experienceElements,
    client: clientInfo,
    eventDate, venueByClient, foodByClient,
    versions:           [],
    regenerationsUsed:  0,
    activeVersionLabel: "v1",
    originalBrief,
  };

  // Persist. Best-effort — failure here doesn't deduct credits twice (already
  // consumed) but does NOT refund either, since the AI work was performed.
  // The user keeps the in-memory proposal.
  const supabase = await createClient();
  if (supabase) {
    const { error: insertError } = await supabase.from("proposals").insert({
      id:      proposalId,
      user_id: ctx.user.id,
      data:    proposal,
    });
    if (insertError) {
      console.error("[generate-experience] Persist failed (returning in-memory):", insertError);
    }
  }

  const remaining = await ctx.finish({
    tokensUsed: response.usage?.total_tokens ?? null,
    eventId:    proposalId,
  });

  return aiSuccess(proposal, ctx.creditsCharged, remaining);
}
