import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiLimiter, limit } from "@/lib/ratelimit";

async function getAuth(params: Promise<{ id: string }>) {
  const { id } = await params;
  const supabase = await createClient();
  if (!supabase) return { error: NextResponse.json({ error: "Service unavailable." }, { status: 503 }) };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  return { id, user, supabase };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuth(params);
  if ("error" in auth) return auth.error;
  const { id, user, supabase } = auth;

  const rl = await limit(apiLimiter, `compliance:${user.id}`);
  if (rl) return rl;

  const body = await req.json().catch(() => ({}));
  const allowed = ["status","priority","deadline","submitted_at","approved_at","document_name","document_url","notes","name","authority","fee"];
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const k of allowed) {
    if (body[k] !== undefined) patch[k] = body[k];
  }
  // Accept camelCase from client too
  if (body.submittedAt !== undefined) patch.submitted_at = body.submittedAt;
  if (body.approvedAt  !== undefined) patch.approved_at  = body.approvedAt;
  if (body.documentName !== undefined) patch.document_name = body.documentName;
  if (body.documentUrl  !== undefined) patch.document_url  = body.documentUrl;

  const { data, error } = await supabase
    .from("compliance_items")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error || !data) return NextResponse.json({ error: "Failed to update item." }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuth(params);
  if ("error" in auth) return auth.error;
  const { id, user, supabase } = auth;

  const rl = await limit(apiLimiter, `compliance:${user.id}`);
  if (rl) return rl;

  const { error } = await supabase
    .from("compliance_items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: "Failed to delete item." }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
