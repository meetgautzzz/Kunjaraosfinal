"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPlan, type PlanId } from "@/lib/plans";

const nav = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21H3V9.75z" />
      </svg>
    ),
  },
  {
    label: "Proposals",
    href: "/proposals",
    icon: (
      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/settings",
    icon: (
      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [usage, setUsage] = useState<{ events_used: number; limit: number; plan: string } | null>(null);

  useEffect(() => {
    async function loadUsage() {
      const supabase = createClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("user_usage").select("events_used, plan").eq("user_id", user.id).single();
      if (data) {
        const plan = getPlan((data.plan as PlanId) ?? "basic");
        setUsage({ events_used: data.events_used, limit: plan.events, plan: plan.name });
      }
    }
    loadUsage();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex w-56 flex-col border-r border-white/5 bg-surface">
      <div className="border-b border-white/5 px-5 py-5">
        <span className="text-xs font-bold tracking-widest text-text-secondary uppercase">
          Kunjara OS™
        </span>
      </div>

      <nav className="flex flex-col gap-0.5 p-3">
        {nav.map(({ label, href, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150 ${
                active
                  ? "bg-white/8 text-text-primary"
                  : "text-text-secondary hover:bg-white/4 hover:text-text-primary"
              }`}
            >
              <span className={active ? "text-text-primary" : "text-white/30"}>
                {icon}
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      {usage && (
        <div className="mx-3 mb-2 rounded-xl border border-white/5 bg-bg/50 px-3 py-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-text-secondary">{usage.plan} Plan</p>
            <p className="text-xs text-text-secondary">{usage.events_used}/{usage.limit}</p>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/8">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                usage.events_used >= usage.limit ? "bg-red-400" : "bg-accent-blue"
              }`}
              style={{ width: `${Math.min((usage.events_used / usage.limit) * 100, 100)}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-text-secondary">
            {usage.events_used >= usage.limit ? "Overage: ₹199/proposal" : `${usage.limit - usage.events_used} remaining`}
          </p>
        </div>
      )}

      <div className="border-t border-white/5 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-text-secondary transition-all duration-150 hover:bg-white/4 hover:text-text-primary"
        >
          <span className="text-white/30">
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
