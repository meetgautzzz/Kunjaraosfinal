import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = [
  "/dashboard",
  "/proposals",
  "/budget",
  "/compliance",
  "/events",
  "/vendors",
  "/ai",
  "/billing",
  "/settings",
];
const AUTH_ONLY = ["/login"];

// Routes that must accept cross-origin POST by design — never CSRF-gate these.
const CSRF_EXEMPT_API = ["/api/billing/webhook"];
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // M1: CSRF defense-in-depth for API routes. SameSite=Lax on the Supabase
  // session cookie already blocks browser-driven cross-origin POST from
  // carrying auth, but we add an Origin/Referer check as a second wall in
  // case a browser ignores SameSite or a proxy strips it.
  if (pathname.startsWith("/api/")) {
    if (SAFE_METHODS.has(request.method)) return NextResponse.next();
    if (CSRF_EXEMPT_API.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      return NextResponse.next();
    }

    const expectedHost = request.headers.get("host");
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");

    // Browsers reliably send Origin on cross-origin state-changing requests.
    // Missing both headers → non-browser caller (curl, server-to-server,
    // mobile app) which is not a CSRF threat surface. Only enforce when
    // a header is present.
    const headerHost =
      (origin ? safeHost(origin) : null) ??
      (referer ? safeHost(referer) : null);

    if (headerHost && expectedHost && headerHost !== expectedHost) {
      return NextResponse.json(
        { error: "Cross-origin request blocked." },
        { status: 403 }
      );
    }
    return NextResponse.next();
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error("[proxy] Missing Supabase env vars — skipping auth check.");
    return NextResponse.next();
  }

  const response = NextResponse.next();

  // Validate session by asking Supabase to verify the JWT, not just by
  // checking cookie presence. A user can set any cookie value client-side;
  // only getUser() actually validates the token signature + expiry.
  let user = null;
  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (err) {
    console.error("[proxy] Session validation failed:", err);
  }

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_ONLY.some((p) => pathname.startsWith(p));

  if (isProtected && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

function safeHost(value: string): string | null {
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/proposals/:path*",
    "/budget/:path*",
    "/compliance/:path*",
    "/events/:path*",
    "/vendors/:path*",
    "/ai/:path*",
    "/billing/:path*",
    "/settings/:path*",
    "/login",
    "/api/:path*",
  ],
};
