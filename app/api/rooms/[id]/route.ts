import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseJson, parseParams } from "@/lib/validate";
import { apiLimiter, limit } from "@/lib/ratelimit";

const ParamsSchema = z.object({ id: z.string().uuid() });

const PatchSchema = z.object({
  client_name:  z.string().trim().min(1).max(200).optional(),
  client_email: z.string().email().max(320).nullable().optional(),
  deal_value:   z.number().min(0).optional(),
  run_of_show:  z.any().optional(),
  floor_plan:   z.any().optional(),
});

// GET /api/rooms/[id] — room details + joined proposal snapshot.
export async function GET(
  _req: NextRequest,
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

  const { data, error } = await supabase
    .from("event_rooms")
    .select(`
      *,
      proposals ( id, data, created_at ),
      event_room_comments ( count )
    `)
    .eq("id", parsed.data.id)
    .eq("planner_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }

  return NextResponse.json(data);
}

// PATCH /api/rooms/[id] — update mutable meta (client info, deal value).
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

  const body = await parseJson(req, PatchSchema);
  if (body.error) return body.error;

  const { data, error } = await supabase
    .from("event_rooms")
    .update(body.data)
    .eq("id", parsed.data.id)
    .eq("planner_id", user.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Room not found or update failed." }, { status: 404 });
  }

  return NextResponse.json(data);
}

// DELETE /api/rooms/[id] — delete room (proposal is unaffected).
export async function DELETE(
  _req: NextRequest,
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

  const { error } = await supabase
    .from("event_rooms")
    .delete()
    .eq("id", parsed.data.id)
    .eq("planner_id", user.id);

  if (error) {
    console.error("[rooms DELETE]", error.message);
    return NextResponse.json({ error: "Could not delete room." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
