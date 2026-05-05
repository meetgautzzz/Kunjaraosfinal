import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseJson, parseParams } from "@/lib/validate";
import { apiLimiter, limit } from "@/lib/ratelimit";

const ParamsSchema = z.object({
  id:        z.string().uuid(),
  commentId: z.string().uuid(),
});

const PatchSchema = z.object({
  message: z.string().trim().min(1).max(4000),
}).strict();

// PATCH /api/rooms/[id]/comments/[commentId] — edit message (author only).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const parsed = parseParams(await params, ParamsSchema);
  if (parsed.error) return parsed.error;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const rl = await limit(apiLimiter, `user:${user.id}`);
  if (rl) return rl;

  const body = await parseJson(req, PatchSchema);
  if (body.error) return body.error;

  // Only the author can edit; RLS already scopes to planner-owned rooms.
  const { data, error } = await supabase
    .from("event_room_comments")
    .update({ message: body.data.message })
    .eq("id", parsed.data.commentId)
    .eq("event_room_id", parsed.data.id)
    .eq("author_id", user.id)   // author-only gate
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Comment not found or you are not the author." },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}

// DELETE /api/rooms/[id]/comments/[commentId] — delete (author or room owner).
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const parsed = parseParams(await params, ParamsSchema);
  if (parsed.error) return parsed.error;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const rl = await limit(apiLimiter, `user:${user.id}`);
  if (rl) return rl;

  // Allow delete if the user is the comment author OR the room owner.
  const { data: comment } = await supabase
    .from("event_room_comments")
    .select("id, author_id, event_room_id")
    .eq("id", parsed.data.commentId)
    .eq("event_room_id", parsed.data.id)
    .single();

  if (!comment) {
    return NextResponse.json({ error: "Comment not found." }, { status: 404 });
  }

  const isAuthor  = comment.author_id === user.id;
  const isPlanner = await supabase
    .from("event_rooms")
    .select("id")
    .eq("id", parsed.data.id)
    .eq("planner_id", user.id)
    .single()
    .then(({ data }) => !!data);

  if (!isAuthor && !isPlanner) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  await supabase
    .from("event_room_comments")
    .delete()
    .eq("id", parsed.data.commentId);

  return NextResponse.json({ success: true });
}
