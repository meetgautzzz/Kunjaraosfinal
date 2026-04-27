import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminClient } from "@/lib/supabase/admin";
import { parseParams } from "@/lib/validate";
import { apiLimiter, limit } from "@/lib/ratelimit";

const ParamsSchema = z.object({ id: z.string().uuid() });

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rawParams = await params;
  const parsed = parseParams(rawParams, ParamsSchema);
  if (parsed.error) return parsed.error;
  const { id } = parsed.data;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  const rl = await limit(apiLimiter, `share:${ip}`);
  if (rl) return rl;

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
  }

  const { data, error } = await admin
    .from("proposals")
    .select("id, user_id, data")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  }

  // Fetch planner branding (best-effort — never blocks the response)
  let branding: Record<string, string> = {};
  if (data.user_id) {
    const { data: profile } = await admin
      .from("profiles")
      .select("company_name, phone_number, address, logo_url")
      .eq("id", data.user_id)
      .maybeSingle();
    if (profile) branding = profile;
  }

  return NextResponse.json(
    { ...(data.data as Record<string, unknown>), id: data.id, branding },
    { headers: { "Cache-Control": "private, max-age=60" } }
  );
}
