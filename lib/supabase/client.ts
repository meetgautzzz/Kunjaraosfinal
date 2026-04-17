import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("[supabase/client] URL:", supabaseUrl);
console.log("[supabase/client] KEY:", supabaseKey ? "set" : "missing");

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "[supabase/client] Missing environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set."
  );
}

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseKey);
}
