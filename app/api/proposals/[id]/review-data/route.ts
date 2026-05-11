import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { parseParams } from "@/lib/validate";
import { apiLimiter, limit } from "@/lib/ratelimit";

const ParamsSchema = z.object({ id: z.string().uuid() });

// GET /api/proposals/[id]/review-data
// Authenticated planner — returns comments + activity + room metadata.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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

  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  // Verify ownership
  const { data: proposal } = await supabase
    .from("proposals")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!proposal) return NextResponse.json({ error: "Proposal not found." }, { status: 404 });

  const { data: room } = await admin
    .from("event_rooms")
    .select("id, share_token, status, section_approvals, view_count, last_viewed_at, client_name, client_response")
    .eq("proposal_id", id)
    .maybeSingle();

  if (!room) {
    return NextResponse.json({ room: null, comments: [], activity: [] });
  }

  const [commentsRes, activityRes] = await Promise.all([
    admin
      .from("event_room_comments")
      .select("id, author_name, author_type, message, section_ref, parent_id, created_at")
      .eq("event_room_id", room.id)
      .order("created_at", { ascending: true }),
    admin
      .from("proposal_activity")
      .select("id, actor_name, actor_role, action, section, metadata, created_at")
      .eq("proposal_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const origin = req.headers.get("origin") ?? req.headers.get("x-forwarded-host") ?? "";

  return NextResponse.json({
    room: {
      id:               room.id,
      shareToken:       room.share_token,
      shareUrl:         `${origin}/review/${room.share_token}`,
      status:           room.status,
      sectionApprovals: room.section_approvals ?? {},
      viewCount:        room.view_count ?? 0,
      lastViewedAt:     room.last_viewed_at,
      clientName:       room.client_name,
      clientResponse:   room.client_response,
    },
    comments: commentsRes.data ?? [],
    activity: activityRes.data ?? [],
  });
}
