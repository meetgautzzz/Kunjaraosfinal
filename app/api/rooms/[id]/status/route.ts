import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseJson, parseParams } from "@/lib/validate";
import { apiLimiter, limit } from "@/lib/ratelimit";
import { canTransition, type RoomStatus } from "@/lib/event-rooms";

const ParamsSchema = z.object({ id: z.string().uuid() });

const StatusSchema = z.object({
  status: z.enum(["draft","discussion","revision","approved","won","lost"]),
});

// PATCH /api/rooms/[id]/status — advance the room through the state machine.
export async function PATCH(
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

  const body = await parseJson(req, StatusSchema);
  if (body.error) return body.error;
  const { status: to } = body.data;

  const { data: room, error: fetchErr } = await supabase
    .from("event_rooms")
    .select("id, status, proposal_id")
    .eq("id", parsed.data.id)
    .eq("planner_id", user.id)
    .single();

  if (fetchErr || !room) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }

  if (!canTransition(room.status as RoomStatus, to)) {
    return NextResponse.json(
      { error: `Cannot transition from ${room.status} to ${to}.` },
      { status: 422 }
    );
  }

  const { data, error } = await supabase
    .from("event_rooms")
    .update({ status: to })
    .eq("id", parsed.data.id)
    .eq("planner_id", user.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Could not update status." }, { status: 500 });
  }

  // Keep proposal status in sync with room status for dashboard pipeline.
  const ROOM_TO_PROPOSAL: Partial<Record<string, string>> = {
    won:        "APPROVED",
    approved:   "APPROVED",
    lost:       "LOST",
    revision:   "CHANGES_REQUESTED",
    discussion: "SENT",
    draft:      "DRAFT",
  };
  const proposalStatus = ROOM_TO_PROPOSAL[to];
  if (room.proposal_id && proposalStatus) {
    const { data: propRow } = await supabase
      .from("proposals")
      .select("data")
      .eq("id", room.proposal_id)
      .single();
    if (propRow) {
      void supabase
        .from("proposals")
        .update({ data: { ...(propRow.data as object), status: proposalStatus } })
        .eq("id", room.proposal_id);
    }
  }

  return NextResponse.json(data);
}
