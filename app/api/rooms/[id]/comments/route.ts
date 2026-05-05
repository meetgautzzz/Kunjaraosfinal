import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseJson, parseParams } from "@/lib/validate";
import { apiLimiter, limit } from "@/lib/ratelimit";

const ParamsSchema = z.object({ id: z.string().uuid() });

const SECTION_REFS = [
  "concept","budget","timeline","vendors",
  "visual","compliance","experience","activation",
] as const;

const CreateSchema = z.object({
  message:     z.string().trim().min(1).max(4000),
  section_ref: z.enum(SECTION_REFS).nullable().optional(),
  type:        z.enum(["comment","request_change","approval"]).optional(),
  parent_id:   z.string().uuid().nullable().optional(),
});

// GET /api/rooms/[id]/comments — flat list sorted by created_at.
// Nesting (replies) is assembled client-side to keep the query simple.
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

  // Confirm the room belongs to this planner before returning its comments.
  const { data: room } = await supabase
    .from("event_rooms")
    .select("id")
    .eq("id", parsed.data.id)
    .eq("planner_id", user.id)
    .single();

  if (!room) return NextResponse.json({ error: "Room not found." }, { status: 404 });

  const { data, error } = await supabase
    .from("event_room_comments")
    .select("*")
    .eq("event_room_id", parsed.data.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[comments GET]", error.message);
    return NextResponse.json({ error: "Could not fetch comments." }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

// POST /api/rooms/[id]/comments — add a comment to the room thread.
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

  // Confirm ownership of the room.
  const { data: room } = await supabase
    .from("event_rooms")
    .select("id, status")
    .eq("id", parsed.data.id)
    .eq("planner_id", user.id)
    .single();

  if (!room) return NextResponse.json({ error: "Room not found." }, { status: 404 });
  if (room.status === "won" || room.status === "lost") {
    return NextResponse.json(
      { error: "Cannot add comments to a closed room." },
      { status: 409 }
    );
  }

  const body = await parseJson(req, CreateSchema);
  if (body.error) return body.error;

  // Fetch the planner's display name from their profile.
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const authorName = (profile as any)?.full_name ?? user.email?.split("@")[0] ?? "Planner";

  const { data: comment, error } = await supabase
    .from("event_room_comments")
    .insert({
      event_room_id: parsed.data.id,
      author_id:     user.id,
      author_name:   authorName,
      author_type:   "planner",
      message:       body.data.message,
      section_ref:   body.data.section_ref ?? null,
      type:          body.data.type ?? "comment",
      parent_id:     body.data.parent_id ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error("[comments POST]", error.message);
    return NextResponse.json({ error: "Could not save comment." }, { status: 500 });
  }

  return NextResponse.json(comment, { status: 201 });
}
