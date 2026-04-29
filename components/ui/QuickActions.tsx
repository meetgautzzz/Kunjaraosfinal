const ACTIONS = [
  { label: "AI Proposal",     icon: "✦",  href: "/proposals/new", color: "hover:border-indigo-500/40 hover:bg-indigo-500/5"  },
  { label: "Create Estimate", icon: "📋", href: "/budget",        color: "hover:border-emerald-500/40 hover:bg-emerald-500/5" },
  { label: "New Event",       icon: "🎪", href: "/events",        color: "hover:border-purple-500/40 hover:bg-purple-500/5"  },
  { label: "Add Vendor",      icon: "🏪", href: "/vendors",       color: "hover:border-teal-500/40 hover:bg-teal-500/5"      },
  { label: "Run Compliance",  icon: "🛡️", href: "/compliance",    color: "hover:border-amber-500/40 hover:bg-amber-500/5"    },
  { label: "Today's Tasks",   icon: "✅", href: "/events",        color: "hover:border-sky-500/40 hover:bg-sky-500/5"        },
];

export default function QuickActions() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <h3 className="text-[var(--text-1)] font-semibold text-sm">Quick Actions</h3>
      </div>
      <div className="p-3 grid grid-cols-1 gap-1.5">
        {ACTIONS.map((a) => (
          <a
            key={a.label}
            href={a.href}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] transition-colors ${a.color}`}
          >
            <span className="text-base w-5 text-center shrink-0">{a.icon}</span>
            <span className="text-[var(--text-2)] text-xs font-medium">{a.label}</span>
            <span className="ml-auto text-[var(--text-3)] text-[10px]">→</span>
          </a>
        ))}
      </div>
    </div>
  );
}
