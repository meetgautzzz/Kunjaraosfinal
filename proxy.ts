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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
