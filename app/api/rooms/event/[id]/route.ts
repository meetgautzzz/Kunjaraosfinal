import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SELECT = "id, token, title, clientName, clientEmail, status, showProposal, showBudget, showTimeline, showVendors, showTasks, showPayments, showApprovals, proposalData, budgetData, timelineData, vendorData, totalAmount, amountPaid, currency, approvalStatus, approvedAt, approvedByName, approvalNote, viewCount, lastViewedAt, tasks, payments, createdAt, updatedAt";

function mapRoom(row: Record<string, unknown>) {
  return {
    id:              row.id,
    token:           row.token,
    title:           row.title,
    clientName:      row.clientName,
    clientEmail:     row.clientEmail,
    status:          row.status,
    showProposal:    row.showProposal  ?? true,
    showBudget:      row.showBudget    ?? true,
    showTimeline:    row.showTimeline  ?? true,
    showVendors:     row.showVendors   ?? true,
    showTasks:       row.showTasks     ?? true,
    showPayments:    row.showPayments  ?? true,
    showApprovals:   row.showApprovals ?? true,
    proposalData:    row.proposalData  ?? null,
    budgetData:      row.budgetData    ?? null,
    timelineData:    row.timelineData  ?? null,
    vendorData:      row.vendorData    ?? null,
    totalAmount:     row.totalAmount   ?? 0,
    amountPaid:      row.amountPaid    ?? 0,
    currency:        row.currency      ?? "INR",
    approvalStatus:  row.approvalStatus ?? "PENDING",
    approvedAt:      row.approvedAt    ?? null,
    approvedByName:  row.approvedByName ?? null,
    approvalNote:    row.approvalNote  ?? null,
    viewCount:       row.viewCount     ?? 0,
    lastViewedAt:    row.lastViewedAt  ?? null,
    tasks:           row.tasks         ?? [],
    payments:        row.payments      ?? [],
    createdAt:       row.createdAt,
    updatedAt:       row.updatedAt,
  };
}

// GET /api/rooms/event/[id] — get or create room for a proposal
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: proposalId } = await params;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  // Find existing room for this proposal
  const { data: existing } = await supabase
    .from("event_rooms")
    .select(SELECT)
    .eq("eventId", proposalId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return NextResponse.json(mapRoom(existing as Record<string, unknown>));

  // Load proposal to seed room title
  const { data: proposal } = await supabase
    .from("proposals")
    .select("data")
    .eq("id", proposalId)
    .eq("user_id", user.id)
    .maybeSingle();

  const proposalData = proposal?.data as Record<string, unknown> | null;
  const title = (proposalData?.title as string) || "Event Room";

  // Create a new room
  const { data: created, error } = await supabase
    .from("event_rooms")
    .insert({
      user_id:      user.id,
      eventId:      proposalId,
      title,
      proposalData: proposalData ?? null,
      updatedAt:    new Date().toISOString(),
    })
    .select(SELECT)
    .single();

  if (error || !created) return NextResponse.json({ error: "Failed to create room." }, { status: 500 });

  return NextResponse.json(mapRoom(created as Record<string, unknown>), { status: 201 });
}

// PATCH /api/rooms/event/[id] — update room settings/visibility
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: proposalId } = await params;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  const fields = ["showProposal","showBudget","showTimeline","showVendors","showTasks","showPayments","showApprovals","clientName","clientEmail","title","tasks","payments","budgetData","totalAmount","amountPaid"];
  for (const f of fields) {
    if (body[f] !== undefined) patch[f] = body[f];
  }

  const { data, error } = await supabase
    .from("event_rooms")
    .update(patch)
    .eq("eventId", proposalId)
    .eq("user_id", user.id)
    .select(SELECT)
    .single();

  if (error || !data) return NextResponse.json({ error: "Failed to update room." }, { status: 500 });
  return NextResponse.json(mapRoom(data as Record<string, unknown>));
}
