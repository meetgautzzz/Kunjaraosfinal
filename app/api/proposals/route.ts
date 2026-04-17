import { NextRequest, NextResponse } from "next/server";
import { generateProposal, ProposalInput } from "@/lib/generateProposal";
import { createClient } from "@/lib/supabase/server";
import { checkAndIncrementUsage } from "@/lib/usage";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ success: false, error: "OpenAI API key not configured." }, { status: 503 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Service unavailable." }, { status: 503 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    let body: ProposalInput;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
    }

    const { eventType, budget, location, audience, theme } = body;
    if (!eventType || !budget || !location || !audience || !theme) {
      return NextResponse.json({ success: false, error: "All fields are required." }, { status: 400 });
    }

    const usage = await checkAndIncrementUsage(user.id);

    let data;
    try {
      console.log("[proposals] Calling OpenAI for user:", user.id, "event:", eventType);
      data = await generateProposal(body);
      console.log("[proposals] OpenAI call succeeded");
    } catch (aiError) {
      console.error("[proposals] OpenAI call failed:", aiError);
      const message = aiError instanceof Error ? aiError.message : "AI generation failed.";
      return NextResponse.json({ success: false, error: message }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      data,
      usage: {
        events_used: usage.events_used,
        limit: usage.limit,
        overage: usage.overage,
        overage_charge: usage.overage ? 199 : 0,
      },
    });
  } catch (error) {
    console.error("[proposals] Unexpected error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
