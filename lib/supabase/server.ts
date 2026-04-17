import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const SUPABASE_URL = "https://rosyqkstglgdylbcnbcb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvc3lxa3N0Z2xnZHlsYmNuYmNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0OTc0MTgsImV4cCI6MjA5MTA3MzQxOH0.OCKd0u1qKB0Ba1S2x2U2bSrAXvzLiqi8UFXNEqiWFqQ";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {}
      },
    },
  });
}
