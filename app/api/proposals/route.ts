import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateProposal } from "@/lib/generateProposal";
import { createClient } from "@/lib/supabase/server";
import { parseJson } from "@/lib/validate";
import { aiLimiter, apiLimiter, limit } from "@/lib/ratelimit";
import { checkUsage, incrementUsage } from "@/lib/usage";

const BodySchema = z.object({
  eventType:  z.string().trim().min(1).max(200),
  budget:     z.string().trim().min(1).max(100),
  location:   z.string().trim().min(1).max(500),
  audience:   z.string().trim().min(1).max(500),
  theme:      z.string().trim().min(1).max(500),
  clientName: z.string().trim().max(200).optional(),
});

export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const rl = await limit(apiLimiter, `user:${user.id}`);
  if (rl) return rl;

  const { data, error } = await supabase
    .from("proposals")
    .select("id, data, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[proposals GET] DB error:", error);
    return NextResponse.json({ error: "Failed to load proposals." }, { status: 500 });
  }

  const proposals = (data ?? []).map((row) => ({
    ...(row.data as Record<string, unknown>),
    id: row.id,
  }));
  return NextResponse.json(proposals);
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ success: false, error: "Kunjara Core is not configured." }, { status: 503 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Service unavailable." }, { status: 503 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const rl = await limit(aiLimiter, `user:${user.id}`);
    if (rl) return rl;

    const bodyResult = await parseJson(req, BodySchema);
    if (bodyResult.error) return bodyResult.error;
    const body = bodyResult.data;

    // Check usage WITHOUT incrementing — blocked users must not consume quota
    const usageCheck = await checkUsage(user.id);

    if (usageCheck.overage) {
      return NextResponse.json({
        success: false,
        error: "Plan limit reached. Upgrade to continue.",
        limit_reached: true,
      }, { status: 403 });
    }

    let data;
    try {
      data = await generateProposal(body);
    } catch (aiError) {
      console.error("[proposals] OpenAI call failed:", aiError);
      return NextResponse.json(
        { success: false, error: "Kunjara Core failed to generate a proposal. Try again in a minute." },
        { status: 502 }
      );
    }

    // Only increment AFTER successful generation
    const newEventsUsed = await incrementUsage(user.id, usageCheck.events_used);
    const nowOverage = newEventsUsed >= usageCheck.limit;

    return NextResponse.json({
      success: true,
      data,
      usage: {
        events_used: newEventsUsed,
        limit: usageCheck.limit,
        overage: nowOverage,
        overage_charge: nowOverage ? 199 : 0,
      },
    });
  } catch (error) {
    console.error("[proposals] Unexpected error:", error);
    return NextResponse.json({ success: false, error: "Unexpected error." }, { status: 500 });
  }
}
