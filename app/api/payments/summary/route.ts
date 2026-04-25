import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const { data, error } = await supabase
    .from("proposal_payments")
    .select("amount, status")
    .eq("user_id", auth.user.id)
    .neq("status", "CANCELLED");

  if (error) {
    return NextResponse.json({ error: "Could not load summary." }, { status: 500 });
  }

  const totals = { received: 0, verifying: 0, outstanding: 0, count: data?.length ?? 0 };
  for (const row of data ?? []) {
    const r = row as { amount: number; status: string };
    if (r.status === "CONFIRMED")      totals.received    += r.amount;
    else if (r.status === "PAID")      totals.verifying   += r.amount;
    else if (r.status === "REQUESTED") totals.outstanding += r.amount;
  }

  return NextResponse.json(totals);
}
