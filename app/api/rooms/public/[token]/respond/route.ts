import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminClient } from "@/lib/supabase/admin";

const RespondSchema = z.object({
  action:  z.enum(["approved", "declined", "revision_requested"]),
  message: z.string().trim().max(2000).optional(),
});

const ACTION_STATUS: Record<string, string> = {
  approved:           "approved",
  declined:           "lost",
  revision_requested: "revision",
};

// POST /api/rooms/public/[token]/respond
// Public — client approves / declines / requests revision. Token is credential.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!token) return NextResponse.json({ error: "Invalid token." }, { status: 400 });

  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  let body: z.infer<typeof RespondSchema>;
  try {
    body = RespondSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Fetch room to verify token + check current status
  const { data: room, error: fetchErr } = await admin
    .from("event_rooms")
    .select("id, status, client_name, planner_id, proposal_id")
    .eq("share_token", token)
    .maybeSingle();

  if (fetchErr || !room) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }

  if (room.status === "won" || room.status === "lost") {
    return NextResponse.json({ error: "This deal is already closed." }, { status: 409 });
  }

  const newStatus = ACTION_STATUS[body.action];
  const clientResponse = {
    action:       body.action,
    message:      body.message ?? null,
    responded_at: new Date().toISOString(),
    client_name:  room.client_name,
  };

  const { data, error } = await admin
    .from("event_rooms")
    .update({ status: newStatus, client_response: clientResponse })
    .eq("id", room.id)
    .select("id, status, client_response")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Could not save response." }, { status: 500 });
  }

  // Sync proposal status so the dashboard pipeline updates.
  const PROPOSAL_STATUS: Record<string, string> = {
    approved:           "APPROVED",
    declined:           "LOST",
    revision_requested: "CHANGES_REQUESTED",
  };
  const proposalStatus = PROPOSAL_STATUS[body.action];
  if (room.proposal_id && proposalStatus) {
    const { data: propRow } = await admin
      .from("proposals")
      .select("data")
      .eq("id", room.proposal_id)
      .single();
    if (propRow) {
      void admin
        .from("proposals")
        .update({ data: { ...(propRow.data as object), status: proposalStatus } })
        .eq("id", room.proposal_id);
    }
  }

  // Mirror the client message into event_room_comments so the manager sees it.
  if (body.message && room.planner_id) {
    await admin.from("event_room_comments").insert({
      event_room_id: room.id,
      author_id:     room.planner_id,
      author_name:   room.client_name ?? "Client",
      author_type:   "client",
      message:       body.message,
      type:          body.action === "revision_requested" ? "request_change" : "comment",
      section_ref:   null,
      parent_id:     null,
    });
  }

  return NextResponse.json(data);
}
