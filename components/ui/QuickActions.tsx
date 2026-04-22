const ACTIONS = [
  { label: "AI Proposal",    icon: "✦",  href: "/proposals/new",  color: "hover:border-indigo-500/40 hover:bg-indigo-500/5" },
  { label: "New Event",      icon: "🎪", href: "/events",         color: "hover:border-purple-500/40 hover:bg-purple-500/5" },
  { label: "Add Vendor",     icon: "🏪", href: "/vendors",        color: "hover:border-emerald-500/40 hover:bg-emerald-500/5" },
  { label: "Run Compliance", icon: "🛡️", href: "/compliance",     color: "hover:border-amber-500/40 hover:bg-amber-500/5" },
];

export default function QuickActions() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] h-full">
      <div className="px-5 py-4 border-b border-[var(--border)]">
        <h3 className="text-[var(--text-1)] font-semibold text-sm">Quick Actions</h3>
      </div>
      <div className="p-4 flex flex-col gap-2">
        {ACTIONS.map((a) => (
          <a
            key={a.label}
            href={a.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] transition-colors cursor-pointer ${a.color}`}
          >
            <span className="text-lg">{a.icon}</span>
            <span className="text-[var(--text-2)] text-sm font-medium">{a.label}</span>
            <span className="ml-auto text-[var(--text-3)] text-xs">→</span>
          </a>
        ))}
      </div>
    </div>
  );
}
