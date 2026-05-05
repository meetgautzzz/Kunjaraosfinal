export const runtime    = "nodejs";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseJson } from "@/lib/validate";
import { apiLimiter, limit } from "@/lib/ratelimit";
import { generateEventVisual, type EventVisualInput } from "@/lib/ai/generateEventVisual";

const BodySchema = z.object({
  eventType:    z.enum(["booth", "stage", "concert", "festival"]),
  brandName:    z.string().trim().min(1).max(100),
  dimensions:   z.string().trim().min(1).max(100),
  theme:        z.enum(["tropical", "luxury", "modern", "gaming", "futuristic", "corporate", "minimal", "traditional"]),
  features:     z.array(z.string().trim().max(60)).min(1).max(12),
  budget:       z.string().trim().max(60).optional(),
  audienceType: z.string().trim().max(100).optional(),
});

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Image generation not configured." }, { status: 503 });
  }

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const rl = await limit(apiLimiter, `user:${user.id}`);
  if (rl) return rl;

  const body = await parseJson(req, BodySchema);
  if (body.error) return body.error;

  try {
    const result = await generateEventVisual(body.data as EventVisualInput);
    return NextResponse.json({ image: result.image, promptUsed: result.promptUsed });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[event-visual] error:", message);
    return NextResponse.json({ error: "Image generation failed. Please try again." }, { status: 500 });
  }
}
