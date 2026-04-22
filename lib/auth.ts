import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiLimiter, limit } from "@/lib/ratelimit";

type UserResult =
  | { user: { id: string; email?: string }; error?: never }
  | { user?: never; error: NextResponse };

// Resolve the current user from the request's session cookie and apply a
// per-user rate limit. Returns either { user } or { error: NextResponse }
// so callers can `if (error) return error` early. Handlers doing more
// expensive work (AI, billing) should apply a tighter limiter *in addition*
// to the one baked in here — that case-specific limit runs after this.
export async function requireUser(): Promise<UserResult> {
  const supabase = await createClient();
  if (!supabase) {
    return { error: NextResponse.json({ error: "Service unavailable." }, { status: 503 }) };
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }

  const rl = await limit(apiLimiter, `user:${user.id}`);
  if (rl) return { error: rl };

  return { user: { id: user.id, email: user.email } };
}
