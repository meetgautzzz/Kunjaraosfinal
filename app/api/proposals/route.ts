import { NextRequest, NextResponse } from "next/server";
import { generateProposal, ProposalInput } from "@/lib/generateProposal";
import { createClient } from "@/lib/supabase/server";
import { checkAndIncrementUsage } from "@/lib/usage";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const body: ProposalInput = await req.json();
    const { eventType, budget, location, audience, theme } = body;

    if (!eventType || !budget || !location || !audience || !theme) {
      return NextResponse.json({ success: false, error: "All fields are required." }, { status: 400 });
    }

    const usage = await checkAndIncrementUsage(user.id);

    const data = await generateProposal(body);

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
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
