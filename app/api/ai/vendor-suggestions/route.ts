import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { requireUser } from "@/lib/auth";
import { apiLimiter, limit } from "@/lib/ratelimit";
import { CHEAP_MODEL } from "@/lib/ai/router";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const rl = await limit(apiLimiter, `ai:${auth.user.id}`);
  if (rl) return rl;

  const body = await req.json().catch(() => ({}));
  const { eventType, location, budget, category, existingVendors } = body;

  if (!eventType) return NextResponse.json({ error: "eventType is required." }, { status: 400 });

  const prompt = `You are an expert Indian event planner. Suggest vendors for the following event.

Event details:
- Type: ${eventType}
- Location: ${location || "India"}
- Budget: ${budget ? `₹${Number(budget).toLocaleString("en-IN")}` : "Not specified"}
- Category needed: ${category || "All categories"}
${existingVendors?.length ? `- Already have: ${existingVendors.join(", ")}` : ""}

Return a JSON array of 4-6 vendor suggestions, each with:
{
  "category": "string (e.g. Venue, Catering, AV & Technology)",
  "name": "string — realistic Indian vendor name",
  "city": "string — city in India",
  "estimatedCost": number (INR, integer),
  "notes": "string — why this vendor fits this event",
  "rating": number (1-5)
}

Be specific and India-first. Names should sound like real Indian event vendors.
Only return the JSON array. No markdown.`;

  try {
    const completion = await openai.chat.completions.create({
      model:    CHEAP_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      temperature: 0.5,
    });

    const text = completion.choices[0]?.message?.content?.trim() ?? "[]";
    const suggestions = JSON.parse(text.replace(/^```json\n?/, "").replace(/\n?```$/, ""));
    return NextResponse.json({ suggestions: Array.isArray(suggestions) ? suggestions : [] });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
