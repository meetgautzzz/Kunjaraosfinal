import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL = "https://rosyqkstglgdylbcnbcb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvc3lxa3N0Z2xnZHlsYmNuYmNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0OTc0MTgsImV4cCI6MjA5MTA3MzQxOH0.OCKd0u1qKB0Ba1S2x2U2bSrAXvzLiqi8UFXNEqiWFqQ";

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
