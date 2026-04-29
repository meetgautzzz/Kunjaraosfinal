import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { apiLimiter, limit } from "@/lib/ratelimit";

const ItemSchema = z.object({
  type:            z.string().min(1).max(60),
  name:            z.string().min(1).max(120),
  authority:       z.string().max(120).default(""),
  description:     z.string().max(500).default(""),
  instructions:    z.string().max(500).default(""),
  status:          z.enum(["NOT_STARTED","IN_PROGRESS","SUBMITTED","APPROVED","REJECTED","WAIVED"]).default("NOT_STARTED"),
  priority:        z.enum(["CRITICAL","HIGH","MEDIUM","LOW"]).default("MEDIUM"),
  deadline:        z.string().datetime().nullable().optional(),
  submitted_at:    z.string().datetime().nullable().optional(),
  approved_at:     z.string().datetime().nullable().optional(),
  document_name:   z.string().max(200).nullable().optional(),
  document_url:    z.string().max(500).nullable().optional(),
  notes:           z.string().max(1000).default(""),
  fee:             z.string().max(60).default(""),
  processing_days: z.number().int().min(0).default(7),
  proposal_id:     z.string().uuid().nullable().optional(),
});

function mapRow(row: Record<string, unknown>) {
  return {
    id:             row.id,
    type:           row.type,
    name:           row.name,
    authority:      row.authority,
    description:    row.description,
    instructions:   row.instructions,
    status:         row.status,
    priority:       row.priority,
    deadline:       row.deadline    ?? null,
    submittedAt:    row.submitted_at ?? null,
    approvedAt:     row.approved_at  ?? null,
    documentName:   row.document_name ?? null,
    documentUrl:    row.document_url  ?? null,
    notes:          row.notes,
    fee:            row.fee,
    processingDays: row.processing_days,
  };
}

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { data, error } = await supabase
    .from("compliance_items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: "Failed to load compliance items." }, { status: 500 });
  return NextResponse.json((data ?? []).map(mapRow));
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const rl = await limit(apiLimiter, `compliance:${user.id}`);
  if (rl) return rl;

  const body = await req.json().catch(() => null);

  // Support bulk insert (array) or single item
  const items = Array.isArray(body) ? body : [body];
  const parsed = items.map((item) => ItemSchema.safeParse(item));
  const invalid = parsed.find((p) => !p.success);
  if (invalid) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const rows = parsed.map((p) => ({
    ...(p as { success: true; data: z.infer<typeof ItemSchema> }).data,
    user_id:    user.id,
    updated_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from("compliance_items")
    .insert(rows)
    .select("*");

  if (error) return NextResponse.json({ error: "Failed to save compliance items." }, { status: 500 });
  return NextResponse.json((data ?? []).map(mapRow), { status: 201 });
}
