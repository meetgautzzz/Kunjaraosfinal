import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const SignupSchema = z.object({
  email:    z.string().email().max(300),
  password: z.string().min(8).max(128),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = SignupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
  }

  // Create user with email pre-confirmed so no verification email is sent.
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
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

  return NextResponse.json({ ok: true });
}
