import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiLimiter, limit } from "@/lib/ratelimit";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const rl = await limit(apiLimiter, `budgets:${user.id}`);
  if (rl) return rl;

  const { data, error } = await supabase
    .from("budgets")
    .select("id, title, meta, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Failed to load budgets." }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const rl = await limit(apiLimiter, `budgets:${user.id}`);
  if (rl) return rl;

  const body = await req.json().catch(() => ({}));
  const title = (body.title as string)?.trim() || "Untitled Budget";
  const meta  = body.meta  ?? {};
  const items = body.items ?? [];

  const { data, error } = await supabase
    .from("budgets")
    .insert({ user_id: user.id, title, meta, items, updated_at: new Date().toISOString() })
    .select("id, title, meta, items, created_at, updated_at")
    .single();

  if (error) return NextResponse.json({ error: "Failed to create budget." }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
