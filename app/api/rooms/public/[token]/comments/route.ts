import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminClient } from "@/lib/supabase/admin";

const PostSchema = z.object({
  message: z.string().trim().min(1).max(2000),
});

// GET  /api/rooms/public/[token]/comments — list all comments for this room
// POST /api/rooms/public/[token]/comments — client posts a comment
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const { data: room, error: roomErr } = await admin
    .from("event_rooms")
    .select("id")
    .eq("share_token", token)
    .maybeSingle();

  if (roomErr || !room) return NextResponse.json({ error: "Room not found." }, { status: 404 });

  const { data, error } = await admin
    .from("event_room_comments")
    .select("id, author_name, author_type, message, type, section_ref, parent_id, created_at")
    .eq("event_room_id", room.id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: "Could not fetch comments." }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  let body: z.infer<typeof PostSchema>;
  try {
    body = PostSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { data: room, error: roomErr } = await admin
    .from("event_rooms")
    .select("id, client_name, planner_id, status")
    .eq("share_token", token)
    .maybeSingle();

  if (roomErr || !room) return NextResponse.json({ error: "Room not found." }, { status: 404 });
  if (room.status === "won" || room.status === "lost") {
    return NextResponse.json({ error: "This deal is already closed." }, { status: 409 });
  }
  if (!room.planner_id) return NextResponse.json({ error: "Room misconfigured." }, { status: 500 });

  const { data, error } = await admin
    .from("event_room_comments")
    .insert({
      event_room_id: room.id,
      author_id:     room.planner_id,
      author_name:   room.client_name ?? "Client",
      author_type:   "client",
      message:       body.message,
      type:          "comment",
      section_ref:   null,
      parent_id:     null,
    })
    .select("id, author_name, author_type, message, type, section_ref, parent_id, created_at")
    .single();

  if (error || !data) return NextResponse.json({ error: "Could not save comment." }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
