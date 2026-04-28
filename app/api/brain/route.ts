import { NextRequest } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseJson } from "@/lib/validate";
import { apiLimiter, limit } from "@/lib/ratelimit";
import { CHEAP_MODEL } from "@/lib/ai/router";
import {
  BRAIN_SYSTEM_PROMPT,
  buildBrainContextBlock,
  type BrainMessage,
  type BrainContext,
} from "@/lib/brain/prompt";
import type { ProposalData } from "@/lib/proposals";

// Streaming — allow up to 60 s for complex responses.
export const maxDuration = 60;

const MessageSchema = z.object({
  role:    z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(8000),
});

const BodySchema = z.object({
  messages:         z.array(MessageSchema).min(1).max(30),
  activeProposalId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "AI service not configured." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  const bodyResult = await parseJson(req, BodySchema);
  if (bodyResult.error) return bodyResult.error;

  const supabase = await createClient();
  if (!supabase) {
    return new Response(
      JSON.stringify({ error: "Service unavailable." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Rate limit: allow generous quota (brain is conversational, not generative)
  const rl = await limit(apiLimiter, `brain:${user.id}`);
  if (rl) return rl;

  // Build context block from user's proposals (best-effort — never fail the request)
  const ctx: BrainContext = {};
  try {
    const [activeResult, listResult] = await Promise.allSettled([
      bodyResult.data.activeProposalId
        ? supabase.from("proposals").select("data").eq("id", bodyResult.data.activeProposalId).eq("user_id", user.id).single()
        : Promise.resolve(null),
      supabase.from("proposals").select("data").eq("user_id", user.id)
        .order("created_at", { ascending: false }).limit(5),
    ]);

    if (activeResult.status === "fulfilled" && activeResult.value) {
      const row = (activeResult.value as any).data;
      if (row?.data) ctx.activeProposal = row.data as ProposalData;
    }

    if (listResult.status === "fulfilled") {
      const rows = (listResult.value as any).data ?? [];
      ctx.recentProposals = rows
        .map((r: any) => r.data as ProposalData)
        .filter(Boolean)
        .map((p: ProposalData) => ({
          id: p.id, title: p.title, eventType: p.eventType,
          location: p.location, budget: p.budget, status: p.status,
        }));
    }
  } catch {
    // silently ignore — brain still works without context
  }

  const contextBlock = buildBrainContextBlock(ctx);
  const systemContent = contextBlock
    ? `${BRAIN_SYSTEM_PROMPT}\n\n${contextBlock}`
    : BRAIN_SYSTEM_PROMPT;

  const { messages } = bodyResult.data;
  const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemContent },
    ...messages.map((m: BrainMessage) => ({ role: m.role, content: m.content })),
  ];

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  let stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
  try {
    stream = await openai.chat.completions.create({
      model:      CHEAP_MODEL,
      messages:   openaiMessages,
      stream:     true,
      max_tokens: 900,
      temperature: 0.7,
    });
  } catch (err: any) {
    console.error("[brain] OpenAI stream init failed:", err.message);
    return new Response(
      JSON.stringify({ error: "AI service error. Please try again." }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  // ── SSE stream ──────────────────────────────────────────────────────────────
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content ?? "";
          if (delta) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: delta })}\n\n`)
            );
          }
          if (chunk.choices[0]?.finish_reason) {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          }
        }
      } catch (err) {
        console.error("[brain] stream error:", err);
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } finally {
        controller.close();
      }
    },
    cancel() {
      // OpenAI SDK v4 exposes controller.abort() on the stream object
      if (typeof (stream as any).controller?.abort === "function") {
        (stream as any).controller.abort();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type":  "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection":    "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
