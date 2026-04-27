import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateProposal } from "@/lib/generateProposal";
import { createClient } from "@/lib/supabase/server";
import { parseJson } from "@/lib/validate";
import { apiLimiter, limit } from "@/lib/ratelimit";
import { requireAiCredits } from "@/lib/ai/middleware";
import { aiError, aiSuccess } from "@/lib/ai/responses";

const BodySchema = z.object({
  eventType:  z.string().trim().min(1).max(200),
  budget:     z.string().trim().min(1).max(100),
  location:   z.string().trim().min(1).max(500),
  audience:   z.string().trim().min(1).max(500),
  theme:      z.string().trim().min(1).max(500),
  clientName: z.string().trim().max(200).optional(),
});

// GET — list current user's proposals.
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

// POST — legacy single-shot generator. The Vision Board flow goes through
// /api/proposals/generate-ideas + /generate-experience instead. This route
// is kept for the older ProposalGenerator UI but is now routed through the
// atomic credit gate so credits cannot be bypassed.
export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return aiError("SERVICE_UNAVAILABLE", "Kunjara Core is not configured.", 503);
  }

  const bodyResult = await parseJson(req, BodySchema);
  if (bodyResult.error) return aiError("VALIDATION_ERROR", "Invalid request.", 400);
  const body = bodyResult.data;

  const promptLength = JSON.stringify(body).length;

  const pre = await requireAiCredits({
    req,
    action:       "proposal",
    promptLength,
  });
  if (!pre.ok) return pre.res;
  const { ctx } = pre;

  let data;
  try {
    data = await generateProposal(body);
  } catch (aiErr) {
    console.error("[proposals POST] OpenAI call failed:", aiErr);
    await ctx.refund("openai_error");
    return aiError("AI_ERROR", "Kunjara Core failed to generate a proposal. Try again in a minute.", 502);
  }

  const remaining = await ctx.finish({ tokensUsed: null, eventId: null });
  return aiSuccess(data, ctx.creditsCharged, remaining);
}
