// Multi-model fallback for OpenAI chat completions.
// Tries each model in order; on any failure logs the granular error
// (status / code / type / message — one console line each so Vercel's
// truncated log viewer still shows the cause), then moves to the next.
// Returns the successful response plus the model that won.

import type OpenAI from "openai";
import type { ChatCompletion, ChatCompletionCreateParamsNonStreaming } from "openai/resources/chat/completions";

export const FALLBACK_MODELS = ["gpt-4o-mini", "gpt-3.5-turbo", "gpt-4o"] as const;
export type FallbackModel = (typeof FALLBACK_MODELS)[number];

export interface FallbackSuccess {
  ok: true;
  modelUsed: FallbackModel;
  response:  ChatCompletion;
}
export interface FallbackFailure {
  ok: false;
  lastError: { name?: string; message?: string; status?: number; code?: string; type?: string };
  triedModels: FallbackModel[];
}
export type FallbackResult = FallbackSuccess | FallbackFailure;

interface ChatCallShape extends Omit<ChatCompletionCreateParamsNonStreaming, "model"> { /* model injected per attempt */ }

export async function chatWithFallback(
  client:  OpenAI,
  params:  ChatCallShape,
  routeTag: string,
  models:   readonly FallbackModel[] = FALLBACK_MODELS,
): Promise<FallbackResult> {
  let lastError: FallbackFailure["lastError"] = { message: "no models attempted" };
  const tried: FallbackModel[] = [];

  for (const model of models) {
    tried.push(model);
    try {
      const response = await client.chat.completions.create({ ...params, model });
      console.log(`[${routeTag}] OpenAI succeeded | model=`, model);
      return { ok: true, modelUsed: model, response };
    } catch (err) {
      const e = err as { name?: string; message?: string; status?: number; code?: string; type?: string };
      console.error(`[${routeTag}] OpenAI failed | model=`, model);
      console.error(`[${routeTag}] OpenAI failed | status=`, e.status);
      console.error(`[${routeTag}] OpenAI failed | code=`, e.code);
      console.error(`[${routeTag}] OpenAI failed | type=`, e.type);
      console.error(`[${routeTag}] OpenAI failed | message=`, e.message);
      lastError = { name: e.name, message: e.message, status: e.status, code: e.code, type: e.type };
    }
  }

  console.error(`[${routeTag}] All models exhausted | tried=`, tried.join(","));
  return { ok: false, lastError, triedModels: tried };
}
