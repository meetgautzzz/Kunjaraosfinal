import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

// Routes inside the (app) route group that require auth + active subscription.
const APP_PREFIXES = [
  "/dashboard",
  "/billing",
  "/brain",
  "/budget",
  "/compliance",
  "/events",
  "/proposals",
  "/settings",
  "/vendors",
];

function isAppRoute(pathname: string): boolean {
  return APP_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Pass static assets and Next internals through immediately.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/p/") ||
    pathname.startsWith("/room/") ||
    pathname.startsWith("/site/")
  ) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const { url, anonKey } = getSupabasePublicConfig();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          req.cookies.set(name, value);
          res.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  // Protect app routes
  if (isAppRoute(pathname)) {
    if (!user) {
      return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(pathname)}`, req.url));
    }
    if (!user.app_metadata?.subscription_active) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
  }

  // If a subscribed user lands on /onboarding, send them to the dashboard.
  if (pathname === "/onboarding" && user?.app_metadata?.subscription_active) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    // Match everything except static files.
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
};
