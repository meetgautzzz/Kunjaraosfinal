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
  const { eventType, location, budget, guestCount, eventDate, requirements } = body;

  if (!eventType) return NextResponse.json({ error: "eventType is required." }, { status: 400 });

  const prompt = `You are an Indian event compliance expert. Analyse the following event and return a JSON array of compliance risks.

Event details:
- Type: ${eventType}
- Location: ${location || "India"}
- Budget: ${budget ? `₹${Number(budget).toLocaleString("en-IN")}` : "Not specified"}
- Guest count: ${guestCount || "Not specified"}
- Date: ${eventDate || "Not specified"}
- Requirements: ${requirements || "None"}

Return a JSON array of 3-5 risk objects, each with:
{
  "severity": "HIGH" | "MEDIUM" | "LOW",
  "category": "string (e.g. Permits, Safety, Catering)",
  "risk": "string — specific risk in 1 sentence",
  "mitigation": "string — concrete action to address it"
}

Only return the JSON array. No markdown.`;

  try {
    const completion = await openai.chat.completions.create({
      model:    CHEAP_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
      temperature: 0.3,
    });

    const text = completion.choices[0]?.message?.content?.trim() ?? "[]";
    const risks = JSON.parse(text.replace(/^```json\n?/, "").replace(/\n?```$/, ""));
    return NextResponse.json({ risks: Array.isArray(risks) ? risks : [] });
  } catch {
    return NextResponse.json({ risks: [] });
  }
}
