import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    console.error("[supabase/client] Missing NEXT_PUBLIC_SUPABASE_URL");
    return null;
  }

  if (!key) {
    console.error("[supabase/client] Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
    return null;
  }

  return createBrowserClient(url, key);
}
