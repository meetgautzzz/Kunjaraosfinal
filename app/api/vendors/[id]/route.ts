import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseJson, parseParams } from "@/lib/validate";
import { apiLimiter, limit } from "@/lib/ratelimit";

const ParamsSchema = z.object({ id: z.string().uuid() });

const PatchSchema = z.object({
  name:        z.string().trim().min(1).max(120).optional(),
  category:    z.string().trim().max(60).optional(),
  email:       z.string().trim().email().max(200).optional().or(z.literal("")),
  phone:       z.string().trim().max(30).optional(),
  city:        z.string().trim().max(80).optional(),
  rating:      z.number().int().min(1).max(5).optional(),
  active:      z.boolean().optional(),
  notes:       z.string().trim().max(1000).optional(),
  events_done: z.number().int().min(0).optional(),
});

async function getAuth(params: Promise<{ id: string }>) {
  const raw = await params;
  const parsed = parseParams(raw, ParamsSchema);
  if (parsed.error) return { error: parsed.error };

  const supabase = await createClient();
  if (!supabase) return { error: NextResponse.json({ error: "Service unavailable." }, { status: 503 }) };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };

  return { id: parsed.data.id, user, supabase };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuth(params);
  if (auth.error) return auth.error;
  const { id, user, supabase } = auth;

  const rl = await limit(apiLimiter, `vendors:${user.id}`);
  if (rl) return rl;

  const bodyResult = await parseJson(req, PatchSchema);
  if (bodyResult.error) return bodyResult.error;

  const { data, error } = await supabase
    .from("vendors")
    .update({ ...bodyResult.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, name, category, email, phone, city, rating, active, notes, events_done")
    .single();

  if (error) return NextResponse.json({ error: "Failed to update vendor." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuth(params);
  if (auth.error) return auth.error;
  const { id, user, supabase } = auth;

  const rl = await limit(apiLimiter, `vendors:${user.id}`);
  if (rl) return rl;

  const { error } = await supabase
    .from("vendors")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: "Failed to delete vendor." }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}
