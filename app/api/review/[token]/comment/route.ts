import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminClient } from "@/lib/supabase/admin";
import { parseJson, parseParams } from "@/lib/validate";
import { apiLimiter, limit } from "@/lib/ratelimit";

const ParamsSchema = z.object({ token: z.string().uuid() });

const BodySchema = z.object({
  authorName: z.string().trim().min(1).max(120),
  authorRole: z.enum(["client", "planner"]).default("client"),
  message:    z.string().trim().min(1).max(2000),
  sectionRef: z.enum(["concept", "budget", "timeline", "vendors", "visual", "compliance", "experience", "activation"]).optional(),
  parentId:   z.string().uuid().optional(),
});

const VALID_SECTIONS = new Set(["concept","budget","timeline","vendors","visual","compliance","experience","activation"]);

// POST /api/review/[token]/comment
// Public — adds a comment to the event_room.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const rawParams = await params;
  const parsed = parseParams(rawParams, ParamsSchema);
  if (parsed.error) return parsed.error;
  const { token } = parsed.data;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  const rl = await limit(apiLimiter, `review:${ip}`);
  if (rl) return rl;

  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const { data: room } = await admin
    .from("event_rooms")
    .select("id")
    .eq("share_token", token)
    .single();
  if (!room) return NextResponse.json({ error: "Link not found." }, { status: 404 });

  const { data: comments } = await admin
    .from("event_room_comments")
    .select("id, author_name, author_type, message, section_ref, parent_id, created_at")
    .eq("event_room_id", room.id)
    .order("created_at", { ascending: true });

  return NextResponse.json({ comments: comments ?? [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const rawParams = await params;
  const parsedParams = parseParams(rawParams, ParamsSchema);
  if (parsedParams.error) return parsedParams.error;
  const { token } = parsedParams.data;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  const rl = await limit(apiLimiter, `comment:${ip}`);
  if (rl) return rl;

  const parsedBody = await parseJson(req, BodySchema);
  if (parsedBody.error) return parsedBody.error;
  const { authorName, authorRole, message, sectionRef, parentId } = parsedBody.data;

  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const { data: room } = await admin
    .from("event_rooms")
    .select("id, proposal_id")
    .eq("share_token", token)
    .single();
  if (!room) return NextResponse.json({ error: "Link not found." }, { status: 404 });

  const { data: comment, error: insertErr } = await admin
    .from("event_room_comments")
    .insert({
      event_room_id: room.id,
      author_id:     null,
      author_name:   authorName,
      author_type:   authorRole,
      message,
      section_ref:   sectionRef && VALID_SECTIONS.has(sectionRef) ? sectionRef : null,
      type:          "comment",
      parent_id:     parentId ?? null,
    })
    .select("id, author_name, author_type, message, section_ref, parent_id, created_at")
    .single();

  if (insertErr || !comment) {
    console.error("[review/comment] insert failed:", insertErr?.message);
    return NextResponse.json({ error: "Could not save comment." }, { status: 500 });
  }

  // Log activity
  await admin.from("proposal_activity").insert({
    proposal_id:   room.proposal_id,
    event_room_id: room.id,
    actor_name:    authorName,
    actor_role:    authorRole,
    action:        sectionRef ? `Commented on ${sectionRef}` : "Left a comment",
    section:       sectionRef ?? null,
  });

  return NextResponse.json({ comment });
}
