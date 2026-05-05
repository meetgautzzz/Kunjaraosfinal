import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseJson } from "@/lib/validate";
import { apiLimiter, limit } from "@/lib/ratelimit";

const CreateSchema = z.object({
  proposal_id:  z.string().uuid(),
  client_name:  z.string().trim().min(1).max(200),
  client_email: z.string().email().max(320).optional(),
  deal_value:   z.number().min(0).optional(),
});

// GET /api/rooms — list all event rooms for the authenticated planner,
// joined with the proposal title + status so the list view is one query.
export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const rl = await limit(apiLimiter, `user:${user.id}`);
  if (rl) return rl;

  const { data, error } = await supabase
    .from("event_rooms")
    .select(`
      id, proposal_id, client_name, client_email, status,
      deal_value, share_token, view_count, last_viewed_at, client_response,
      created_at, updated_at,
      proposals ( data->title, data->eventType, data->status )
    `)
    .eq("planner_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[rooms GET]", error.message);
    return NextResponse.json({ error: "Could not fetch rooms." }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

// POST /api/rooms — create an event room for a proposal.
// One room per proposal (UNIQUE constraint enforces at DB level).
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const rl = await limit(apiLimiter, `user:${user.id}`);
  if (rl) return rl;

  const body = await parseJson(req, CreateSchema);
  if (body.error) return body.error;
  const { proposal_id, client_name, client_email, deal_value } = body.data;

  // Verify the proposal belongs to this planner.
  const { data: proposal, error: propErr } = await supabase
    .from("proposals")
    .select("id, data->budget")
    .eq("id", proposal_id)
    .eq("user_id", user.id)
    .single();

  if (propErr || !proposal) {
    return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  }

  const { data: room, error } = await supabase
    .from("event_rooms")
    .insert({
      proposal_id,
      planner_id:  user.id,
      client_name,
      client_email: client_email ?? null,
      deal_value:   deal_value ?? (proposal as any).budget ?? 0,
      status:       "draft",
    })
    .select()
    .single();

  if (error) {
    // Unique violation = room already exists
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "An Event Room already exists for this proposal." },
        { status: 409 }
      );
    }
    console.error("[rooms POST]", error.message);
    return NextResponse.json({ error: "Could not create room." }, { status: 500 });
  }

  return NextResponse.json(room, { status: 201 });
}
