import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendGA4Event } from "@/lib/ga4";

const SignupSchema = z.object({
  name:     z.string().min(1).max(200).trim(),
  email:    z.string().email().max(300),
  password: z.string().min(8).max(128),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = SignupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 400 });
  }

  const { name, email, password } = parsed.data;

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
  }

  // Create user with email pre-confirmed so no verification email is sent.
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
    app_metadata:  { subscription_active: false },
  });

  if (createError) {
    const msg = createError.message ?? "";
    if (msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("already exists")) {
      return NextResponse.json({ error: "That email is already registered. Sign in instead." }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not create account. Try again." }, { status: 500 });
  }

  if (!created.user) {
    return NextResponse.json({ error: "Could not create account. Try again." }, { status: 500 });
  }

  // Sign in immediately so the browser gets a session cookie.
  const supabase = await createClient();
  if (supabase) {
    await supabase.auth.signInWithPassword({ email, password });
  }

  // Provision a free-tier usage row so gating checks work immediately.
  void admin.from("user_usage").insert({
    user_id:        created.user.id,
    plan:           "free",
    proposals_used: 0,
  });

  void sendGA4Event(created.user.id, "sign_up", { method: "email", plan: "free" });

  return NextResponse.json({ ok: true });
}
