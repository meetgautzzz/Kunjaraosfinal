import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseJson, parseParams } from "@/lib/validate";
import { apiLimiter, limit } from "@/lib/ratelimit";

const ParamsSchema = z.object({ id: z.string().uuid() });

const CreateSchema = z.object({
  label: z.string().trim().max(200).optional(),
}).strict();

// GET /api/rooms/[id]/versions — list all snapshots for this room.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const parsed = parseParams(await params, ParamsSchema);
  if (parsed.error) return parsed.error;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const rl = await limit(apiLimiter, `user:${user.id}`);
  if (rl) return rl;

  const { data, error } = await supabase
    .from("proposal_versions")
    .select("id, version_number, label, created_by, created_at")
    .eq("event_room_id", parsed.data.id)
    .order("version_number", { ascending: false });

  if (error) {
    console.error("[versions GET]", error.message);
    return NextResponse.json({ error: "Could not fetch versions." }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

// POST /api/rooms/[id]/versions — snapshot current proposal data.
// Idempotent: never overwrites existing snapshots.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const parsed = parseParams(await params, ParamsSchema);
  if (parsed.error) return parsed.error;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const rl = await limit(apiLimiter, `user:${user.id}`);
  if (rl) return rl;

  const body = await parseJson(req, CreateSchema);
  if (body.error) return body.error;

  // Fetch the room + its proposal in one query.
  const { data: room } = await supabase
    .from("event_rooms")
    .select("id, proposal_id")
    .eq("id", parsed.data.id)
    .eq("planner_id", user.id)
    .single();

  if (!room) return NextResponse.json({ error: "Room not found." }, { status: 404 });

  const { data: proposal } = await supabase
    .from("proposals")
    .select("data")
    .eq("id", room.proposal_id)
    .eq("user_id", user.id)
    .single();

  if (!proposal) return NextResponse.json({ error: "Proposal not found." }, { status: 404 });

  // Determine the next version number.
  const { data: latest } = await supabase
    .from("proposal_versions")
    .select("version_number")
    .eq("event_room_id", parsed.data.id)
    .order("version_number", { ascending: false })
    .limit(1)
    .single();

  const nextVersion = ((latest as any)?.version_number ?? 0) + 1;

  const { data: version, error } = await supabase
    .from("proposal_versions")
    .insert({
      event_room_id:  parsed.data.id,
      proposal_id:    room.proposal_id,
      version_number: nextVersion,
      data_snapshot:  proposal.data,
      label:          body.data.label ?? null,
      created_by:     user.id,
    })
    .select()
    .single();

  if (error) {
    console.error("[versions POST]", error.message);
    return NextResponse.json({ error: "Could not create snapshot." }, { status: 500 });
  }

  return NextResponse.json(version, { status: 201 });
}
