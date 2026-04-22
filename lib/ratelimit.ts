import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

// Rate limiting needs shared state across Vercel serverless instances —
// Upstash Redis is the de-facto pick. Without it, this module fails open
// (allows every request) and warns loudly, so prod never silently runs
// per-instance-only counters that attackers can easily bypass.
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

let warned = false;
function warnOnce() {
  if (warned) return;
  warned = true;
  console.warn(
    "[ratelimit] UPSTASH_REDIS_REST_URL / _TOKEN not set — rate limits are DISABLED. " +
      "Add the Upstash integration on Vercel (Marketplace → Upstash → Redis) " +
      "and redeploy to enable."
  );
}

function build(
  prefix: string,
  tokens: number,
  window: `${number} ${"s" | "m" | "h"}`
): Ratelimit | null {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(tokens, window),
    analytics: false,
    prefix: `kunjara:${prefix}`,
  });
}

// AI endpoints are expensive (OpenAI cost). Tight per-user window.
export const aiLimiter = build("ai", 10, "1 m");

// Billing endpoints — per-IP, tight enough to blunt fuzzing.
export const billingLimiter = build("billing", 20, "1 m");

// General read / stub endpoints — permissive per-IP.
export const apiLimiter = build("api", 60, "1 m");

// Standard proxy-aware caller identifier. Falls back to a constant so a
// missing header doesn't collapse all traffic into one bucket when a
// proxy is misconfigured — that would itself be a denial of service.
export function ipFromRequest(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

// Returns a 429 NextResponse if the request is over-limit, else null
// (caller proceeds). When Redis is unconfigured, always returns null
// and warns — see warnOnce().
export async function limit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<NextResponse | null> {
  if (!limiter) {
    warnOnce();
    return null;
  }
  const { success, limit: max, remaining, reset } = await limiter.limit(identifier);
  if (success) return null;

  const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
  return NextResponse.json(
    { error: "Too many requests. Slow down." },
    {
      status: 429,
      headers: {
        "Retry-After":           String(retryAfter),
        "X-RateLimit-Limit":     String(max),
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset":     String(reset),
      },
    }
  );
}
