const ACTIVITY = [
  { id: 1, user: "G", color: "from-indigo-500 to-purple-500", action: "created event",    subject: "Gala Night 2025",          time: "2m ago" },
  { id: 2, user: "A", color: "from-emerald-500 to-teal-500",  action: "onboarded vendor", subject: "Apex Events Co.",           time: "18m ago" },
  { id: 3, user: "R", color: "from-orange-500 to-amber-500",  action: "updated",          subject: "Compliance Report Q1",     time: "1h ago" },
  { id: 4, user: "G", color: "from-indigo-500 to-purple-500", action: "approved",         subject: "Tech Summit KUN-042",      time: "3h ago" },
  { id: 5, user: "S", color: "from-pink-500 to-rose-500",     action: "added vendor",     subject: "SoundWave Productions",    time: "Yesterday" },
  { id: 6, user: "A", color: "from-emerald-500 to-teal-500",  action: "submitted",        subject: "Annual Compliance Review", time: "Yesterday" },
];

const USER_NAMES: Record<string, string> = { G: "Gautam", A: "Aisha", R: "Ravi", S: "Sara" };

export default function ActivityFeed() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] h-full">
      <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
        <h3 className="text-[var(--text-1)] font-semibold text-sm">Recent Activity</h3>
        <span className="text-[10px] text-[var(--text-3)] border border-[var(--border)] rounded-full px-2 py-0.5">Live</span>
      </div>
      <ul className="divide-y divide-[var(--border)]">
        {ACTIVITY.map((a) => (
          <li key={a.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-[var(--bg-hover)] transition-colors">
            <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${a.color} flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5`}>
              {a.user}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[var(--text-2)] text-sm">
                <span className="text-[var(--text-1)] font-medium">{USER_NAMES[a.user] ?? a.user} </span>
                {a.action}{" "}
                <span className="text-[var(--text-1)] font-medium">{a.subject}</span>
              </p>
            </div>
            <span className="text-[var(--text-3)] text-xs shrink-0">{a.time}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
