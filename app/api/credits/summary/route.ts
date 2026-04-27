// Read-only AI credit summary for the topbar meter and the buy-credits
// modal. Wraps lib/ai/credits.getRemaining — no business logic here.

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getRemaining } from "@/lib/ai/credits";

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const remaining = await getRemaining(auth.user.id);
  return NextResponse.json(
    { credits_remaining: remaining },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
