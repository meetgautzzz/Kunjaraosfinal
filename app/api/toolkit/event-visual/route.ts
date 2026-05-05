export const runtime    = "nodejs";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { parseJson } from "@/lib/validate";
import { apiLimiter, limit } from "@/lib/ratelimit";

const BodySchema = z.object({
  eventType:  z.enum(["booth", "stage", "concert", "festival"]),
  brandName:  z.string().trim().min(1).max(100),
  dimensions: z.string().trim().min(1).max(100),
  theme:      z.enum(["tropical", "luxury", "modern", "gaming", "futuristic", "corporate", "minimal", "traditional"]),
  features:   z.array(z.string().trim().max(60)).min(1).max(12),
  budget:     z.string().trim().max(60).optional(),
});

// ── Prompt builder ────────────────────────────────────────────────────────────

const STYLE_LOCK = `ultra realistic 3D render, cinematic lighting, high contrast, global illumination,
octane render, unreal engine quality, 8k resolution, sharp focus,
professional event production design, volumetric lighting,
premium materials, reflections, shadows, depth of field`;

const CAMERA = `wide angle shot, 24mm lens, eye-level perspective,
full scene visible, symmetrical composition,
cinematic framing, depth, foreground and background layers`;

const EVENT_PROMPTS: Record<string, string> = {
  booth:    `exhibition booth design, branded environment, illuminated bar counter, LED panels, backlit logo, premium display shelves, structured layout zones`,
  stage:    `concert stage design, large LED wall, truss system, moving lights, smoke effects, massive stage presence, festival scale production setup`,
  concert:  `live concert environment, crowd perspective, stage lighting beams, lasers, immersive visuals, energy and atmosphere`,
  festival: `festival ground layout, multiple installations, brand zones, lighting installations, immersive experience`,
};

const THEME_PROMPTS: Record<string, string> = {
  tropical:    "palm trees, warm lighting, wood textures, beach vibe, natural materials",
  luxury:      "gold accents, marble textures, soft ambient lighting, opulent materials, champagne palette",
  modern:      "minimal, clean lines, black and white, LED strips, geometric forms",
  gaming:      "RGB lighting, futuristic neon, digital screens, cyberpunk atmosphere",
  futuristic:  "holographic elements, chrome surfaces, electric blue accents, sci-fi aesthetic",
  corporate:   "professional, branded colours, clean layout, executive style, premium finishes",
  minimal:     "white space, subtle textures, soft diffused light, understated elegance",
  traditional: "warm wood tones, drapes, traditional motifs, cultural details, rich fabric textures",
};

function buildPrompt(input: z.infer<typeof BodySchema>): string {
  return [
    STYLE_LOCK,
    CAMERA,
    EVENT_PROMPTS[input.eventType] ?? "",
    `brand: ${input.brandName}`,
    `size: ${input.dimensions}`,
    `theme: ${THEME_PROMPTS[input.theme] ?? input.theme}`,
    `features: ${input.features.join(", ")}`,
    input.budget ? `budget tier: ${input.budget}` : "",
    "high detail environment, realistic materials, people silhouettes for scale, premium event setup, designed by top event production agency",
  ].filter(Boolean).join(",\n");
}

// ── Route ─────────────────────────────────────────────────────────────────────

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

  const prompt = buildPrompt(body.data);

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const response = await openai.images.generate({
      model:   "gpt-image-1",
      prompt,
      size:    "1536x1024",
      // gpt-image-1 returns b64_json by default; n defaults to 1
    } as Parameters<typeof openai.images.generate>[0]);

    const item = response.data?.[0];
    if (!item) throw new Error("No image returned from API.");

    // gpt-image-1 returns b64_json; dall-e-3 may return url.
    const imageData = (item as { b64_json?: string; url?: string }).b64_json
      ? `data:image/png;base64,${(item as { b64_json: string }).b64_json}`
      : (item as { url?: string }).url ?? null;

    if (!imageData) throw new Error("Unexpected image response format.");

    return NextResponse.json({ image: imageData, promptUsed: prompt });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[event-visual] OpenAI error:", message);
    return NextResponse.json({ error: "Image generation failed. Please try again." }, { status: 500 });
  }
}
