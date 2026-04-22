import { Suspense } from "react";
import UpgradeBanner from "./UpgradeBanner";
import StatCard from "@/components/ui/StatCard";
import ActivityFeed from "@/components/ui/ActivityFeed";
import QuickActions from "@/components/ui/QuickActions";

const STATUS_STYLES: Record<string, string> = {
  "Confirmed": "bg-emerald-500/15 text-emerald-400",
  "Pending":   "bg-amber-500/15 text-amber-400",
  "In Review": "bg-indigo-500/15 text-indigo-400",
  "Cancelled": "bg-red-500/15 text-red-400",
};

const EVENTS = [
  { name: "Gala Night 2025",      date: "Apr 12, 2025", venue: "Grand Hyatt",    vendors: 8,  status: "Confirmed" },
  { name: "Tech Summit KUN-042",  date: "Apr 18, 2025", venue: "Convention Ctr", vendors: 12, status: "In Review" },
  { name: "Product Launch – X1",  date: "Apr 25, 2025", venue: "Rooftop Arena",  vendors: 5,  status: "Pending" },
  { name: "Annual Compliance Day", date: "May 2, 2025",  venue: "HQ Auditorium", vendors: 3,  status: "Confirmed" },
];

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">

      <Suspense>
        <UpgradeBanner />
      </Suspense>

      <div>
        <h2 className="text-2xl font-bold text-[var(--text-1)]">Good morning, Gautam 👋</h2>
        <p className="text-[var(--text-2)] text-sm mt-1">Here's what's happening across your workspace today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Events"     value="128"  delta="+12%" trend="up"   icon="🎪" />
        <StatCard label="Active Vendors"   value="34"   delta="+3"   trend="up"   icon="🏪" />
        <StatCard label="Compliance Score" value="94%"  delta="+2%"  trend="up"   icon="🛡️" />
        <StatCard label="Open Tasks"       value="17"   delta="-5"   trend="down" icon="✅" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ActivityFeed />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h3 className="text-[var(--text-1)] font-semibold text-sm">Upcoming Events</h3>
          <a href="/events" className="text-indigo-400 text-xs hover:text-indigo-300 transition-colors">View all →</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {["Event", "Date", "Venue", "Vendors", "Status"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[var(--text-3)] text-xs font-medium uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EVENTS.map((e, i) => (
                <tr key={i} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-hover)] transition-colors">
                  <td className="px-5 py-3.5 text-[var(--text-1)] font-medium">{e.name}</td>
                  <td className="px-5 py-3.5 text-[var(--text-2)]">{e.date}</td>
                  <td className="px-5 py-3.5 text-[var(--text-2)]">{e.venue}</td>
                  <td className="px-5 py-3.5 text-[var(--text-2)]">{e.vendors}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[e.status]}`}>
                      {e.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
