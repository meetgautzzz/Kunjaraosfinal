import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminClient } from "@/lib/supabase/admin";
import { parseParams } from "@/lib/validate";
import { apiLimiter, limit } from "@/lib/ratelimit";

const ParamsSchema = z.object({ token: z.string().uuid() });

// GET /api/review/[token]
// Public — loads proposal + room metadata by share_token.
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

  const { data: room, error } = await admin
    .from("event_rooms")
    .select("id, proposal_id, planner_id, status, section_approvals, view_count, client_name, client_response")
    .eq("share_token", token)
    .single();

  if (error || !room) return NextResponse.json({ error: "Link not found or expired." }, { status: 404 });

  const { data: proposal } = await admin
    .from("proposals")
    .select("id, data, user_id")
    .eq("id", room.proposal_id)
    .single();

  if (!proposal) return NextResponse.json({ error: "Proposal not found." }, { status: 404 });

  // Bump view count + timestamp
  await admin
    .from("event_rooms")
    .update({ view_count: (room.view_count ?? 0) + 1, last_viewed_at: new Date().toISOString() })
    .eq("id", room.id);

  // Planner branding
  let branding: Record<string, string> = {};
  const { data: profile } = await admin
    .from("profiles")
    .select("company_name, phone_number, logo_url")
    .eq("id", proposal.user_id)
    .maybeSingle();
  if (profile) branding = profile;

  return NextResponse.json({
    proposal: { ...(proposal.data as Record<string, unknown>), id: proposal.id },
    room: {
      id:               room.id,
      status:           room.status,
      sectionApprovals: room.section_approvals ?? {},
      clientName:       room.client_name,
    },
    branding,
  }, { headers: { "Cache-Control": "private, no-store" } });
}
