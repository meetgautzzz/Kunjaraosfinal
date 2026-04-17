import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { credits, payment_id } = await req.json() as { credits: number; payment_id: string };

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Service unavailable." }, { status: 503 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    console.log("[add-credits] Adding", credits, "credits for user:", user.id, "payment:", payment_id);

    const { error } = await supabase
      .from("user_usage")
      .upsert({
        user_id: user.id,
        events_used: 0,
        plan: "basic",
        credits_added: credits,
        last_payment_id: payment_id,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (error) {
      console.error("[add-credits] DB error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, credits });
  } catch (error) {
    console.error("[add-credits] Error:", error);
    return NextResponse.json({ success: false, error: "Unexpected error." }, { status: 500 });
  }
}
