import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { parseParams } from "@/lib/validate";
import { apiLimiter, limit } from "@/lib/ratelimit";

const ParamsSchema = z.object({ id: z.string().uuid() });

// POST /api/proposals/[id]/share-link
// Returns (or creates) the event_room for this proposal and the share URL.
export async function POST(
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

  // Verify ownership
  const { data: proposal } = await supabase
    .from("proposals")
    .select("id, data")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!proposal) return NextResponse.json({ error: "Proposal not found." }, { status: 404 });

  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  // Upsert event_room — one per proposal
  const { data: room, error: roomErr } = await admin
    .from("event_rooms")
    .upsert(
      { proposal_id: id, planner_id: user.id },
      { onConflict: "proposal_id", ignoreDuplicates: false },
    )
    .select("id, share_token, status, section_approvals")
    .single();

  if (roomErr || !room) {
    console.error("[share-link] upsert event_room failed:", roomErr?.message);
    return NextResponse.json({ error: "Could not create share link." }, { status: 500 });
  }

  // Mark proposal as SHARED
  await admin
    .from("proposals")
    .update({ data: { ...(proposal.data as Record<string, unknown>), status: "SHARED" }, updated_at: new Date().toISOString() })
    .eq("id", id);

  // Log activity
  const pData = proposal.data as Record<string, unknown>;
  await admin.from("proposal_activity").insert({
    proposal_id:   id,
    event_room_id: room.id,
    actor_name:    "Planner",
    actor_role:    "planner",
    action:        "Sent proposal for review",
    metadata:      { title: pData.title },
  });

  const origin = req.headers.get("origin") ?? req.headers.get("x-forwarded-host") ?? "";
  const shareUrl = `${origin}/review/${room.share_token}`;

  return NextResponse.json({
    roomId:           room.id,
    shareToken:       room.share_token,
    shareUrl,
    status:           room.status,
    sectionApprovals: room.section_approvals ?? {},
  });
}

// GET /api/proposals/[id]/share-link
// Returns the existing event_room for this proposal (if any) without creating one.
export async function GET(
  _req: NextRequest,
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

  const { data: room } = await supabase
    .from("event_rooms")
    .select("id, share_token, status, section_approvals, view_count, last_viewed_at")
    .eq("proposal_id", id)
    .eq("planner_id", user.id)
    .maybeSingle();

  if (!room) return NextResponse.json({ exists: false });

  const origin = _req.headers.get("origin") ?? _req.headers.get("x-forwarded-host") ?? "";
  return NextResponse.json({
    exists:           true,
    roomId:           room.id,
    shareToken:       room.share_token,
    shareUrl:         `${origin}/review/${room.share_token}`,
    status:           room.status,
    sectionApprovals: room.section_approvals ?? {},
    viewCount:        room.view_count ?? 0,
    lastViewedAt:     room.last_viewed_at,
  });
}
