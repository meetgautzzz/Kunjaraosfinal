import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseJson } from "@/lib/validate";
import type { EventIdea } from "@/lib/proposals";
import { randomUUID } from "crypto";

const BodySchema = z.object({
  eventType:    z.string().trim().min(1).max(200),
  budget:       z.number().positive().max(1_000_000_000),
  location:     z.string().trim().min(1).max(500),
  requirements: z.string().trim().min(1).max(5000),
  guestCount:   z.number().int().positive().max(1_000_000).optional(),
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

    const bodyResult = await parseJson(req, BodySchema);
    if (bodyResult.error) return bodyResult.error;
    const { eventType, budget, location, requirements, guestCount } = bodyResult.data;

    const userMessage = [
      `Event type: ${eventType}`,
      `Location: ${location}`,
      `Total budget: ₹${budget.toLocaleString("en-IN")}`,
      guestCount ? `Expected guests: ${guestCount}` : null,
      ``,
      `Requirements and vision from the client:`,
      requirements,
    ].filter(Boolean).join("\n");

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    let response;
    try {
      response = await client.chat.completions.create({
        model:           "gpt-4o",
        temperature:     0.85,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user",   content: userMessage },
        ],
        response_format: { type: "json_object" },
      });
    } catch (aiErr) {
      console.error("[generate-ideas] OpenAI error:", aiErr);
      const message = aiErr instanceof Error ? aiErr.message : "AI generation failed.";
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "AI returned an empty response." }, { status: 502 });
    }

    let parsed: { ideas?: Omit<EventIdea, "id">[] };
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error("[generate-ideas] JSON parse failed:", content);
      return NextResponse.json({ error: "AI returned invalid JSON." }, { status: 502 });
    }

    if (!parsed.ideas || !Array.isArray(parsed.ideas) || parsed.ideas.length !== 3) {
      return NextResponse.json({ error: "AI did not return 3 ideas." }, { status: 502 });
    }

    // Assign stable IDs and ensure one is recommended
    const ideas: EventIdea[] = parsed.ideas.map((idea) => ({
      ...idea,
      id: randomUUID(),
    }));

    const anyRecommended = ideas.some((i) => i.score?.isRecommended);
    if (!anyRecommended && ideas.length) {
      const topIdx = ideas.reduce((best, idea, i, arr) => (idea.score.overall > arr[best].score.overall ? i : best), 0);
      ideas[topIdx].score = { ...ideas[topIdx].score, isRecommended: true };
    }

    return NextResponse.json({
      proposalId: randomUUID(),
      ideas,
    });
  } catch (err) {
    console.error("[generate-ideas] Unexpected:", err);
    const message = err instanceof Error ? err.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
