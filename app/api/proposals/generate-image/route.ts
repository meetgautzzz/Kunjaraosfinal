export const runtime    = "nodejs";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseJson } from "@/lib/validate";
import { apiLimiter, limit } from "@/lib/ratelimit";
import type { ProposalData } from "@/lib/proposals";

const BodySchema = z.object({
  proposalId: z.string().min(1),
  prompt:     z.string().trim().min(1).max(1000).optional(),
});

function buildPrompt(proposal: ProposalData, override?: string): string {
  if (override && override.length > 10) return override;

  const vd = proposal.visualDirection;
  const parts: string[] = [
    proposal.eventType,
    vd?.overallAesthetic,
    proposal.location,
    vd?.lighting ? `${vd.lighting} lighting` : null,
    vd?.palette?.map((s) => s.name).join(", "),
  ].filter(Boolean) as string[];

  return `High-quality event photography: ${parts.join(", ")}. Cinematic, photorealistic, professional event design.`;
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "AI service not configured." }, { status: 503 });
  }

  const bodyResult = await parseJson(req, BodySchema);
  if (bodyResult.error) return bodyResult.error;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const rl = await limit(apiLimiter, `img:${user.id}`);
  if (rl) return rl;

  const { proposalId, prompt } = bodyResult.data;

  const { data: row } = await supabase
    .from("proposals")
    .select("data")
    .eq("id", proposalId)
    .eq("user_id", user.id)
    .single();

  if (!row) return NextResponse.json({ error: "Proposal not found." }, { status: 404 });

  const proposal  = row.data as ProposalData;
  const finalPrompt = buildPrompt(proposal, prompt ?? proposal.visualDirection?.dallePrompt);

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  async function generate(model: string): Promise<string> {
    const res = await openai.images.generate({
      model,
      prompt: finalPrompt,
      size: "1024x1024",
      ...(model === "dall-e-3" ? { quality: "standard" } : {}),
    } as Parameters<typeof openai.images.generate>[0]) as { data: { url?: string; b64_json?: string }[] };

    const item = res.data[0];
    if (item?.url)      return item.url!;
    if (item?.b64_json) return `data:image/png;base64,${item.b64_json}`;
    throw new Error("Empty image response");
  }

  // Try gpt-image-1; fall back to dall-e-3 for keys without access
  let imageUrl: string;
  try {
    imageUrl = await generate("gpt-image-1");
  } catch (err: any) {
    const notFound =
      err?.status === 404 ||
      err?.code === "model_not_found" ||
      /model/i.test(err?.message ?? "");

    if (notFound) {
      try {
        imageUrl = await generate("dall-e-3");
      } catch (err2: any) {
        console.error("[generate-image] dall-e-3 failed:", err2?.message);
        return NextResponse.json({ error: "Image generation failed. Try again." }, { status: 502 });
      }
    } else {
      console.error("[generate-image] gpt-image-1 failed:", err?.message);
      return NextResponse.json({ error: "Image generation failed. Try again." }, { status: 502 });
    }
  }

  return NextResponse.json({ imageUrl, prompt: finalPrompt });
}
