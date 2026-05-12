import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { requireUser } from "@/lib/auth";
import type { FpElement, ElementKind } from "@/components/toolkit/FloorPlanBuilder";

export const maxDuration = 60;

const VALID_KINDS: ElementKind[] = ["stage", "chair", "table", "booth", "entry"];

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "AI service not configured." }, { status: 503 });
  }

  const { eventType, concept, theme, description } = await req.json();

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const systemPrompt = `You are an expert event floor plan designer.
Return a JSON array of floor plan elements for a 30m × 22m venue.
Each element: { "id": "uuid", "kind": "stage"|"chair"|"table"|"booth"|"entry", "x": number, "y": number, "w": number, "h": number, "rotation": 0, "label": "string" }
Coordinates are in meters. Keep elements within x:[0,30] y:[0,22].
Typical sizes: stage 8×5, table 1.5×1.5, chair 0.5×0.5, booth 2×2, entry 2×0.5.
Create a logical flow: entry → seating/tables → stage. Return ONLY a valid JSON array, no markdown, no commentary.`;

  const userMsg = [
    `Event Type: ${eventType ?? "corporate"}`,
    concept     ? `Concept: ${concept}` : "",
    theme       ? `Theme: ${theme}` : "",
    description ? `Description: ${description}` : "",
  ].filter(Boolean).join("\n");

  let elements: FpElement[];
  try {
    const completion = await openai.chat.completions.create({
      model:       "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userMsg },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "[]";
    const parsed: unknown[] = JSON.parse(raw.replace(/```json|```/g, "").trim());

    elements = (parsed as any[])
      .filter((el) => VALID_KINDS.includes(el.kind))
      .map((el) => ({
        id:       el.id ?? crypto.randomUUID(),
        kind:     el.kind as ElementKind,
        x:        Number(el.x) || 0,
        y:        Number(el.y) || 0,
        w:        Number(el.w) || 1.5,
        h:        Number(el.h) || 1.5,
        rotation: Number(el.rotation) || 0,
        label:    String(el.label ?? ""),
      }));

    if (elements.length === 0) throw new Error("No valid elements returned");
  } catch (err: any) {
    console.error("[suggest-floor-plan]", err.message);
    return NextResponse.json({ error: "Failed to generate layout" }, { status: 500 });
  }

  return NextResponse.json({ success: true, elements });
}
