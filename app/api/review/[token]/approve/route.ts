import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminClient } from "@/lib/supabase/admin";
import { parseJson, parseParams } from "@/lib/validate";
import { apiLimiter, limit } from "@/lib/ratelimit";

const ParamsSchema = z.object({ token: z.string().uuid() });

const SectionStatus = z.enum(["pending", "approved", "changes_requested", "rejected"]);

const BodySchema = z.object({
  clientName: z.string().trim().min(1).max(120),
  // Section-level OR proposal-level
  section:    z.enum(["concept","budget","timeline","vendors","visual","compliance","experience","activation"]).optional(),
  status:     SectionStatus,
  note:       z.string().trim().max(1000).optional(),
  // When no section is given, this is a proposal-level action
  proposalAction: z.enum(["approved", "changes_requested", "rejected"]).optional(),
});

const ROOM_STATUS_MAP: Record<string, string> = {
  approved:           "approved",
  changes_requested:  "revision",
  rejected:           "lost",
};

// POST /api/review/[token]/approve
// Public — updates section approval status and/or overall proposal status.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const rawParams = await params;
  const parsedParams = parseParams(rawParams, ParamsSchema);
  if (parsedParams.error) return parsedParams.error;
  const { token } = parsedParams.data;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  const rl = await limit(apiLimiter, `approve:${ip}`);
  if (rl) return rl;

  const parsedBody = await parseJson(req, BodySchema);
  if (parsedBody.error) return parsedBody.error;
  const { clientName, section, status, note, proposalAction } = parsedBody.data;

  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const { data: room } = await admin
    .from("event_rooms")
    .select("id, proposal_id, section_approvals, status")
    .eq("share_token", token)
    .single();
  if (!room) return NextResponse.json({ error: "Link not found." }, { status: 404 });

  const updates: Record<string, unknown> = {};

  if (section) {
    const current = (room.section_approvals ?? {}) as Record<string, unknown>;
    updates.section_approvals = { ...current, [section]: { status, note: note ?? "", by: clientName, at: new Date().toISOString() } };
  }

  if (proposalAction) {
    updates.status = ROOM_STATUS_MAP[proposalAction] ?? room.status;
    updates.client_response = {
      action:      proposalAction.toUpperCase(),
      clientName,
      comment:     note ?? "",
      respondedAt: new Date().toISOString(),
    };
    updates.updated_at = new Date().toISOString();
  }

  if (Object.keys(updates).length > 0) {
    await admin.from("event_rooms").update(updates).eq("id", room.id);
  }

  // Log activity
  await admin.from("proposal_activity").insert({
    proposal_id:   room.proposal_id,
    event_room_id: room.id,
    actor_name:    clientName,
    actor_role:    "client",
    action:        section
      ? `${status === "approved" ? "Approved" : status === "changes_requested" ? "Requested changes on" : "Rejected"} ${section}`
      : `${proposalAction ?? status} proposal`,
    section: section ?? null,
    metadata: note ? { note } : null,
  });

  const { data: updated } = await admin
    .from("event_rooms")
    .select("status, section_approvals")
    .eq("id", room.id)
    .single();

  return NextResponse.json({
    ok:               true,
    status:           updated?.status,
    sectionApprovals: updated?.section_approvals ?? {},
  });
}
