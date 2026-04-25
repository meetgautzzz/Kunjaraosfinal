import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseJson } from "@/lib/validate";
import { aiLimiter, limit } from "@/lib/ratelimit";
import { checkUsage, incrementUsage } from "@/lib/usage";
import type { EventIdea, OriginalBrief, ProposalData } from "@/lib/proposals";
import {
  EXPERIENCE_SYSTEM_PROMPT,
  buildExperienceUserMessage,
  sanitizeExperiencePayload,
} from "@/lib/experiencePrompt";

// We only validate the fields the handler reads from selectedIdea. Extra
// fields from the generate-ideas response pass through unchanged.
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
  // Extended inputs. Client PII is persisted on the proposal row but NOT
  // passed to the model — only company name is sent for brand context.
  client:        ClientInfoSchema.optional(),
  eventDate:     z.string().trim().max(40).optional(),
  venueByClient: z.boolean().optional(),
  foodByClient:  z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "AI service not configured." }, { status: 503 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const rl = await limit(aiLimiter, `user:${user.id}`);
    if (rl) return rl;

    const bodyResult = await parseJson(req, BodySchema);
    if (bodyResult.error) return bodyResult.error;
    const {
      selectedIdea, eventType, budget, location, requirements, guestCount,
      client: clientInfo, eventDate, venueByClient, foodByClient,
    } = bodyResult.data;

    const usage = await checkUsage(user.id);
    if (usage.overage) {
      return NextResponse.json({
        error: "Plan limit reached. Upgrade to continue.",
        limit_reached: true,
      }, { status: 403 });
    }

    const userMessage = buildExperienceUserMessage({
      selectedIdea,
      eventType,
      budget,
      location,
      requirements,
      guestCount,
      clientCompanyName: clientInfo?.companyName,
      eventDate,
      venueByClient,
      foodByClient,
    });

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    let response;
    try {
      response = await client.chat.completions.create({
        model:           "gpt-4o",
        temperature:     0.6,
        messages: [
          { role: "system", content: EXPERIENCE_SYSTEM_PROMPT },
          { role: "user",   content: userMessage },
        ],
        response_format: { type: "json_object" },
      });
    } catch (aiErr) {
      console.error("[generate-experience] OpenAI error:", aiErr);
      return NextResponse.json({ error: "Kunjara Core failed. Try again in a minute." }, { status: 502 });
    }

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "AI returned an empty response." }, { status: 502 });
    }

    let parsed: Partial<ProposalData>;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error("[generate-experience] JSON parse failed; content length:", content.length);
      return NextResponse.json({ error: "AI returned invalid JSON." }, { status: 502 });
    }

    parsed = sanitizeExperiencePayload(parsed);

    // Increment usage only after successful generation
    await incrementUsage(user.id, usage.events_used);

    const now = new Date().toISOString();
    const proposalId = bodyResult.data.proposalId ?? crypto.randomUUID();
    const originalBrief: OriginalBrief = {
      selectedIdea: selectedIdea as unknown as EventIdea,
      eventType,
      budget,
      location,
      requirements,
      guestCount,
      clientCompanyName: clientInfo?.companyName,
      eventDate,
      venueByClient,
      foodByClient,
    };
    const proposal: ProposalData = {
      id:           proposalId,
      title:        parsed.title ?? selectedIdea.title,
      eventType,
      location,
      budget,
      requirements,
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
      eventDate,
      venueByClient,
      foodByClient,
      // Version tracking starts at v1 with no history.
      versions:           [],
      regenerationsUsed:  0,
      activeVersionLabel: "v1",
      originalBrief,
    };

    const { error: insertError } = await supabase.from("proposals").insert({
      id:      proposalId,
      user_id: user.id,
      data:    proposal,
    });

    if (insertError) {
      console.error("[generate-experience] Persist failed (returning in-memory):", insertError);
    }

    return NextResponse.json(proposal);
  } catch (err) {
    console.error("[generate-experience] Unexpected:", err);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
