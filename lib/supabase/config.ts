// Public Supabase config (URL + anon key) with safe fallback.
//
// Why env-first with fallback: the anon key is already public (it ships in
// the browser bundle by Supabase's design), so the hardcoded values are not
// a secret leak — but keeping env as the source of truth unlocks rotation
// and new-project switching without a code deploy. The fallback prevents
// module-load crashes in environments where the vars happen to be missing
// (which was the original reason these were hardcoded).
//
// If you rotate keys or move projects: update the env vars. The fallback
// below is the last-known-good pair and should be removed once every
// deployment target (local, preview, prod) is confirmed to read from env.

const FALLBACK_URL = "https://rosyqkstglgdylbcnbcb.supabase.co";
const FALLBACK_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvc3lxa3N0Z2xnZHlsYmNuYmNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0OTc0MTgsImV4cCI6MjA5MTA3MzQxOH0.OCKd0u1qKB0Ba1S2x2U2bSrAXvzLiqi8UFXNEqiWFqQ";

let warnedFallback = false;

export function getSupabasePublicConfig(): { url: string; anonKey: string } {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey };
  }

  if (!warnedFallback && typeof window === "undefined") {
    warnedFallback = true;
    console.warn(
      "[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY not set — using hardcoded fallback. Set these in env to enable key rotation."
    );
  }

  return { url: FALLBACK_URL, anonKey: FALLBACK_ANON_KEY };
}
