import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseJson, parseParams } from "@/lib/validate";
import { apiLimiter, limit } from "@/lib/ratelimit";
import type { GeneratedVisual } from "@/lib/proposals";

const ParamsSchema = z.object({ id: z.string().uuid() });

const BodySchema = z.object({
  id:         z.string().uuid(),
  image:      z.string().min(1),
  promptUsed: z.string(),
  createdAt:  z.string(),
  eventType:  z.string().optional(),
  theme:      z.string().optional(),
  brandName:  z.string().optional(),
});

// POST /api/proposals/[id]/visuals — append a generated visual to the proposal
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rawParams = await params;
  const parsed = parseParams(rawParams, ParamsSchema);
  if (parsed.error) return parsed.error;
  const { id } = parsed.data;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const rl = await limit(apiLimiter, `user:${user.id}`);
  if (rl) return rl;

  const body = await parseJson(req, BodySchema);
  if (body.error) return body.error;

  // Fetch existing proposal data
  const { data: row, error: fetchErr } = await supabase
    .from("proposals")
    .select("id, data")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchErr || !row) {
    return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  }

  const existing = (row.data as Record<string, unknown>) ?? {};
  const visuals: GeneratedVisual[] = Array.isArray(existing.generatedVisuals)
    ? existing.generatedVisuals as GeneratedVisual[]
    : [];

  // Prepend new visual (newest first), cap at 20
  const updated = [body.data as GeneratedVisual, ...visuals].slice(0, 20);

  const { error: patchErr } = await supabase
    .from("proposals")
    .update({ data: { ...existing, generatedVisuals: updated } })
    .eq("id", id)
    .eq("user_id", user.id);

  if (patchErr) {
    return NextResponse.json({ error: "Failed to save visual." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, total: updated.length });
}

// DELETE /api/proposals/[id]/visuals?visualId=xxx — remove a single visual
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rawParams = await params;
  const parsed = parseParams(rawParams, ParamsSchema);
  if (parsed.error) return parsed.error;
  const { id } = parsed.data;

  const visualId = req.nextUrl.searchParams.get("visualId");
  if (!visualId) return NextResponse.json({ error: "visualId required." }, { status: 400 });

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { data: row, error: fetchErr } = await supabase
    .from("proposals")
    .select("id, data")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchErr || !row) {
    return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  }

  const existing = (row.data as Record<string, unknown>) ?? {};
  const visuals: GeneratedVisual[] = Array.isArray(existing.generatedVisuals)
    ? (existing.generatedVisuals as GeneratedVisual[]).filter((v) => v.id !== visualId)
    : [];

  await supabase
    .from("proposals")
    .update({ data: { ...existing, generatedVisuals: visuals } })
    .eq("id", id)
    .eq("user_id", user.id);

  return NextResponse.json({ ok: true, total: visuals.length });
}
