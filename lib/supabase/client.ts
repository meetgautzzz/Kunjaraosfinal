import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = "https://rosyqkstglgdylbcnbcb.supabase.co";
  const supabaseKey = "sb_publishable_5QtK2tJo3sp5-xyMZ-9hmQ_3TDF3qTz";

  return createBrowserClient(supabaseUrl, supabaseKey);
}
