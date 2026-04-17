import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log("[supabase/client] URL:", supabaseUrl);
  console.log("[supabase/client] KEY:", supabaseKey ? "set" : "missing");

  if (!supabaseUrl || !supabaseUrl.startsWith("https://")) {
    throw new Error(
      "[supabase/client] NEXT_PUBLIC_SUPABASE_URL is missing or not a valid HTTPS URL."
    );
  }

  if (!supabaseKey) {
    throw new Error(
      "[supabase/client] NEXT_PUBLIC_SUPABASE_ANON_KEY is missing."
    );
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
