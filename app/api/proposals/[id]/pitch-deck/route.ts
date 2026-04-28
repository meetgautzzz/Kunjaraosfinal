import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { parseJson, parseParams } from "@/lib/validate";
import { requireAiCredits } from "@/lib/ai/middleware";
import { aiError, aiSuccess } from "@/lib/ai/responses";
import { chatWithFallback } from "@/lib/ai/fallback";
import type { ProposalData, PitchSlide } from "@/lib/proposals";
import {
  PITCH_DECK_SYSTEM_PROMPT,
  buildPitchDeckUserMessage,
  DEFAULT_SLIDE_COUNT,
  MIN_SLIDE_COUNT,
  MAX_SLIDE_COUNT,
} from "@/lib/pitchDeckPrompt";

// Slide generation is a large JSON call — can take 30-60 s.
export const maxDuration = 60;

const ParamsSchema = z.object({ id: z.string().uuid() });

const GenerateBodySchema = z.object({
  tone:       z.string().trim().min(1).max(100).default("Professional & Authoritative"),
  slideCount: z.number().int().min(MIN_SLIDE_COUNT).max(MAX_SLIDE_COUNT).default(DEFAULT_SLIDE_COUNT),
});

const SaveBodySchema = z.object({
  slides: z.array(z.object({
    title:         z.string().trim().min(1).max(300),
    bullets:       z.array(z.string().trim().max(300)).min(1).max(10),
    speaker_notes: z.string().trim().max(3000),
    image_prompt:  z.string().trim().max(1000).optional(),
  })).min(1).max(MAX_SLIDE_COUNT),
  tone:       z.string().trim().max(100).optional(),
  slideCount: z.number().int().optional(),
});

// ── GET — fetch saved pitch deck from proposal data ──────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rawParams = await params;
  const parsed = parseParams(rawParams, ParamsSchema);
  if (parsed.error) return parsed.error;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { data: row, error } = await supabase
    .from("proposals")
    .select("data")
    .eq("id", parsed.data.id)
    .eq("user_id", user.id)
    .single();

  if (error || !row) return NextResponse.json({ error: "Proposal not found." }, { status: 404 });

  const proposal = row.data as ProposalData;
  return NextResponse.json({ pitchDeck: proposal.pitchDeck ?? null });
}

// ── POST — generate a new pitch deck via AI ───────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!process.env.OPENAI_API_KEY) {
    return aiError("SERVICE_UNAVAILABLE", "AI service not configured.", 503);
  }

  const rawParams = await params;
  const parsedParams = parseParams(rawParams, ParamsSchema);
  if (parsedParams.error) return aiError("VALIDATION_ERROR", "Invalid request.", 400);

  // Detect whether this is a generate call or a save call by checking for "slides" key.
  let rawBody: unknown;
  try { rawBody = await req.json(); } catch { rawBody = {}; }

  if (rawBody && typeof rawBody === "object" && "slides" in (rawBody as object)) {
    return handleSave(parsedParams.data.id, rawBody);
  }
  return handleGenerate(req, parsedParams.data.id, rawBody);
}

// ── Generate: call AI ────────────────────────────────────────────────────────

