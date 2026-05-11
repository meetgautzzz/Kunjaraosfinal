import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

// GET /api/analytics/stats
// Authorization: Bearer <CRON_SECRET>
// Returns historical counts straight from Supabase — the authoritative
// record that GA4 doesn't have for events before it was wired up.
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "DB admin unavailable." }, { status: 503 });
  }

  const [usageRes, proposalsRes] = await Promise.all([
    admin.from("user_usage").select("plan, proposals_used, created_at"),
    admin.from("proposals").select("id, user_id, created_at"),
  ]);

  const usageRows     = usageRes.data     ?? [];
  const proposalRows  = proposalsRes.data ?? [];

  const planCounts = usageRows.reduce<Record<string, number>>((acc, r) => {
    const p = r.plan ?? "free";
    acc[p] = (acc[p] ?? 0) + 1;
    return acc;
  }, {});

  const totalProposalsGenerated = usageRows.reduce(
    (sum, r) => sum + (r.proposals_used ?? 0), 0,
  );

  return NextResponse.json({
    users: {
      total:  usageRows.length,
      byPlan: planCounts,
    },
    proposals: {
      rows_in_db:        proposalRows.length,
      total_generated:   totalProposalsGenerated,
    },
    subscriptions: {
      paid: (planCounts["pro"] ?? 0) + (planCounts["basic"] ?? 0),
      free:  planCounts["free"] ?? 0,
    },
    note: "GA4 cannot be backfilled for events older than 72h. Use these numbers as the authoritative historical record.",
    generated_at: new Date().toISOString(),
  });
}
