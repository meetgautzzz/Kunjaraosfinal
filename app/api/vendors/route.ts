import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseJson } from "@/lib/validate";
import { apiLimiter, limit } from "@/lib/ratelimit";

const VendorSchema = z.object({
  name:        z.string().trim().min(1).max(120),
  category:    z.string().trim().min(1).max(60).default("Other"),
  email:       z.string().trim().email().max(200).optional().or(z.literal("")),
  phone:       z.string().trim().max(30).optional(),
  city:        z.string().trim().max(80).optional(),
  rating:      z.number().int().min(1).max(5).default(4),
  active:      z.boolean().default(true),
  notes:       z.string().trim().max(1000).optional(),
  events_done: z.number().int().min(0).default(0),
});

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const rl = await limit(apiLimiter, `vendors:${user.id}`);
  if (rl) return rl;

  const { data, error } = await supabase
    .from("vendors")
    .select("id, name, category, email, phone, city, rating, active, notes, events_done, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Failed to load vendors." }, { status: 500 });

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const rl = await limit(apiLimiter, `vendors:${user.id}`);
  if (rl) return rl;

  const bodyResult = await parseJson(req, VendorSchema);
  if (bodyResult.error) return bodyResult.error;

  const { data, error } = await supabase
    .from("vendors")
    .insert({ ...bodyResult.data, user_id: user.id, updated_at: new Date().toISOString() })
    .select("id, name, category, email, phone, city, rating, active, notes, events_done, created_at")
    .single();

  if (error) return NextResponse.json({ error: "Failed to save vendor." }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
