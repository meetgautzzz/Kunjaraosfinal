import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseJson } from "@/lib/validate";
import { aiLimiter, limit } from "@/lib/ratelimit";
import { checkUsage, incrementUsage } from "@/lib/usage";
import type { EventIdea, ProposalData } from "@/lib/proposals";

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

const SYSTEM_PROMPT = `You are a senior event director at a premium Indian event agency. You have been given a chosen creative concept for an event — your job is to expand it into a fully executable luxury event plan.

Produce a JSON response that matches EXACTLY this shape (all fields required except where noted optional):

{
  "title": "string — the event title, e.g. 'Apex Gala Night 2025'",
  "concept": {
    "title":       "string — short concept name",
    "tagline":     "string — punchy one-liner, max 10 words",
    "description": "string — 2-3 sentence premium concept narrative",
    "theme":       "string — theme name + primary colours",
    "highlights":  ["5 specific signature highlights — concrete and named"]
  },
  "budgetBreakdown": [
    { "category": "Venue",          "amount": 250000, "percentage": 10, "description": "Specific venue line item" },
    { "category": "Catering",       "amount": 750000, "percentage": 30, "description": "..." },
    { "category": "Production",     "amount": 500000, "percentage": 20, "description": "..." },
    { "category": "Decor",          "amount": 300000, "percentage": 12, "description": "..." },
    { "category": "Entertainment",  "amount": 200000, "percentage":  8, "description": "..." },
    { "category": "Photography",    "amount": 100000, "percentage":  4, "description": "..." },
    { "category": "Logistics",      "amount": 150000, "percentage":  6, "description": "..." },
    { "category": "Contingency",    "amount": 250000, "percentage": 10, "description": "..." }
  ],
  "timeline": [
    { "phase": "Strategy & Planning",  "daysOut": "90 days before", "tasks": ["3-5 specific tasks"], "milestone": true  },
    { "phase": "Vendor Sourcing",      "daysOut": "75 days before", "tasks": ["..."],                "milestone": false },
    { "phase": "Creative Development", "daysOut": "60 days before", "tasks": ["..."],                "milestone": true  },
    { "phase": "Production",           "daysOut": "30 days before", "tasks": ["..."],                "milestone": false },
    { "phase": "Final Preparation",    "daysOut": "7 days before",  "tasks": ["..."],                "milestone": true  },
    { "phase": "Event Day",            "daysOut": "Day of event",   "tasks": ["..."],                "milestone": true  }
  ],
  "vendors": [
    { "category": "Venue",           "role": "Host venue & facilities",   "estimatedCost": 250000, "notes": "Specific venue recommendation with rationale" },
    { "category": "Catering",        "role": "F&B management",            "estimatedCost": 750000, "notes": "..." },
    { "category": "AV & Technology", "role": "Sound, lighting, LED",      "estimatedCost": 350000, "notes": "..." },
    { "category": "Decor & Design",  "role": "Theme execution",           "estimatedCost": 300000, "notes": "..." },
    { "category": "Entertainment",   "role": "Performers & DJ",           "estimatedCost": 200000, "notes": "..." },
    { "category": "Photography",     "role": "Photo + video",             "estimatedCost": 100000, "notes": "..." }
  ],
  "riskFlags": ["3-4 real risks for this specific event/location/time"],
  "tips":      ["3-4 pro tips from 15 years of Indian event experience"],
  "eventConcept": {
    "theme":            "string — theme name",
    "storyline":        "string — the narrative arc of the event night",
    "tagline":          "string — punchy line",
    "emotionalJourney": ["4-6 emotional beats guests move through"]
  },
  "visualDirection": {
    "palette": [
      { "name": "Deep Navy",  "hex": "#1a2f5c", "usage": "Primary backdrops" },
      { "name": "Antique Gold","hex": "#b08d57","usage": "Accents and typography" },
      { "name": "Ivory",      "hex": "#f4efe6", "usage": "Tablecloths and soft surfaces" }
    ],
    "lighting":         "string — lighting style and key fixtures",
    "overallAesthetic": "string — one-sentence mood summary",
    "dallePrompt":      "string — a vivid image prompt for DALL-E that captures the visual direction"
  },
  "stageDesign": {
    "layout":          "string — stage type, dimensions, orientation",
    "focalPoints":     ["3-4 specific stage focal elements"],
    "entryExperience": "string — what guests experience on arrival",
    "signature":       "string — the one stage moment unique to this event"
  },
  "decorPlan": {
    "hero": "string — the hero decor statement piece",
    "zones": [
      { "name": "Entry",       "concept": "string" },
      { "name": "Main Hall",   "concept": "string" },
      { "name": "Dining Area", "concept": "string" },
      { "name": "Lounge",      "concept": "string" }
    ],
    "sustainabilityNotes": "string — specific reuse/eco choices"
  },
  "experienceElements": {
    "activations": [
      { "name": "string", "description": "string", "engagementType": "ACTIVE" },
      { "name": "string", "description": "string", "engagementType": "SOCIAL" },
      { "name": "string", "description": "string", "engagementType": "PASSIVE" }
    ],
    "guestJourney":     ["5-7 touchpoints a guest moves through from arrival to farewell"],
    "techElements":     ["3-5 tech or AV elements"],
    "surpriseElements": ["2-3 unannounced moments that delight guests"]
  }
}

Rules:
- budgetBreakdown amounts must SUM to the user's total budget. Percentages must total 100.
- engagementType must be one of: PASSIVE, ACTIVE, SOCIAL, COMPETITIVE
- All numbers are integers in INR (no strings, no currency symbols)
- Every field is required — do not omit any. Use empty arrays only if truly nothing applies.
- Be concrete and India-first. Name specific vendors, venues, fabrics, songs, dishes where relevant.
- No filler words like "world-class", "state-of-the-art", "premium quality".
- No markdown inside JSON values.`;

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

    const userMessage = [
      `Chosen creative concept:`,
      `- Title:           ${selectedIdea.title}`,
      `- Headline:        ${selectedIdea.headline}`,
      `- Concept:         ${selectedIdea.concept}`,
      `- Experience type: ${selectedIdea.experienceType}`,
      `- Vibe:            ${selectedIdea.vibe}`,
      `- Wow factor:      ${selectedIdea.wowFactor}`,
      `- Brand tie-in:    ${selectedIdea.brandIntegration}`,
      ``,
      `Event brief:`,
      `- Event type: ${eventType}`,
      clientInfo?.companyName ? `- Client company: ${clientInfo.companyName}` : null,
      `- Location:   ${location}`,
      eventDate ? `- Event date: ${eventDate}` : null,
      `- Total budget: ₹${budget.toLocaleString("en-IN")} INR`,
      guestCount ? `- Expected guests: ${guestCount}` : null,
      venueByClient === false
        ? `- VENUE: Client has NOT booked a venue — include a specific venue recommendation in the Venue line item and the vendors list.`
        : venueByClient === true
        ? `- VENUE: Client has already booked their own venue — do not suggest alternates; treat venue as fixed.`
        : null,
      foodByClient === false
        ? `- F&B: Client has NOT arranged food and beverages — include a full catering plan and vendor.`
        : foodByClient === true
        ? `- F&B: Client has already arranged food and beverages — do not plan catering; treat F&B as handled.`
        : null,
      ``,
      `Client requirements:`,
      requirements,
      ``,
      `Expand this chosen concept into a fully executable Indian luxury event plan. Respect the budget. Be specific.`,
    ].filter(Boolean).join("\n");

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    let response;
    try {
      response = await client.chat.completions.create({
        model:           "gpt-4o",
        temperature:     0.6,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
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

    // L3 defense-in-depth: sanitize AI-controlled fields that flow into
    // DOM attributes (<img src>, style={{ backgroundColor }}). React escapes
    // text children, so prose fields don't need sanitizing.
    if (parsed.visualDirection) {
      // generatedImageUrl is server-written only (via /api/proposals/generate-image).
      // Strip any value the model smuggles in to block tracking-beacon / URL-injection abuse.
      delete (parsed.visualDirection as { generatedImageUrl?: unknown }).generatedImageUrl;

      // Palette hex values land in style.backgroundColor. Keep only strings that
      // match a real CSS hex color; fall back to a neutral grey otherwise.
      if (Array.isArray(parsed.visualDirection.palette)) {
        const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
        parsed.visualDirection.palette = parsed.visualDirection.palette.map((s) => ({
          ...s,
          hex: typeof s?.hex === "string" && HEX.test(s.hex.trim()) ? s.hex.trim() : "#888888",
        }));
      }
    }

    // Increment usage only after successful generation
    await incrementUsage(user.id, usage.events_used);

    const now = new Date().toISOString();
    const proposalId = bodyResult.data.proposalId ?? crypto.randomUUID();
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
