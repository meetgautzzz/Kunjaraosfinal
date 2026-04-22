import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type UserResult =
  | { user: { id: string; email?: string }; error?: never }
  | { user?: never; error: NextResponse };

// Resolve the current user from the request's session cookie.
// Returns either { user } or { error: NextResponse } so callers can
// `if (error) return error` early.
export async function requireUser(): Promise<UserResult> {
  const supabase = await createClient();
  if (!supabase) {
    return { error: NextResponse.json({ error: "Service unavailable." }, { status: 503 }) };
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }
  return { user: { id: user.id, email: user.email } };
}
