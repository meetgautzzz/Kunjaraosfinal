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
const AUTH_ONLY = ["/login", "/signup"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error("[proxy] Missing Supabase env vars — skipping auth check.");
    return NextResponse.next();
  }

  const response = NextResponse.next();

  let sessionToken: string | undefined;

  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {},
      },
    });

    const authCookieName = `sb-${new URL(url).hostname.split(".")[0]}-auth-token`;
    sessionToken = request.cookies.get(authCookieName)?.value;

    void supabase;
  } catch (err) {
    console.error("[proxy] createServerClient failed:", err);
    return response;
  }

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_ONLY.some((p) => pathname.startsWith(p));

  if (isProtected && !sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && sessionToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
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
    "/signup",
  ],
};
