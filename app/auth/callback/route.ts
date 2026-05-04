import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Google OAuth bounces back here with ?code=... — we exchange it for a
// session cookie and redirect. No client-side JS involved in the auth
// step itself.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const next = sanitizeNext(req.nextUrl.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/login?err=missing_code", req.url));
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.redirect(new URL("/login?err=unavailable", req.url));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth/callback] exchangeCodeForSession failed:", error.message);
    return NextResponse.redirect(new URL("/login?err=oauth_failed", req.url));
  }

  // Gate new OAuth users who haven't subscribed yet to /onboarding.
  const { data: { user } } = await supabase.auth.getUser();
  if (user && !user.app_metadata?.subscription_active) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  return NextResponse.redirect(new URL(next, req.url));
}

// Only allow internal paths as post-login redirect targets. Blocks open
// redirect via ?next=https://evil.com.
function sanitizeNext(raw: string | null): string {
  if (!raw) return "/dashboard";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}
