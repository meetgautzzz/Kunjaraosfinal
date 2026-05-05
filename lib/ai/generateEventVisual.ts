// Server-only. Called by /api/toolkit/event-visual and generateFromProposal.

export type EventVisualInput = {
  eventType:    "booth" | "stage" | "concert" | "festival";
  brandName:    string;
  dimensions:   string;
  theme:        "tropical" | "luxury" | "modern" | "gaming" | "futuristic" | "corporate" | "minimal" | "traditional";
  features:     string[];
  budget?:      string;
  audienceType?: string;
};

export type EventVisualResult = {
  image:      string;  // data URI (base64) or URL
  promptUsed: string;
};

// ── Prompt components ─────────────────────────────────────────────────────────

const STYLE_LOCK = [
  "ultra realistic 3D render, cinematic lighting, high contrast, global illumination",
  "octane render, unreal engine quality, 8k resolution, sharp focus",
  "professional event production design, volumetric lighting",
  "premium materials, reflections, shadows, depth of field",
  "based strictly on event proposal requirements, accurate scale and layout, real-world event production design",
].join(",\n");

const CAMERA = [
  "wide angle shot, 24mm lens, eye-level perspective",
  "full scene visible, symmetrical composition",
  "cinematic framing, depth, foreground and background layers",
].join(",\n");

const NEGATIVE =
  "cartoon, illustration, 2D flat, watermark, text overlay, blurry, low resolution, amateur, stock photo, unrealistic proportions";

const EVENT_PROMPTS: Record<EventVisualInput["eventType"], string> = {
  booth:    "exhibition booth design, branded environment, illuminated bar counter, LED panels, backlit logo, premium display shelves, structured layout zones",
  stage:    "concert stage design, large LED wall, truss system, moving lights, smoke effects, massive stage presence, festival scale production setup",
  concert:  "live concert environment, crowd perspective, stage lighting beams, lasers, immersive visuals, energy and atmosphere",
  festival: "festival ground layout, multiple installations, brand zones, lighting installations, immersive experience",
};

const THEME_PROMPTS: Record<EventVisualInput["theme"], string> = {
  tropical:    "palm trees, warm lighting, wood textures, beach vibe, natural materials",
  luxury:      "gold accents, marble textures, soft ambient lighting, opulent materials, champagne palette",
  modern:      "minimal, clean lines, black and white, LED strips, geometric forms",
  gaming:      "RGB lighting, futuristic neon, digital screens, cyberpunk atmosphere",
  futuristic:  "holographic elements, chrome surfaces, electric blue accents, sci-fi aesthetic",
  corporate:   "professional, branded colours, clean layout, executive style, premium finishes",
  minimal:     "white space, subtle textures, soft diffused light, understated elegance",
  traditional: "warm wood tones, drapes, traditional motifs, cultural details, rich fabric textures",
};

// ── Premium boost ─────────────────────────────────────────────────────────────

function buildPremiumBoost(input: EventVisualInput): string {
  let boost = "";
  const budgetNum = parseFloat((input.budget ?? "").replace(/[^0-9.]/g, ""));
  if (!isNaN(budgetNum) && budgetNum > 500000) {
    boost = "luxury materials, gold accents, ultra premium lighting, high-end finish";
  }
  if (input.audienceType && /vip/i.test(input.audienceType)) {
    boost += (boost ? ", " : "") + "exclusive lounge seating, private bar sections";
  }
  return boost;
}

// ── Prompt builder ────────────────────────────────────────────────────────────

export function buildEventVisualPrompt(input: EventVisualInput): string {
  const premiumBoost = buildPremiumBoost(input);

  return [
    STYLE_LOCK,
    CAMERA,
    EVENT_PROMPTS[input.eventType],
    `brand: ${input.brandName}`,
    `size: ${input.dimensions}`,
    `theme: ${THEME_PROMPTS[input.theme]}`,
    `features: ${input.features.join(", ")}`,
    input.budget     ? `budget tier: ${input.budget}` : null,
    premiumBoost     || null,
    "high detail environment, realistic materials, people silhouettes for scale, premium event setup, designed by top event production agency",
    `negative: ${NEGATIVE}`,
  ].filter(Boolean).join(",\n");
}

// ── OpenAI call ───────────────────────────────────────────────────────────────

export async function generateEventVisual(input: EventVisualInput): Promise<EventVisualResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const { default: OpenAI } = await import("openai");
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = buildEventVisualPrompt(input);

  const response = await openai.images.generate({
    model:  "gpt-image-1",
    prompt,
    size:   "1536x1024",
  } as Parameters<typeof openai.images.generate>[0]) as { data?: unknown[] };

  const item = response.data?.[0];
  if (!item) throw new Error("No image returned from OpenAI.");

  const image = (item as { b64_json?: string }).b64_json
    ? `data:image/png;base64,${(item as { b64_json: string }).b64_json}`
    : (item as { url?: string }).url ?? null;

  if (!image) throw new Error("Unexpected image response format.");

  return { image, promptUsed: prompt };
}
