"use client";

import { useRef, useState } from "react";
import {
  ComplianceItem as TItem,
  ComplianceStatus,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  deadlineState,
  daysUntil,
} from "@/lib/compliance";

interface Props {
  item: TItem;
  onChange: (updated: TItem) => void;
}

const STATUSES: ComplianceStatus[] = [
  "NOT_STARTED", "IN_PROGRESS", "SUBMITTED", "APPROVED", "REJECTED", "WAIVED",
];

export default function ComplianceItemRow({ item, onChange }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const cfg    = STATUS_CONFIG[item.status];
  const pCfg   = PRIORITY_CONFIG[item.priority];
  const ds     = deadlineState(item);

  const deadlineLabel = item.deadline
    ? (() => {
        const d = daysUntil(item.deadline);
        if (item.status === "APPROVED" || item.status === "WAIVED") return null;
        if (d < 0)  return { text: `${Math.abs(d)}d overdue`, cls: "text-red-400" };
        if (d === 0) return { text: "Due today",              cls: "text-red-400" };
        if (d <= 3)  return { text: `${d}d left`,             cls: "text-amber-400" };
        if (d <= 7)  return { text: `${d}d left`,             cls: "text-amber-300" };
        return       { text: `${d}d left`,                    cls: "text-[var(--text-3)]" };
      })()
    : null;

  function handleStatusChange(s: ComplianceStatus) {
    onChange({
      ...item,
      status: s,
      submittedAt: s === "SUBMITTED" && !item.submittedAt ? new Date().toISOString() : item.submittedAt,
      approvedAt:  s === "APPROVED"  && !item.approvedAt  ? new Date().toISOString() : item.approvedAt,
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange({ ...item, documentName: file.name, documentUrl: URL.createObjectURL(file) });
  }

  function handleRemoveDoc() {
    onChange({ ...item, documentName: null, documentUrl: null });
  }

  return (
    <div className={`border-b border-[var(--border)] transition-colors ${ds === "overdue" ? "bg-red-500/[0.03]" : ds === "urgent" ? "bg-amber-500/[0.03]" : ""}`}>
      {/* Main row */}
      <div
        className="flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--bg-hover)] cursor-pointer select-none"
        onClick={() => setExpanded((x) => !x)}
      >
        {/* Priority dot */}
        <span className={`w-2 h-2 rounded-full shrink-0 ${pCfg.dot}`} title={pCfg.label} />

        {/* Name + authority */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-1)] text-sm font-medium">{item.name}</span>
            {item.documentName && (
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-medium">
                Doc attached
              </span>
            )}
          </div>
          <p className="text-[var(--text-3)] text-xs truncate">{item.authority}</p>
        </div>

        {/* Deadline */}
        <div className="hidden sm:flex flex-col items-end text-xs shrink-0 w-20">
          {deadlineLabel ? (
            <span className={deadlineLabel.cls}>{deadlineLabel.text}</span>
          ) : (
            <span className="text-[var(--text-3)]">—</span>
          )}
          {item.deadline && (
            <span className="text-[var(--text-3)] text-[10px]">
              {new Date(item.deadline).toLocaleDateString("en-IN", { day:"numeric", month:"short" })}
            </span>
          )}
        </div>

        {/* Status badge */}
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          <select
            value={item.status}
            onChange={(e) => handleStatusChange(e.target.value as ComplianceStatus)}
            className={`text-xs font-medium px-2.5 py-1 rounded-lg border cursor-pointer appearance-none bg-transparent ${cfg.bg} ${cfg.color} outline-none`}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s} className="bg-[#1c2029] text-[var(--text-1)]">
                {STATUS_CONFIG[s].label}
              </option>
            ))}
          </select>
        </div>

        {/* Chevron */}
        <svg className={`w-4 h-4 text-[var(--text-3)] shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-[var(--border)] bg-[var(--bg-surface)]">
          {/* Description + instructions */}
          <div className="grid sm:grid-cols-2 gap-4 pt-4">
            <div>
              <p className="text-[var(--text-3)] text-[11px] uppercase tracking-wide font-medium mb-1">About</p>
              <p className="text-[var(--text-2)] text-xs leading-relaxed">{item.description}</p>
              <p className="text-[var(--text-3)] text-[11px] uppercase tracking-wide font-medium mt-3 mb-1">How to apply</p>
              <p className="text-[var(--text-2)] text-xs leading-relaxed">{item.instructions}</p>
            </div>
            <div className="space-y-3">
              {/* Fee + processing */}
              <div className="flex gap-4">
                <div>
                  <p className="text-[var(--text-3)] text-[11px] uppercase tracking-wide font-medium mb-0.5">Est. Fee</p>
                  <p className="text-[var(--text-1)] text-xs font-medium">{item.fee}</p>
                </div>
                <div>
                  <p className="text-[var(--text-3)] text-[11px] uppercase tracking-wide font-medium mb-0.5">Processing</p>
                  <p className="text-[var(--text-1)] text-xs font-medium">{item.processingDays} days</p>
                </div>
                <div>
                  <p className="text-[var(--text-3)] text-[11px] uppercase tracking-wide font-medium mb-0.5">Priority</p>
                  <span className={`text-xs font-medium ${pCfg.dot.replace("bg-", "text-").replace("-500", "-400")}`}>{pCfg.label}</span>
                </div>
              </div>

              {/* Dates */}
              {(item.submittedAt || item.approvedAt) && (
                <div className="flex gap-4 text-xs">
                  {item.submittedAt && (
                    <div>
                      <p className="text-[var(--text-3)] text-[11px] uppercase tracking-wide font-medium mb-0.5">Submitted</p>
                      <p className="text-[var(--text-2)]">{new Date(item.submittedAt).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}</p>
                    </div>
                  )}
                  {item.approvedAt && (
                    <div>
                      <p className="text-[var(--text-3)] text-[11px] uppercase tracking-wide font-medium mb-0.5">Approved</p>
                      <p className="text-emerald-400">{new Date(item.approvedAt).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Document upload */}
              <div>
                <p className="text-[var(--text-3)] text-[11px] uppercase tracking-wide font-medium mb-1.5">Document</p>
                {item.documentName ? (
                  <div className="flex items-center gap-2">
                    <a
                      href={item.documentUrl ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <PaperclipIcon />
                      {item.documentName}
                    </a>
                    <button
                      onClick={handleRemoveDoc}
                      className="text-[var(--text-3)] hover:text-red-400 text-xs transition-colors ml-1"
                      title="Remove document"
                    >✕</button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs text-[var(--text-2)] hover:text-[var(--text-1)] border border-dashed border-[var(--border)] hover:border-indigo-500/40 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <UploadIcon /> Upload document
                  </button>
                )}
                <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <p className="text-[var(--text-3)] text-[11px] uppercase tracking-wide font-medium mb-1.5">Notes</p>
            {editingNotes ? (
              <textarea
                autoFocus
                value={item.notes}
                onChange={(e) => onChange({ ...item, notes: e.target.value })}
                onBlur={() => setEditingNotes(false)}
                placeholder="Add notes, reference numbers, follow-ups..."
                rows={2}
                className="w-full text-xs text-[var(--text-1)] bg-[var(--bg-card)] border border-indigo-500/40 rounded-lg px-3 py-2 outline-none resize-none placeholder:text-[var(--text-3)]"
              />
            ) : (
              <p
                onClick={(e) => { e.stopPropagation(); setEditingNotes(true); }}
                className="text-xs text-[var(--text-2)] cursor-text px-3 py-2 rounded-lg border border-transparent hover:border-[var(--border)] hover:bg-[var(--bg-card)] transition-colors min-h-[32px]"
              >
                {item.notes || <span className="text-[var(--text-3)] italic">Click to add notes…</span>}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PaperclipIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}
