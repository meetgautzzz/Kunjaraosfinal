import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

// POST /api/auth/activate-free
// Called from the signup page when a user selects the free plan.
// Sets subscription_active: true in app_metadata (bypasses the /onboarding gate)
// and ensures a user_usage row exists.
export async function POST() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  await admin.auth.admin.updateUserById(user.id, {
    app_metadata: { subscription_active: true, plan: "free" },
  });

  await admin.from("user_usage").upsert({
    user_id:        user.id,
    plan:           "free",
    proposals_used: 0,
  }, { onConflict: "user_id", ignoreDuplicates: true });

  return NextResponse.json({ ok: true });
}
