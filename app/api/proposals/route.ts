import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateProposal } from "@/lib/generateProposal";
import { createClient } from "@/lib/supabase/server";
import { parseJson } from "@/lib/validate";
import { apiLimiter, limit } from "@/lib/ratelimit";
import { aiError } from "@/lib/ai/responses";

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
    id:         row.id,
    data:       row.data,
    created_at: row.created_at,
  }));
  return NextResponse.json(proposals);
}

// POST — legacy single-shot generator (kept for ProposalGenerator UI).
export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return aiError("SERVICE_UNAVAILABLE", "Kunjara Core is not configured.", 503);
  }

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const rl = await limit(apiLimiter, `user:${user.id}`);
  if (rl) return rl;

  const bodyResult = await parseJson(req, BodySchema);
  if (bodyResult.error) return aiError("VALIDATION_ERROR", "Invalid request.", 400);
  const body = bodyResult.data;

  // Usage limit check
  const { data: usage } = await supabase
    .from("user_usage")
    .select("plan, proposals_used")
    .eq("user_id", user.id)
    .single();

  const proposalLimit = (usage?.plan === "pro" || usage?.plan === "basic") ? 30 : 2;
  if ((usage?.proposals_used ?? 0) >= proposalLimit) {
    return aiError(
      "LIMIT_REACHED",
      "Proposal limit reached. Upgrade to Pro (₹3,000/month) for 30 proposals.",
      402,
    );
  }

  let data;
  try {
    data = await generateProposal(body);
  } catch (aiErr) {
    console.error("[proposals POST] OpenAI call failed:", aiErr);
    return aiError("AI_ERROR", "Kunjara Core failed to generate a proposal. Try again in a minute.", 502);
  }

  // Increment proposal counter
  await supabase
    .from("user_usage")
    .update({ proposals_used: (usage?.proposals_used ?? 0) + 1, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);

  return NextResponse.json({ success: true, data });
}
