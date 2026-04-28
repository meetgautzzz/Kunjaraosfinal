// Save the current proposal as a re-usable template.
// Templates are stored as duplicate rows in the proposals table with
// data.isTemplate = true and data.templateName = <user-supplied name>.
// They show up in /proposals filtered out of the main list.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { parseJson, parseParams } from "@/lib/validate";
import { apiLimiter, limit } from "@/lib/ratelimit";

const ParamsSchema = z.object({ id: z.string().uuid() });
const BodySchema   = z.object({ name: z.string().trim().min(1).max(120) });

export async function POST(
  req:  NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rawParams = await params;
  const parsedParams = parseParams(rawParams, ParamsSchema);
  if (parsedParams.error) return parsedParams.error;

  const parsedBody = await parseJson(req, BodySchema);
  if (parsedBody.error) return parsedBody.error;

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const rl = await limit(apiLimiter, `user:${user.id}`);
  if (rl) return rl;

  // Pull the source proposal under user_id scope.
  const { data: row, error: readErr } = await supabase
    .from("proposals")
    .select("data")
    .eq("id", parsedParams.data.id)
    .eq("user_id", user.id)
    .single();

  if (readErr || !row) {
    return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  }

  const source = (row.data ?? {}) as Record<string, unknown>;
  const now = new Date().toISOString();
  const newId = randomUUID();

  // Build a clean template snapshot:
  //  - Strip client PII (templates are reusable across clients)
  //  - Strip versions[] / clientResponse — those are per-instance
  //  - Tag isTemplate + templateName so the list endpoint can filter
  const templateData: Record<string, unknown> = {
    ...source,
    id:                 newId,
    isTemplate:         true,
    templateName:       parsedBody.data.name,
    title:              parsedBody.data.name,
    status:             "TEMPLATE",
    client:             undefined,
    clientResponse:     undefined,
    versions:           [],
    regenerationsUsed:  0,
    activeVersionLabel: "v1",
    createdAt:          now,
    updatedAt:          now,
  };

  const { error: writeErr } = await supabase
    .from("proposals")
    .insert({ id: newId, user_id: user.id, data: templateData });

  if (writeErr) {
    console.error("[save-template] insert failed:", writeErr.message);
    return NextResponse.json({ error: "Could not save template." }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: newId, name: parsedBody.data.name });
}
