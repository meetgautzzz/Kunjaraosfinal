import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production." }, { status: 403 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase unavailable." }, { status: 503 });
  }

  const email = "test@kunjara.com";
  const password = "Test@12345";

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error && error.message.includes("already registered")) {
    return NextResponse.json({ message: "Test user already exists.", email });
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ message: "Test user created.", email, id: data.user?.id });
}
