import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

// GET /api/rooms/public/[token]
// Public — no auth. Token is the credential. Uses admin client to bypass RLS.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!token) return NextResponse.json({ error: "Invalid token." }, { status: 400 });

  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const { data: room, error } = await admin
    .from("event_rooms")
    .select(`
      id, share_token, proposal_id, client_name, client_email,
      status, deal_value, view_count, last_viewed_at, client_response,
      run_of_show, floor_plan, created_at, updated_at,
      proposals ( id, data )
    `)
    .eq("share_token", token)
    .maybeSingle();

  if (error || !room) {
    return NextResponse.json({ error: "Room not found or link has expired." }, { status: 404 });
  }

  // Increment view count — fire and forget, void the promise to silence TS.
  void admin
    .from("event_rooms")
    .update({ view_count: (room.view_count ?? 0) + 1, last_viewed_at: new Date().toISOString() })
    .eq("share_token", token);

  return NextResponse.json(room, { headers: { "Cache-Control": "no-store" } });
}
