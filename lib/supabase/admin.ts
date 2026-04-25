// Service-role Supabase client. SERVER-ONLY.
//
// The service role key bypasses RLS. It must NEVER reach the browser bundle.
// The runtime guard below throws immediately if this module is imported into
// any client-side code path; combined with the absence of a NEXT_PUBLIC_
// prefix on the key, this is the second wall preventing accidental exposure.
//
// All API routes that need elevated permissions must import getAdminClient()
// from here — do not call createClient(...) with the service key inline.

if (typeof window !== "undefined") {
  throw new Error(
    "lib/supabase/admin.ts is server-only and must not be imported into client code. " +
    "If you see this in the browser, the service role key has been bundled — investigate immediately."
  );
}

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;
let warnedMissing = false;

/**
 * Returns a singleton Supabase admin client backed by SUPABASE_SERVICE_ROLE_KEY.
 * Returns null when either NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY
 * is not set — callers must handle null and return a 503 to the user.
 *
 * On the first miss per process, a clear per-variable warning is logged so
 * it's obvious in prod logs which env var needs to be added on Vercel.
 */
export function getAdminClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    if (!warnedMissing) {
      const missing: string[] = [];
      if (!url)        missing.push("NEXT_PUBLIC_SUPABASE_URL");
      if (!serviceKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
      console.error(
        `[supabase/admin] Service-role client unavailable — missing env: ${missing.join(", ")}. ` +
        `Set on Vercel (Project Settings → Environment Variables) and redeploy. ` +
        `Until set, every route requiring elevated permissions will return 503.`
      );
      warnedMissing = true;
    }
    return null;
  }

  cachedClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedClient;
}

/**
 * True iff the service role key is configured. Useful for /api/health-style
 * checks without instantiating a client.
 */
export function isAdminConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
