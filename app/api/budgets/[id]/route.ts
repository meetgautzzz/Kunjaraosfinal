import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { apiLimiter, limit } from "@/lib/ratelimit";

const ParamsSchema = z.object({ id: z.string().uuid() });

async function getAuth(params: Promise<{ id: string }>) {
  const raw = await params;
  const parsed = ParamsSchema.safeParse(raw);
  if (!parsed.success) return { error: NextResponse.json({ error: "Invalid ID." }, { status: 400 }) };

  const supabase = await createClient();
  if (!supabase) return { error: NextResponse.json({ error: "Service unavailable." }, { status: 503 }) };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };

  return { id: parsed.data.id, user, supabase };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuth(params);
  if ("error" in auth) return auth.error;
  const { id, user, supabase } = auth;

  const { data, error } = await supabase
    .from("budgets")
    .select("id, title, meta, items, created_at, updated_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuth(params);
  if ("error" in auth) return auth.error;
  const { id, user, supabase } = auth;

  const rl = await limit(apiLimiter, `budgets:${user.id}`);
  if (rl) return rl;

  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.title !== undefined) patch.title = String(body.title).trim() || "Untitled Budget";
  if (body.meta  !== undefined) patch.meta  = body.meta;
  if (body.items !== undefined) patch.items = body.items;

  const { data, error } = await supabase
    .from("budgets")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, title, meta, items, updated_at")
    .single();

  if (error || !data) return NextResponse.json({ error: "Failed to update budget." }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuth(params);
  if ("error" in auth) return auth.error;
  const { id, user, supabase } = auth;

  const rl = await limit(apiLimiter, `budgets:${user.id}`);
  if (rl) return rl;

  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: "Failed to delete budget." }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
