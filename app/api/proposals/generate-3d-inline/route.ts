import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import type { GeneratedVisual } from "@/lib/proposals";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "AI service not configured." }, { status: 503 });
  }

  const { proposalId, concept, theme, description, primaryColor } = await req.json();

  if (!proposalId || !concept) {
    return NextResponse.json({ error: "proposalId and concept required" }, { status: 400 });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const colorHint = primaryColor ? `, primary color ${primaryColor}` : "";
  const prompt = [
    `Photorealistic 3D rendering of an Indian luxury event setup.`,
    `Event concept: "${concept}".`,
    theme ? `Theme: ${theme}.` : "",
    description ? `Details: ${description}.` : "",
    `Color palette${colorHint}.`,
    `Wide-angle cinematic shot showing the full venue: stage, seating, lighting, and décor.`,
    `Style: premium event photography, dramatic uplighting, editorial quality.`,
  ].filter(Boolean).join(" ");

  let imageUrl: string;
  try {
    const res = await openai.images.generate({
      model:   "dall-e-3",
      prompt,
      n:       1,
      size:    "1792x1024",
      quality: "standard",
    });
    const url = res.data?.[0]?.url;
    if (!url) throw new Error("No image returned");
    imageUrl = url;
  } catch (err: any) {
    console.error("[generate-3d-inline] Generation failed:", err.message);
    return NextResponse.json({ error: "Image generation failed" }, { status: 500 });
  }

  // Save as GeneratedVisual to proposal.data.generatedVisuals
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

  const { data: row } = await supabase
    .from("proposals")
    .select("data")
    .eq("id", proposalId)
    .eq("user_id", auth.user.id)
    .single();

  if (!row) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });

  const existing = (row.data as Record<string, unknown>) ?? {};
  const existing_visuals: GeneratedVisual[] = Array.isArray(existing.generatedVisuals)
    ? (existing.generatedVisuals as GeneratedVisual[])
    : [];

  const visual: GeneratedVisual = {
    id:        crypto.randomUUID(),
    image:     imageUrl,
    promptUsed: prompt,
    createdAt: new Date().toISOString(),
    eventType: undefined,
    theme:     theme ?? undefined,
    brandName: concept,
  };

  const updated = [visual, ...existing_visuals].slice(0, 20);

  const { error: updateError } = await supabase
    .from("proposals")
    .update({ data: { ...existing, generatedVisuals: updated }, updated_at: new Date().toISOString() })
    .eq("id", proposalId)
    .eq("user_id", auth.user.id);

  if (updateError) {
    console.error("[generate-3d-inline] Save failed:", updateError);
    return NextResponse.json({ error: "Failed to save render" }, { status: 500 });
  }

  return NextResponse.json({ success: true, visual, imageUrl });
}
