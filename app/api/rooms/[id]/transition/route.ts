import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseJson, parseParams } from "@/lib/validate";
import { apiLimiter, limit } from "@/lib/ratelimit";
import {
  canTransition, proposalPatchForTransition, shouldSnapshot,
  type RoomStatus,
} from "@/lib/event-rooms";

const ParamsSchema = z.object({ id: z.string().uuid() });

const TransitionSchema = z.object({
  to:    z.enum(["discussion","revision","approved","won","lost"]),
  label: z.string().trim().max(200).optional(), // optional snapshot label
}).strict();

// POST /api/rooms/[id]/transition — move the room through the state machine.
//
// Side effects (atomic where possible):
//   draft       → discussion : proposal.status = SENT
//   discussion  → revision   : snapshot + proposal.status = CHANGES_REQUESTED
//   revision    → discussion : proposal.status = SENT
//   discussion  → approved   : snapshot + proposal.isLocked = true + proposal.status = APPROVED
//   approved    → won        : proposal.status = APPROVED (confirm)
//   *           → lost       : proposal.status = LOST
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

  const body = await parseJson(req, TransitionSchema);
  if (body.error) return body.error;
  const { to, label } = body.data;

  // Load the room + current proposal data.
  const { data: room } = await supabase
    .from("event_rooms")
    .select("id, proposal_id, status")
    .eq("id", parsed.data.id)
    .eq("planner_id", user.id)
    .single();

  if (!room) return NextResponse.json({ error: "Room not found." }, { status: 404 });

  const from = room.status as RoomStatus;

  // Guard: validate the transition is allowed.
  if (!canTransition(from, to)) {
    return NextResponse.json(
      { error: `Cannot transition from '${from}' to '${to}'.` },
      { status: 409 }
    );
  }

  // Load the proposal for patching + snapshotting.
  const { data: proposal } = await supabase
    .from("proposals")
    .select("data")
    .eq("id", room.proposal_id)
    .eq("user_id", user.id)
    .single();

  if (!proposal) return NextResponse.json({ error: "Proposal not found." }, { status: 404 });

  // Auto-snapshot before we mutate (on revision or approval).
  if (shouldSnapshot(to)) {
    const { data: latest } = await supabase
      .from("proposal_versions")
      .select("version_number")
      .eq("event_room_id", parsed.data.id)
      .order("version_number", { ascending: false })
      .limit(1)
      .single();

    const nextVersion = ((latest as any)?.version_number ?? 0) + 1;

    const snapshotLabel =
      label ??
      (to === "approved"  ? `v${nextVersion} — Approved`  : null) ??
      (to === "revision"  ? `v${nextVersion} — Revision`  : null);

    await supabase.from("proposal_versions").insert({
      event_room_id:  parsed.data.id,
      proposal_id:    room.proposal_id,
      version_number: nextVersion,
      data_snapshot:  proposal.data,
      label:          snapshotLabel,
      created_by:     user.id,
    });
  }

  // Apply proposal-level side effects (status + lock).
  const proposalPatch = proposalPatchForTransition(to);
  if (Object.keys(proposalPatch).length > 0) {
    const currentData = (proposal.data ?? {}) as Record<string, unknown>;
    const nextData = { ...currentData, ...proposalPatch, updatedAt: new Date().toISOString() };

    const { error: propErr } = await supabase
      .from("proposals")
      .update({ data: nextData, updated_at: nextData.updatedAt })
      .eq("id", room.proposal_id)
      .eq("user_id", user.id);

    if (propErr) {
      console.error("[transition] proposal patch failed:", propErr.message);
      // Non-fatal — still advance the room status.
    }
  }

  // Advance the room status.
  const { data: updated, error: roomErr } = await supabase
    .from("event_rooms")
    .update({ status: to })
    .eq("id", parsed.data.id)
    .select()
    .single();

  if (roomErr || !updated) {
    console.error("[transition] room update failed:", roomErr?.message);
    return NextResponse.json({ error: "Failed to update room status." }, { status: 500 });
  }

  console.log(`[transition] room ${parsed.data.id} ${from} → ${to}`);

  return NextResponse.json({
    room:        updated,
    snapshotted: shouldSnapshot(to),
  });
}
