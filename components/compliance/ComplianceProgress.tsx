"use client";

import { ComplianceItem, ComplianceStatus, STATUS_CONFIG, calcScore } from "@/lib/compliance";

interface Props {
  items: ComplianceItem[];
}

export default function ComplianceProgress({ items }: Props) {
  const score = calcScore(items);

  const counts = items.reduce<Record<ComplianceStatus, number>>(
    (acc, item) => { acc[item.status]++; return acc; },
    { NOT_STARTED: 0, IN_PROGRESS: 0, SUBMITTED: 0, APPROVED: 0, REJECTED: 0, WAIVED: 0 }
  );

  const approved  = counts.APPROVED + counts.WAIVED;
  const inFlight  = counts.IN_PROGRESS + counts.SUBMITTED;
  const pending   = counts.NOT_STARTED;
  const rejected  = counts.REJECTED;
  const total     = items.length;

  const scoreColor =
    score >= 80 ? { ring: "#10b981", text: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/5" } :
    score >= 50 ? { ring: "#f59e0b", text: "text-amber-400",   border: "border-amber-500/30",   bg: "bg-amber-500/5"   } :
                  { ring: "#ef4444", text: "text-red-400",      border: "border-red-500/30",     bg: "bg-red-500/5"     };

  const label =
    score >= 80 ? "Excellent Compliance" :
    score >= 60 ? "Good Standing" :
    score >= 40 ? "Needs Attention" :
                  "Critical Gaps";

  const circumference = 2 * Math.PI * 15.9;
  const dashArray     = `${(score / 100) * circumference} ${circumference}`;

  return (
    <div className={`rounded-xl border ${scoreColor.border} ${scoreColor.bg} p-5 flex flex-col sm:flex-row items-center gap-6`}>
      {/* Score ring */}
      <div className="relative w-24 h-24 shrink-0">
        <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1f2330" strokeWidth="2.5" />
          <circle
            cx="18" cy="18" r="15.9"
            fill="none"
            stroke={scoreColor.ring}
            strokeWidth="2.5"
            strokeDasharray={dashArray}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-black ${scoreColor.text}`}>{score}</span>
          <span className="text-[10px] text-[var(--text-3)]">/ 100</span>
        </div>
      </div>

      {/* Summary */}
      <div className="flex-1">
        <h3 className="text-[var(--text-1)] font-bold text-lg">{label}</h3>
        <p className="text-[var(--text-2)] text-sm mt-0.5">
          {approved} of {total} permits cleared
          {rejected > 0 && <span className="text-red-400 ml-1">· {rejected} rejected</span>}
        </p>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 w-full bg-[var(--bg-surface)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              background: `linear-gradient(90deg, ${scoreColor.ring}, ${score >= 80 ? "#6ee7b7" : score >= 50 ? "#fcd34d" : "#fca5a5"})`,
              width: `${score}%`,
            }}
          />
        </div>

        {/* Stat pills */}
        <div className="flex flex-wrap gap-2 mt-3">
          {approved > 0 && (
            <Pill label={`${approved} Approved`} cls="bg-emerald-500/15 text-emerald-400 border-emerald-500/20" />
          )}
          {inFlight > 0 && (
            <Pill label={`${inFlight} In Flight`} cls="bg-indigo-500/15 text-indigo-400 border-indigo-500/20" />
          )}
          {pending > 0 && (
            <Pill label={`${pending} Pending`} cls="bg-[var(--bg-surface)] text-[var(--text-3)] border-[var(--border)]" />
          )}
          {rejected > 0 && (
            <Pill label={`${rejected} Rejected`} cls="bg-red-500/15 text-red-400 border-red-500/20" />
          )}
        </div>
      </div>

      {/* Status breakdown */}
      <div className="hidden lg:grid grid-cols-3 gap-2 shrink-0">
        {(["APPROVED","SUBMITTED","IN_PROGRESS","NOT_STARTED","REJECTED","WAIVED"] as ComplianceStatus[]).map((s) => (
          counts[s] > 0 && (
            <div key={s} className={`rounded-lg border px-3 py-2 text-center min-w-[70px] ${STATUS_CONFIG[s].bg}`}>
              <p className={`text-lg font-bold ${STATUS_CONFIG[s].color}`}>{counts[s]}</p>
              <p className="text-[var(--text-3)] text-[10px] leading-tight mt-0.5">{STATUS_CONFIG[s].label}</p>
            </div>
          )
        ))}
      </div>
    </div>
  );
}

function Pill({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${cls}`}>{label}</span>
  );
}
