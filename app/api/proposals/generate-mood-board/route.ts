import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "AI service not configured." }, { status: 503 });
  }

  const { proposalId, concept, theme, colors } = await req.json();

  if (!proposalId || !concept) {
    return NextResponse.json({ error: "proposalId and concept required" }, { status: 400 });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompts = buildPrompts(concept, theme, colors);
  const imageUrls: string[] = [];

  for (const prompt of prompts) {
    try {
      const res = await openai.images.generate({
        model:   "dall-e-3",
        prompt,
        n:       1,
        size:    "1024x1024",
        quality: "standard",
      });
      const url = res.data?.[0]?.url;
      if (url) imageUrls.push(url);
    } catch (err: any) {
      console.warn("[generate-mood-board] Image skipped:", err.message);
    }
  }

  if (imageUrls.length === 0) {
    return NextResponse.json({ error: "Failed to generate any images" }, { status: 500 });
  }

  // Proposals are stored as JSONB in the data column — merge images into data
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const { data: row } = await supabase
    .from("proposals")
    .select("data")
    .eq("id", proposalId)
    .eq("user_id", auth.user.id)
    .single();

  if (!row) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  const merged = { ...(row.data as object), mood_board_images: imageUrls, updated_at: new Date().toISOString() };

  const { error: updateError } = await supabase
    .from("proposals")
    .update({ data: merged, updated_at: new Date().toISOString() })
    .eq("id", proposalId)
    .eq("user_id", auth.user.id);

  if (updateError) {
    console.error("[generate-mood-board] Update error:", updateError);
    return NextResponse.json({ error: "Failed to save images" }, { status: 500 });
  }

  return NextResponse.json({ success: true, images: imageUrls, count: imageUrls.length });
}

function buildPrompts(concept: string, theme?: string, colors?: { name: string }[]): string[] {
  const colorStr  = colors?.map((c) => c.name).join(", ") || "sophisticated neutrals";
  const themeStr  = theme || concept;
  const base      = `Professional luxury event mood board, high-end event design photography, premium aesthetic, India`;

  return [
    `${base}. Concept: ${concept}. Elegant venue decoration with ${colorStr} color palette. Upscale event styling.`,
    `${base}. Theme: ${themeStr}. Dramatic stage and focal point, cinematic lighting. Professional event production.`,
    `${base}. Concept: ${concept}. Full event atmosphere and ambiance. Color scheme: ${colorStr}.`,
  ];
}
