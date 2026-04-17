import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export function middleware(request: Request) {
  const response = NextResponse.next();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log("[middleware] SUPABASE_URL:", supabaseUrl);
  console.log("[middleware] SUPABASE_ANON_KEY:", supabaseKey ? "set" : "missing");

  const isValidUrl = (v: string | undefined): v is string => {
    if (!v) return false;
    try {
      const u = new URL(v);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  };

  if (!isValidUrl(supabaseUrl) || !supabaseKey) {
    console.error("[middleware] Missing or invalid Supabase env vars — skipping auth check.");
    return response;
  }

  try {
    createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    });
  } catch (err) {
    console.error("[middleware] createServerClient failed:", err);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/proposals/:path*", "/settings/:path*", "/login", "/signup"],
};
