"use client";
import Link from "next/link";

export default function EventsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-1)]">Events</h2>
          <p className="text-[var(--text-2)] text-sm mt-1">Manage and track all your events in one place.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors">
          + New Event
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        {["All", "Confirmed", "Pending", "In Review", "Cancelled"].map((f) => (
          <button key={f} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${f === "All" ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400" : "border-[var(--border)] text-[var(--text-2)] hover:border-indigo-500/30 hover:text-[var(--text-1)]"}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {EVENTS.map((e) => (
          <div key={e.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 hover:border-indigo-500/30 transition-colors group">
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">{e.emoji}</span>
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS[e.status]}`}>{e.status}</span>
            </div>
            <h4 className="text-[var(--text-1)] font-semibold text-sm mb-1">{e.name}</h4>
            <p className="text-[var(--text-3)] text-xs mb-4">{e.date} · {e.venue}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-[var(--text-3)]">
                <span>🏪 {e.vendors} vendors</span>
                <span>👥 {e.guests} guests</span>
              </div>
              <Link href={`/events/${e.id}/room`}
                className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-all">
                Open Room →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const STATUS: Record<string, string> = {
  "Confirmed": "bg-emerald-500/15 text-emerald-400",
  "Pending":   "bg-amber-500/15 text-amber-400",
  "In Review": "bg-indigo-500/15 text-indigo-400",
  "Cancelled": "bg-red-500/15 text-red-400",
};

const EVENTS = [
  { id: 1, emoji: "🎪", name: "Gala Night 2025",        date: "Apr 12",  venue: "Grand Hyatt",    vendors: 8,  guests: 350, status: "Confirmed" },
  { id: 2, emoji: "💻", name: "Tech Summit KUN-042",    date: "Apr 18",  venue: "Convention Ctr", vendors: 12, guests: 600, status: "In Review" },
  { id: 3, emoji: "🚀", name: "Product Launch – X1",    date: "Apr 25",  venue: "Rooftop Arena",  vendors: 5,  guests: 200, status: "Pending"   },
  { id: 4, emoji: "🏛️", name: "Annual Compliance Day",  date: "May 2",   venue: "HQ Auditorium",  vendors: 3,  guests: 120, status: "Confirmed" },
  { id: 5, emoji: "🎵", name: "Brand Activation Night", date: "May 9",   venue: "Sky Lounge",     vendors: 6,  guests: 180, status: "Pending"   },
  { id: 6, emoji: "🎓", name: "Leadership Summit",      date: "May 15",  venue: "Conference Ctr", vendors: 4,  guests: 90,  status: "In Review" },
];
