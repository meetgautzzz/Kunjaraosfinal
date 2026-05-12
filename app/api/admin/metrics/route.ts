import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

const OWNER_EMAIL = "meetgautzzz@gmail.com";

export async function GET() {
  // Auth: only owner can call this endpoint
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Unavailable." }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== OWNER_EMAIL) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Admin DB unavailable." }, { status: 503 });

  try {
    // ── 1. All auth users (email + created_at) via admin ─────────────────────
    const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const allUsers = authData?.users ?? [];
    const totalUsers = allUsers.length;

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000);

    const newSignupsThisWeek = allUsers.filter(
      (u) => new Date(u.created_at) >= sevenDaysAgo
    ).length;

    // ── 2. Plan distribution from user_usage ─────────────────────────────────
    const { data: usageRows } = await admin
      .from("user_usage")
      .select("user_id, plan, created_at");

    const usageMap = new Map((usageRows ?? []).map((r) => [r.user_id, r]));

    const planCounts = { free: 0, pro: 0, basic: 0 };
    for (const r of usageRows ?? []) {
      const p = (r.plan ?? "free") as keyof typeof planCounts;
      if (p in planCounts) planCounts[p]++;
    }

    // ── 3. MRR from active pro subscriptions ─────────────────────────────────
    const { data: activeSubs } = await admin
      .from("user_subscriptions")
      .select("plan, status");
    const proCount = (activeSubs ?? []).filter(
      (s) => s.plan === "pro" && s.status === "active"
    ).length;
    const mrrTotal = proCount * 3000;

    // ── 4. Churn (cancelled in last 30 days / all subs created last 30 days) ─
    const { data: recentSubs } = await admin
      .from("user_subscriptions")
      .select("status, updated_at, created_at")
      .gte("created_at", thirtyDaysAgo.toISOString());

    const cancelled = (recentSubs ?? []).filter((s) => s.status === "cancelled").length;
    const totalRecentSubs = recentSubs?.length ?? 0;
    const churnRate = totalRecentSubs > 0
      ? Math.round((cancelled / totalRecentSubs) * 1000) / 10
      : 0;

    // ── 5. User growth — 12-week rolling buckets ──────────────────────────────
    const userGrowth = [];
    for (let i = 11; i >= 0; i--) {
      const weekEnd   = new Date(now.getTime() - i * 7 * 86_400_000);
      const weekStart = new Date(weekEnd.getTime() - 7 * 86_400_000);

      const weekSignups = allUsers.filter((u) => {
        const t = new Date(u.created_at);
        return t >= weekStart && t < weekEnd;
      }).length;

      const totalByWeekEnd = allUsers.filter(
        (u) => new Date(u.created_at) < weekEnd
      ).length;

      userGrowth.push({
        week:    `W${12 - i}`,
        users:   totalByWeekEnd,
        signups: weekSignups,
      });
    }

    // ── 6. Revenue — 12-week rolling buckets from subscription_invoices ───────
    const { data: invoices } = await admin
      .from("subscription_invoices")
      .select("amount, created_at, status")
      .eq("status", "paid");

    const revenueData = [];
    for (let i = 11; i >= 0; i--) {
      const weekEnd   = new Date(now.getTime() - i * 7 * 86_400_000);
      const weekStart = new Date(weekEnd.getTime() - 7 * 86_400_000);

      const weekRevenue = (invoices ?? [])
        .filter((inv) => {
          const t = new Date(inv.created_at);
          return t >= weekStart && t < weekEnd;
        })
        .reduce((sum, inv) => sum + (inv.amount ?? 0), 0);

      revenueData.push({ week: `W${12 - i}`, revenue: Math.round(weekRevenue / 100) });
    }

    // ── 7. Recent signups (last 10) — join auth.users + user_usage ───────────
    const recentUsers = [...allUsers]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);

    const recentSignups = recentUsers.map((u) => {
      const usage = usageMap.get(u.id);
      return {
        id:        u.id,
        email:     u.email ?? "—",
        plan:      usage?.plan ?? "free",
        createdAt: new Date(u.created_at).toLocaleDateString("en-IN", {
          day: "numeric", month: "short", year: "numeric",
        }),
      };
    });

    // ── 8. Proposals count ────────────────────────────────────────────────────
    const { count: proposalCount } = await admin
      .from("proposals")
      .select("id", { count: "exact", head: true });

    return NextResponse.json({
      totalUsers,
      newSignupsThisWeek,
      mrrTotal,
      churnRate,
      planDistribution: [
        { plan: "Free",  count: planCounts.free  },
        { plan: "Pro",   count: planCounts.pro   },
        { plan: "Basic", count: planCounts.basic },
      ],
      userGrowth,
      revenueData,
      recentSignups,
      proposalCount: proposalCount ?? 0,
    });
  } catch (err) {
    console.error("[admin/metrics]", err);
    return NextResponse.json({ error: "Failed to fetch metrics." }, { status: 500 });
  }
}
