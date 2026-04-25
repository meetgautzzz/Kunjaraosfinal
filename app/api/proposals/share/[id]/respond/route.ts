import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { parseJson, parseParams } from "@/lib/validate";
import { apiLimiter, limit } from "@/lib/ratelimit";

const ParamsSchema = z.object({ id: z.string().uuid() });

const BodySchema = z.object({
  action:     z.enum(["APPROVED", "CHANGES_REQUESTED"]),
  clientName: z.string().trim().min(1).max(120),
  comment:    z.string().trim().max(2000).optional().default(""),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rawParams = await params;
  const parsedParams = parseParams(rawParams, ParamsSchema);
  if (parsedParams.error) return parsedParams.error;
  const { id } = parsedParams.data;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  const rl = await limit(apiLimiter, `respond:${ip}`);
  if (rl) return rl;

  const parsedBody = await parseJson(req, BodySchema);
  if (parsedBody.error) return parsedBody.error;
  const { action, clientName, comment } = parsedBody.data;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
  }
  const admin = createSupabaseAdmin(url, serviceKey);

  const { data: existing, error: readErr } = await admin
    .from("proposals")
    .select("id, data")
    .eq("id", id)
    .single();

  if (readErr || !existing) {
    return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  }

  const current = (existing.data ?? {}) as Record<string, unknown>;

  // Once a client has responded, lock further responses to prevent the
  // share link being used to overwrite an existing decision.
  if (current.clientResponse) {
    return NextResponse.json(
      { error: "This proposal has already received a response." },
      { status: 409 }
    );
  }

  const nextData = {
    ...current,
    status: action,
    clientResponse: {
      action,
      clientName,
      comment,
      respondedAt: new Date().toISOString(),
    },
  };

  const { error: writeErr } = await admin
    .from("proposals")
    .update({ data: nextData, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (writeErr) {
    console.error("[share/respond] write failed:", writeErr.message);
    return NextResponse.json({ error: "Could not record response." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status: action });
}
