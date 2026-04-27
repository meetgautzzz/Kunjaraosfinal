import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const ProfileSchema = z.object({
  company_name: z.string().max(120).optional(),
  phone_number: z.string().max(30).optional(),
  address:      z.string().max(300).optional(),
  logo_url:     z.string().url().max(500).optional().or(z.literal("")),
});

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const { data, error } = await admin
    .from("profiles")
    .select("company_name, phone_number, address, logo_url")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Failed to load profile." }, { status: 500 });

  return NextResponse.json(data ?? {}, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PUT(req: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => null);
  const parsed = ProfileSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const { error } = await admin
    .from("profiles")
    .upsert({ id: auth.user.id, ...parsed.data, updated_at: new Date().toISOString() });

  if (error) return NextResponse.json({ error: "Failed to save profile." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
