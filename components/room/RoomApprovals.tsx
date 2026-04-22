"use client";

import { useState } from "react";
import { APPROVAL_STYLES, APPROVAL_LABELS } from "@/lib/room";
import type { EventRoom } from "@/lib/room";

type Props = {
  room:      EventRoom;
  readOnly?: boolean;
  onApprove?:(data: { name: string; email: string; note?: string; approved: boolean }) => Promise<void>;
};

export default function RoomApprovals({ room, readOnly, onApprove }: Props) {
  const [showForm,  setShowForm]  = useState(false);
  const [approving, setApproving] = useState<boolean | null>(null); // true=approve, false=revision
  const [name,      setName]      = useState("");
  const [email,     setEmail]     = useState("");
  const [note,      setNote]      = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  const isApproved  = room.approvalStatus === "APPROVED";
  const isRejected  = room.approvalStatus === "REVISION_REQUESTED";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!onApprove || approving === null) return;
    setLoading(true); setError("");
    try {
      await onApprove({ name, email, note: note || undefined, approved: approving });
      setShowForm(false);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Current status banner */}
      <div className={`rounded-xl border p-5 ${APPROVAL_STYLES[room.approvalStatus]}`}>
        <div className="flex items-start gap-4">
          <span className="text-2xl shrink-0">
            {isApproved ? "✓" : isRejected ? "↺" : "⏳"}
          </span>
          <div className="flex-1">
            <p className="font-bold text-base">{APPROVAL_LABELS[room.approvalStatus]}</p>
            {room.approvedByName && (
              <p className="text-sm mt-0.5 opacity-80">
                by {room.approvedByName}
                {room.approvedAt && ` · ${new Date(room.approvedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
              </p>
            )}
            {room.approvalNote && (
              <div className="mt-3 p-3 rounded-lg bg-black/10 border border-current/20">
                <p className="text-sm italic">"{room.approvalNote}"</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approval checklist */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--bg-surface)]">
          <p className="text-[var(--text-1)] text-sm font-semibold">What you're approving</p>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {[
            { label: "Event Proposal & Concept",    active: room.showProposal },
            { label: "Budget Breakdown",            active: room.showBudget   },
            { label: "Event Timeline",              active: room.showTimeline },
            { label: "Vendor List",                 active: room.showVendors  },
            { label: "Payment Schedule",            active: room.showPayments },
          ].filter((s) => s.active).map((s) => (
            <div key={s.label} className="flex items-center gap-3 px-5 py-3">
              <span className="text-emerald-400 text-sm">✓</span>
              <p className="text-[var(--text-1)] text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons — client only */}
      {readOnly && !isApproved && !showForm && (
        <div className="flex gap-3">
          <button
            onClick={() => { setApproving(true); setShowForm(true); }}
            className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            ✓ Approve Proposal
          </button>
          <button
            onClick={() => { setApproving(false); setShowForm(true); }}
            className="flex-1 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-2)] hover:text-[var(--text-1)] font-semibold text-sm transition-colors"
          >
            ↺ Request Revision
          </button>
        </div>
      )}

      {readOnly && isApproved && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5 text-center">
          <p className="text-emerald-400 font-bold text-lg">Proposal Approved</p>
          <p className="text-[var(--text-2)] text-sm mt-1">
            Thank you! Your account manager will be in touch shortly to confirm next steps.
          </p>
        </div>
      )}

      {/* Approval form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
            <div className={`px-6 py-4 border-b border-[var(--border)] ${approving ? "bg-emerald-500/10" : "bg-amber-500/10"}`}>
              <h3 className={`font-bold text-lg ${approving ? "text-emerald-400" : "text-amber-400"}`}>
                {approving ? "Approve Proposal" : "Request Revision"}
              </h3>
              <p className="text-[var(--text-2)] text-sm mt-0.5">
                {approving
                  ? "Confirm your approval to move forward with the event."
                  : "Describe what changes you'd like to see."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
              )}
              <div>
                <label className="block text-[var(--text-3)] text-xs font-medium mb-1.5">Your Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Full name"
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-1)] text-sm placeholder:text-[var(--text-3)] outline-none focus:border-indigo-500/60 transition-colors" />
              </div>
              <div>
                <label className="block text-[var(--text-3)] text-xs font-medium mb-1.5">Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your@email.com"
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-1)] text-sm placeholder:text-[var(--text-3)] outline-none focus:border-indigo-500/60 transition-colors" />
              </div>
              <div>
                <label className="block text-[var(--text-3)] text-xs font-medium mb-1.5">
                  {approving ? "Note (optional)" : "What needs to change?"}
                </label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)}
                  required={!approving} rows={3} placeholder={approving ? "Any comments for the team..." : "Please be specific about the changes required..."}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-1)] text-sm placeholder:text-[var(--text-3)] outline-none focus:border-indigo-500/60 transition-colors resize-none" />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-lg border border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text-1)] text-sm font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className={`flex-1 py-2.5 rounded-lg text-white font-semibold text-sm transition-colors disabled:opacity-50 ${
                    approving ? "bg-emerald-500 hover:bg-emerald-600" : "bg-amber-500 hover:bg-amber-600"
                  }`}>
                  {loading ? "Submitting…" : approving ? "Confirm Approval" : "Submit Revision"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
