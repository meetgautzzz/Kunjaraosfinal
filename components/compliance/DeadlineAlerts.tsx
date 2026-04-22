"use client";

import { ComplianceItem, deadlineState, daysUntil } from "@/lib/compliance";

interface Props {
  items: ComplianceItem[];
}

export default function DeadlineAlerts({ items }: Props) {
  const overdue  = items.filter((i) => deadlineState(i) === "overdue");
  const urgent   = items.filter((i) => deadlineState(i) === "urgent");
  const upcoming = items.filter((i) => deadlineState(i) === "upcoming");

  if (!overdue.length && !urgent.length && !upcoming.length) return null;

  return (
    <div className="space-y-2">
      {overdue.length > 0 && (
        <AlertBanner
          icon="🚨"
          heading={`${overdue.length} permit${overdue.length > 1 ? "s" : ""} overdue`}
          items={overdue}
          cls="border-red-500/30 bg-red-500/5 text-red-400"
          badgeCls="bg-red-500/15 text-red-400 border-red-500/20"
          dayFn={(item) => `${Math.abs(daysUntil(item.deadline!))}d overdue`}
        />
      )}
      {urgent.length > 0 && (
        <AlertBanner
          icon="⚠️"
          heading={`${urgent.length} permit${urgent.length > 1 ? "s" : ""} due within 3 days`}
          items={urgent}
          cls="border-amber-500/30 bg-amber-500/5 text-amber-400"
          badgeCls="bg-amber-500/15 text-amber-400 border-amber-500/20"
          dayFn={(item) => {
            const d = daysUntil(item.deadline!);
            return d === 0 ? "Due today" : `${d}d left`;
          }}
        />
      )}
      {upcoming.length > 0 && (
        <AlertBanner
          icon="📅"
          heading={`${upcoming.length} permit${upcoming.length > 1 ? "s" : ""} due this week`}
          items={upcoming}
          cls="border-indigo-500/20 bg-indigo-500/5 text-indigo-400"
          badgeCls="bg-indigo-500/15 text-indigo-400 border-indigo-500/20"
          dayFn={(item) => `${daysUntil(item.deadline!)}d left`}
        />
      )}
    </div>
  );
}

function AlertBanner({
  icon, heading, items, cls, badgeCls, dayFn,
}: {
  icon: string;
  heading: string;
  items: ComplianceItem[];
  cls: string;
  badgeCls: string;
  dayFn: (item: ComplianceItem) => string;
}) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${cls}`}>
      <div className="flex items-start gap-2">
        <span className="text-sm shrink-0 mt-0.5">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{heading}</p>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {items.map((item) => (
              <span key={item.id} className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${badgeCls}`}>
                {item.name}
                <span className="opacity-70">· {dayFn(item)}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
