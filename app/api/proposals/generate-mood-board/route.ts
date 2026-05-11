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

  const prompt = buildTriptychPrompt(concept, theme, colors);
  const imageUrls: string[] = [];

  try {
    const res = await openai.images.generate({
      model:   "dall-e-3",
      prompt,
      n:       1,
      size:    "1792x1024",  // landscape — best for a 3-panel triptych
      quality: "standard",
    });
    const url = res.data?.[0]?.url;
    if (url) imageUrls.push(url);
  } catch (err: any) {
    console.error("[generate-mood-board] Image generation failed:", err.message);
    return NextResponse.json({ error: "Failed to generate mood board image" }, { status: 500 });
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

function buildTriptychPrompt(concept: string, theme?: string, colors?: { name: string }[]): string {
  const colorStr = colors?.map((c) => c.name).join(", ") || "sophisticated neutrals";
  const themeStr = theme || concept;

  return (
    `A luxury event mood board triptych — three side-by-side panels in one wide image, separated by thin gold lines. ` +
    `No text, no labels, no borders other than the dividers. ` +
    `Left panel: elegant venue decoration and tablescapes with ${colorStr} color palette for a ${concept} event. ` +
    `Center panel: dramatic stage focal point and cinematic uplighting for a ${themeStr} theme, India. ` +
    `Right panel: grand entrance and overall event atmosphere, ${colorStr} tones, luxury Indian event aesthetic. ` +
    `High-end editorial photography style, cohesive color grading across all three panels, premium event production.`
  );
}
