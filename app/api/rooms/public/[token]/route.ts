import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SELECT = "id, token, title, clientName, clientEmail, status, showProposal, showBudget, showTimeline, showVendors, showTasks, showPayments, showApprovals, proposalData, budgetData, timelineData, vendorData, totalAmount, amountPaid, currency, approvalStatus, approvedAt, approvedByName, approvalNote, viewCount, lastViewedAt, tasks, payments, createdAt, updatedAt";

// GET /api/rooms/public/[token] — public client view, no auth required
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token) return NextResponse.json({ error: "Invalid token." }, { status: 400 });

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const { data, error } = await supabase
    .from("event_rooms")
    .select(SELECT)
    .eq("token", token)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (error || !data) return NextResponse.json({ error: "Room not found." }, { status: 404 });

  // Increment view count
  await supabase
    .from("event_rooms")
    .update({ viewCount: ((data as Record<string, unknown>).viewCount as number ?? 0) + 1, lastViewedAt: new Date().toISOString() })
    .eq("token", token);

  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}
