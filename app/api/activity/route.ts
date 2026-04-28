import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json([]);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json([], { status: 401 });

  // Build activity from recent proposals and vendors (newest 8 combined)
  const [propRes, vendRes] = await Promise.all([
    supabase
      .from("proposals")
      .select("id, data, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("vendors")
      .select("id, name, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const email = user.email ?? "";
  const initial = email.charAt(0).toUpperCase() || "?";

  const items: { id: string; action: string; subject: string; time: string; initial: string; ts: number }[] = [];

  for (const row of propRes.data ?? []) {
    const d = row.data as Record<string, unknown>;
    items.push({
      id:      `prop_${row.id}`,
      action:  "created proposal",
      subject: (d?.title as string) || "Untitled Proposal",
      time:    relativeTime(row.created_at),
      initial,
      ts:      new Date(row.created_at).getTime(),
    });
  }

  for (const row of vendRes.data ?? []) {
    items.push({
      id:      `vend_${row.id}`,
      action:  "added vendor",
      subject: row.name,
      time:    relativeTime(row.created_at),
      initial,
      ts:      new Date(row.created_at).getTime(),
    });
  }

  items.sort((a, b) => b.ts - a.ts);

  return NextResponse.json(
    items.slice(0, 8).map(({ ts: _ts, ...rest }) => rest)
  );
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  <  1)  return "Just now";
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days  <  2)  return "Yesterday";
  return `${days}d ago`;
}
