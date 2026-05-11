import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { sendGA4Event } from "@/lib/ga4";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseJson } from "@/lib/validate";
import { apiLimiter, limit } from "@/lib/ratelimit";
import { aiError } from "@/lib/ai/responses";
import { chatWithFallback } from "@/lib/ai/fallback";
import type { EventIdea, OriginalBrief, ProposalData } from "@/lib/proposals";
import {
  EXPERIENCE_SYSTEM_PROMPT,
  buildExperienceUserMessage,
  sanitizeExperiencePayload,
} from "@/lib/experiencePrompt";
import { getAdminClient } from "@/lib/supabase/admin";
import { buildEventPlannerContext, buildEnrichedUserMessage } from "@/lib/ai/eventPlanner";

// Full proposal generation (gpt-4o in JSON mode) takes 30-60 s.
// Default Vercel timeout is 10 s, which produces 502s.
export const maxDuration = 60;

async function getUserVendorsForEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  eventType: string,
  location: string,
): Promise<{ name: string; category: string; city: string | null; phone: string | null; email: string | null; rating: number | null; notes: string | null }[]> {
  const { data, error } = await supabase!
    .from("vendors")
    .select("id, name, category, city, phone, email, rating, notes, active")
    .eq("user_id", userId)
    .eq("active", true)
    .order("rating", { ascending: false });

  if (error || !data) return [];

  const city = location.toLowerCase();
  const filtered = (data as any[]).filter(
    (v) => !location || v.city?.toLowerCase().includes(city),
  );

  return filtered.slice(0, 12);
}

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
  // Batch generation fields — all proposals in a batch share the same batchId
  batchId:    z.string().uuid().optional(),
  batchIndex: z.number().int().min(0).max(2).optional(),
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

  const baseUserMessage = buildExperienceUserMessage({
    selectedIdea, eventType, budget, location, requirements, guestCount,
    clientCompanyName: clientInfo?.companyName,
    eventDate, venueByClient, foodByClient,
  });

  // Auth + rate limit
  const supabase = await createClient();
  if (!supabase) return aiError("SERVICE_UNAVAILABLE", "Service unavailable.", 503);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return aiError("UNAUTHORIZED", "Unauthorized.", 401);

  const rl = await limit(apiLimiter, `user:${user.id}`);
  if (rl) return rl;

  // Usage limit check
  const { data: usage } = await supabase
    .from("user_usage")
    .select("plan, proposals_used")
    .eq("user_id", user.id)
    .single();

  const proposalLimit = (usage?.plan === "pro" || usage?.plan === "basic") ? 30 : 2;
  if ((usage?.proposals_used ?? 0) >= proposalLimit) {
    return aiError("LIMIT_REACHED", "Proposal limit reached. Upgrade to Pro (₹3,000/month) for 30 proposals.", 402);
  }

  // Fetch user's vendor network and knowledge enrichment in parallel.
  // Both fail soft — fallback to base message if anything goes wrong.
  let userMessage = baseUserMessage;
  const admin = getAdminClient();
  const [plannerResult, userVendors] = await Promise.allSettled([
    admin
      ? buildEventPlannerContext({ admin, location, budget, eventType, guestCount, eventDate })
      : Promise.reject(new Error("no admin client")),
    getUserVendorsForEvent(supabase, user.id, eventType, location),
  ]);

  if (plannerResult.status === "fulfilled") {
    userMessage = buildEnrichedUserMessage({ context: plannerResult.value, baseMessage: baseUserMessage });
  } else {
    console.warn("[generate-experience] Knowledge enrichment failed:", plannerResult.reason);
  }

  const vendors = userVendors.status === "fulfilled" ? userVendors.value : [];
  const vendorContext = vendors.length > 0
    ? "\n\nPLANNER'S VENDOR NETWORK (use these for recommendations):\n" +
      vendors
        .map((v) => `- ${v.name} (${v.category}, ${v.city ?? location}, ⭐${v.rating ?? "unrated"}, availability: flexible, contact: ${v.phone ?? v.email ?? "N/A"})`)
        .join("\n") +
      "\n\nPrioritize planner's vendors in all recommendations. Only suggest market vendors if planner has no vendor in that category."
    : "";

  const enrichedUserMessage = userMessage + vendorContext;

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const fb = await chatWithFallback(openai, {
    temperature: 0.6,
    messages: [
      { role: "system", content: EXPERIENCE_SYSTEM_PROMPT },
      { role: "user",   content: enrichedUserMessage },
    ],
    response_format: { type: "json_object" },
  }, "generate-experience");

  if (!fb.ok) {
    return aiError(
      "AI_ERROR",
      `All models failed. Last error: ${fb.lastError.message ?? "unknown"} (status ${fb.lastError.status ?? "?"})`,
      502,
      { triedModels: fb.triedModels, lastError: fb.lastError },
    );
  }
  const response = fb.response;
  const modelUsed = fb.modelUsed;

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return aiError("AI_ERROR", "AI returned an empty response.", 502);
  }

  let parsed: Partial<ProposalData>;
  try {
    parsed = JSON.parse(content);
  } catch {
    console.error("[generate-experience] JSON parse failed; content length:", content.length);
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
    ...(bodyResult.data.batchId    !== undefined ? { batchId:    bodyResult.data.batchId    } : {}),
    ...(bodyResult.data.batchIndex !== undefined ? { batchIndex: bodyResult.data.batchIndex } : {}),
  };

  // Persist. Best-effort — AI work was done; user keeps in-memory proposal if insert fails.
  const { error: insertError } = await supabase.from("proposals").insert({
    id:      proposalId,
    user_id: user.id,
    data:    proposal,
  });
  if (insertError) {
    console.error("[generate-experience] Persist failed (returning in-memory):", insertError);
  }

  // Increment proposal counter
  await supabase
    .from("user_usage")
    .update({ proposals_used: (usage?.proposals_used ?? 0) + 1, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);

  void sendGA4Event(user.id, "proposal_generated", {
    event_type: eventType,
    plan:       usage?.plan ?? "free",
  });

  return NextResponse.json({ success: true, data: { ...proposal, modelUsed } });
}
