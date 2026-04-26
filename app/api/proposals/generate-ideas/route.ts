import { NextRequest } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { parseJson } from "@/lib/validate";
import { requireAiCredits } from "@/lib/ai/middleware";
import { aiError, aiSuccess } from "@/lib/ai/responses";
import type { EventIdea } from "@/lib/proposals";
import { randomUUID } from "crypto";

const BodySchema = z.object({
  eventType:    z.string().trim().min(1).max(200),
  budget:       z.number().positive().max(1_000_000_000),
  location:     z.string().trim().min(1).max(500),
  requirements: z.string().trim().min(1).max(5000),
  guestCount:   z.number().int().positive().max(1_000_000).optional(),
  companyName:   z.string().trim().max(200).optional(),
  eventDate:     z.string().trim().max(40).optional(),
  venueByClient: z.boolean().optional(),
  foodByClient:  z.boolean().optional(),
});

const SYSTEM_PROMPT = `You are a senior event director at a premium Indian event agency with 15+ years of experience producing luxury weddings, corporate galas, product launches, and concerts across Mumbai, Delhi, Bangalore, and Goa.

Your task is to design THREE distinct, bold, creative event concepts based on the brief — each with a different angle. Avoid clichés. Think Indian weddings meets Fabulatorij storytelling meets Apple keynote craftsmanship.

Respond ONLY with a valid JSON object matching this exact shape:
{
  "ideas": [
    {
      "title":            "Short evocative concept name (max 5 words)",
      "concept":          "2-3 sentence narrative describing the concept's vision and positioning",
      "experienceType":   "One of: Intimate / Immersive / Spectacular / Interactive / Ceremonial / Futuristic",
      "engagement":       ["3-5 specific ways guests engage with the experience"],
      "brandIntegration": "How the client's brand or story weaves through the event",
      "vibe":             "Single-line emotional tone e.g. 'Electric, intimate, unforgettable'",
      "headline":         "A single punchy tagline — max 10 words",
      "wowFactor":        "The ONE signature moment that guests will talk about for years",
      "score": {
        "uniqueness":    8,
        "engagement":    9,
        "budgetFit":     7,
        "overall":       8.0,
        "isRecommended": false
      }
    },
    { ... },
    { ... }
  ]
}

Rules:
- All 3 concepts must be genuinely different — different angles, different wow moments, different experience types
- Score each concept honestly: uniqueness (1-10), engagement (1-10), budgetFit (1-10)
- Overall score = weighted average: uniqueness*0.4 + engagement*0.4 + budgetFit*0.2, rounded to 1 decimal
- Exactly ONE of the three concepts must have "isRecommended": true — the one with the highest overall score
- Budget fit means: how well the concept can be executed within the stated budget at Indian market prices
- Keep prose concrete. Name specific elements, effects, moments. No filler.
- No markdown inside JSON values.`;

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return aiError("SERVICE_UNAVAILABLE", "AI service not configured.", 503);
  }

  const bodyResult = await parseJson(req, BodySchema);
  if (bodyResult.error) return aiError("VALIDATION_ERROR", "Invalid request.", 400);

  const {
    eventType, budget, location, requirements, guestCount,
    companyName, eventDate, venueByClient, foodByClient,
  } = bodyResult.data;

  const userMessage = [
    `Event type: ${eventType}`,
    companyName ? `Client company: ${companyName}` : null,
    `Location: ${location}`,
    eventDate ? `Event date: ${eventDate}` : null,
    `Total budget: ₹${budget.toLocaleString("en-IN")}`,
    guestCount ? `Expected guests: ${guestCount}` : null,
    venueByClient === false
      ? `VENUE: Client has NOT booked a venue — factor venue selection into each concept.`
      : null,
    foodByClient === false
      ? `F&B: Client has NOT arranged catering — factor food & beverage design into each concept.`
      : null,
    ``,
    `Requirements and vision from the client:`,
    requirements,
  ].filter(Boolean).join("\n");

  // Single line: auth + rate limit + atomic credit deduction.
  const pre = await requireAiCredits({
    req,
    action: "concept",
    promptLength: userMessage.length,
  });
  if (!pre.ok) return pre.res;
  const { ctx } = pre;

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  let response;
  try {
    response = await client.chat.completions.create({
      model:           ctx.model,
      temperature:     0.85,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: userMessage },
      ],
      response_format: { type: "json_object" },
    });
  } catch (aiErr) {
    console.error("[generate-ideas] OpenAI error:", aiErr);
    await ctx.refund("openai_error");
    return aiError("AI_ERROR", "Kunjara Core failed. Try again in a minute.", 502);
  }

  const content = response.choices[0]?.message?.content;
  if (!content) {
    await ctx.refund("empty_response");
    return aiError("AI_ERROR", "AI returned an empty response.", 502);
  }

  let parsed: { ideas?: Omit<EventIdea, "id">[] };
  try {
    parsed = JSON.parse(content);
  } catch {
    console.error("[generate-ideas] JSON parse failed; content length:", content.length);
    await ctx.refund("json_parse");
    return aiError("AI_ERROR", "AI returned invalid JSON.", 502);
  }

  if (!parsed.ideas || !Array.isArray(parsed.ideas) || parsed.ideas.length !== 3) {
    await ctx.refund("idea_count");
    return aiError("AI_ERROR", "AI did not return 3 ideas.", 502);
  }

  const ideas: EventIdea[] = parsed.ideas.map((idea) => ({ ...idea, id: randomUUID() }));
  const anyRecommended = ideas.some((i) => i.score?.isRecommended);
  if (!anyRecommended && ideas.length) {
    const topIdx = ideas.reduce((best, idea, i, arr) => (idea.score.overall > arr[best].score.overall ? i : best), 0);
    ideas[topIdx].score = { ...ideas[topIdx].score, isRecommended: true };
  }

  const proposalId = randomUUID();
  const remaining = await ctx.finish({
    tokensUsed: response.usage?.total_tokens ?? null,
    eventId:    proposalId,
  });

  return aiSuccess({ proposalId, ideas }, ctx.creditsCharged, remaining);
}