async function handleGenerate(req: NextRequest, id: string, rawBody: unknown) {
  const bodyResult = GenerateBodySchema.safeParse(rawBody ?? {});
  if (!bodyResult.success) return aiError("VALIDATION_ERROR", "Invalid request body.", 400);
  const { tone, slideCount } = bodyResult.data;

  const supabase = await createClient();
  if (!supabase) return aiError("SERVICE_UNAVAILABLE", "Service unavailable.", 503);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return aiError("UNAUTHORIZED", "Unauthorized.", 401);

  const { data: row, error: readErr } = await supabase
    .from("proposals")
    .select("data")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (readErr || !row) return aiError("VALIDATION_ERROR", "Proposal not found.", 404);
  const proposal = row.data as ProposalData;

  const userMessage = buildPitchDeckUserMessage(proposal, tone, slideCount);

  const pre = await requireAiCredits({
    req,
    action:       "proposal",
    promptLength: userMessage.length,
    eventId:      id,
  });
  if (!pre.ok) return pre.res;
  const { ctx } = pre;

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const fb = await chatWithFallback(openai, {
    temperature: 0.55,
    messages: [
      { role: "system", content: PITCH_DECK_SYSTEM_PROMPT },
      { role: "user",   content: userMessage },
    ],
    response_format: { type: "json_object" },
  }, "pitch-deck");

  if (!fb.ok) {
    await ctx.refund("openai_error");
    return aiError("AI_ERROR", `Generation failed: ${fb.lastError.message ?? "unknown"}`, 502);
  }

  const content = fb.response.choices[0]?.message?.content;
  if (!content) {
    await ctx.refund("empty_response");
    return aiError("AI_ERROR", "AI returned an empty response.", 502);
  }

  let parsed: { slides?: PitchSlide[] };
  try { parsed = JSON.parse(content); } catch {
    await ctx.refund("json_parse");
    return aiError("AI_ERROR", "AI returned invalid JSON.", 502);
  }

  if (!parsed.slides || !Array.isArray(parsed.slides) || parsed.slides.length === 0) {
    await ctx.refund("no_slides");
    return aiError("AI_ERROR", "AI did not return slides.", 502);
  }

  // Sanitize slides — strip any keys we don't expect
  const slides: PitchSlide[] = parsed.slides.slice(0, MAX_SLIDE_COUNT).map((s) => ({
    title:         String(s.title        ?? "").slice(0, 300),
    bullets:       (Array.isArray(s.bullets) ? s.bullets : []).map((b) => String(b).slice(0, 300)),
    speaker_notes: String(s.speaker_notes ?? "").slice(0, 3000),
    ...(s.image_prompt ? { image_prompt: String(s.image_prompt).slice(0, 1000) } : {}),
  }));

  const now     = new Date().toISOString();
  const deckId  = randomUUID();
  const existing = (row.data as ProposalData).pitchDeck;
  const pitchDeck = {
    deckId,
    slides,
    version:    (existing?.version ?? 0) + 1,
    tone,
    slideCount,
    createdAt:  existing?.createdAt ?? now,
    updatedAt:  now,
  };

  // Persist into proposal.data.pitchDeck
  const updatedData = { ...(row.data as ProposalData), pitchDeck, updatedAt: now };
  const { error: writeErr } = await supabase
    .from("proposals")
    .update({ data: updatedData, updated_at: now })
    .eq("id", id)
    .eq("user_id", user.id);

  if (writeErr) {
    console.error("[pitch-deck] persist failed:", writeErr.message);
    // Return generated slides in-memory even if persist fails
  }

  const remaining = await ctx.finish({
    tokensUsed: fb.response.usage?.total_tokens ?? null,
    eventId:    id,
  });

  return aiSuccess({ pitchDeck }, ctx.creditsCharged, remaining);
}

// ── Save: persist user-edited slides ────────────────────────────────────────

async function handleSave(id: string, rawBody: unknown) {
  const bodyResult = SaveBodySchema.safeParse(rawBody);
  if (!bodyResult.success) {
    return NextResponse.json({ error: "Invalid slides payload." }, { status: 400 });
  }

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { data: row, error: readErr } = await supabase
    .from("proposals")
    .select("data")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (readErr || !row) return NextResponse.json({ error: "Proposal not found." }, { status: 404 });

  const now = new Date().toISOString();
  const existing = (row.data as ProposalData).pitchDeck;
  const pitchDeck = {
    deckId:     existing?.deckId     ?? randomUUID(),
    slides:     bodyResult.data.slides,
    version:    (existing?.version   ?? 0) + 1,
    tone:       bodyResult.data.tone ?? existing?.tone ?? "Professional & Authoritative",
    slideCount: bodyResult.data.slides.length,
    createdAt:  existing?.createdAt  ?? now,
    updatedAt:  now,
  };

  const updatedData = { ...(row.data as ProposalData), pitchDeck, updatedAt: now };
  const { error: writeErr } = await supabase
    .from("proposals")
    .update({ data: updatedData, updated_at: now })
    .eq("id", id)
    .eq("user_id", user.id);

  if (writeErr) {
    console.error("[pitch-deck/save] write failed:", writeErr.message);
    return NextResponse.json({ error: "Could not save deck." }, { status: 500 });
  }

  return NextResponse.json({ success: true, pitchDeck });
}
