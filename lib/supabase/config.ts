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

function isValidSupabaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

function isValidAnonKey(key: string): boolean {
  // Supabase anon keys are JWTs — three base64url segments separated by dots
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key.trim());
}

export function getSupabasePublicConfig(): { url: string; anonKey: string } {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  const urlOk = !!envUrl && isValidSupabaseUrl(envUrl);
  const keyOk = !!envKey && isValidAnonKey(envKey);

  if (urlOk && keyOk) {
    return { url: envUrl!, anonKey: envKey! };
  }

  if (!warnedFallback && typeof window === "undefined") {
    warnedFallback = true;
    const problems: string[] = [];
    if (!envUrl)       problems.push("NEXT_PUBLIC_SUPABASE_URL is not set");
    else if (!urlOk)   problems.push(`NEXT_PUBLIC_SUPABASE_URL is invalid ("${envUrl}"): must be https://<ref>.supabase.co`);
    if (!envKey)       problems.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");
    else if (!keyOk)   problems.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is not a valid JWT");
    console.warn(
      `[supabase] ${problems.join("; ")} — using hardcoded fallback. Fix env vars on Vercel to enable key rotation.`
    );
  }

  return { url: FALLBACK_URL, anonKey: FALLBACK_ANON_KEY };
}
