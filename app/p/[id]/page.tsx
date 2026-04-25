"use client";

import { use, useEffect, useState } from "react";
import { ClientView } from "@/components/proposals/ProposalOutput";
import type { ProposalData } from "@/lib/proposals";

type Action = "APPROVED" | "CHANGES_REQUESTED";

export default function PublicProposalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [error, setError] = useState<string>("");

  // Response form state
  const [action, setAction]         = useState<Action | null>(null);
  const [clientName, setClientName] = useState("");
  const [comment, setComment]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr]   = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/proposals/share/${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(r.status === 404 ? "Proposal not found." : "Unable to load proposal.");
        return r.json();
      })
      .then((d) => { if (!cancelled) setProposal(d as ProposalData); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [id]);

  async function submitResponse() {
    if (!action || !clientName.trim()) return;
    setSubmitting(true);
    setSubmitErr("");
    try {
      const r = await fetch(`/api/proposals/share/${id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, clientName: clientName.trim(), comment: comment.trim() }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error ?? "Could not submit response.");
      // Re-fetch so the page swaps to the locked confirmation view.
      const fresh = await fetch(`/api/proposals/share/${id}`).then((res) => res.json());
      setProposal(fresh as ProposalData);
      setAction(null);
    } catch (e: any) {
      setSubmitErr(e.message ?? "Could not submit response.");
    } finally {
      setSubmitting(false);
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#07070c] text-white flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-white/50 text-sm">{error}</p>
          <p className="text-white/30 text-xs mt-2">The link may have expired or been revoked.</p>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-[#07070c] text-white flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-white/15 border-t-indigo-400 animate-spin" />
      </div>
    );
  }

  const responded = proposal.clientResponse;

  return (
    <>
      <ClientView proposal={proposal} />

      {/* Response footer — hidden on print so it never bleeds into PDFs */}
      <div className="cv-no-print bg-[#07070c] border-t border-white/8 px-6 py-12">
        <div className="max-w-[640px] mx-auto">
          {responded ? (
            <ResponseRecorded response={responded} />
          ) : action === null ? (
            <div className="text-center space-y-5">
              <div>
                <p className="text-white/30 text-xs uppercase tracking-[0.18em] mb-2">Your decision</p>
                <h3 className="text-2xl font-bold text-white">Ready to move forward?</h3>
                <p className="text-white/50 text-sm mt-2">
                  Approve to lock the brief, or send back the changes you'd like to see.
                </p>
              </div>
              <div className="flex gap-3 justify-center flex-wrap">
                <button
                  onClick={() => setAction("APPROVED")}
                  className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-emerald-950 text-sm font-bold transition-colors"
                >
                  ✓ Approve proposal
                </button>
                <button
                  onClick={() => setAction("CHANGES_REQUESTED")}
                  className="px-5 py-2.5 rounded-lg border border-white/15 hover:border-white/30 text-white text-sm font-semibold transition-colors"
                >
                  Request changes
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 rounded-2xl border border-white/8 bg-white/[0.02] p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-white/30 text-xs uppercase tracking-[0.18em]">
                    {action === "APPROVED" ? "Approving proposal" : "Requesting changes"}
                  </p>
                  <p className="text-white text-sm mt-1">
                    {action === "APPROVED"
                      ? "Confirm your name to lock this proposal."
                      : "Tell the planner what you'd like adjusted."}
                  </p>
                </div>
                <button
                  onClick={() => { setAction(null); setSubmitErr(""); }}
                  className="text-white/40 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>

              <label className="block">
                <span className="text-white/50 text-xs">Your name</span>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  maxLength={120}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-indigo-400/50 outline-none text-white text-sm placeholder:text-white/25"
                />
              </label>

              <label className="block">
                <span className="text-white/50 text-xs">
                  {action === "APPROVED" ? "Note (optional)" : "What should we change?"}
                </span>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  placeholder={action === "APPROVED" ? "Looking forward to it…" : "Smaller stage, fewer vendors, push the date by a week…"}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-indigo-400/50 outline-none text-white text-sm placeholder:text-white/25 resize-y"
                />
                <span className="text-white/25 text-[10px]">{comment.length} / 2000</span>
              </label>

              {submitErr && (
                <p className="text-red-400 text-xs">{submitErr}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => { setAction(null); setSubmitErr(""); }}
                  className="px-4 py-2 rounded-lg text-white/60 hover:text-white text-sm transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={submitResponse}
                  disabled={submitting || !clientName.trim() || (action === "CHANGES_REQUESTED" && !comment.trim())}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    action === "APPROVED"
                      ? "bg-emerald-500 hover:bg-emerald-400 text-emerald-950"
                      : "bg-amber-500 hover:bg-amber-400 text-amber-950"
                  }`}
                >
                  {submitting ? "Sending…" : action === "APPROVED" ? "Confirm approval" : "Send request"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ResponseRecorded({ response }: { response: NonNullable<ProposalData["clientResponse"]> }) {
  const approved = response.action === "APPROVED";
  const when = new Date(response.respondedAt).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit",
  });
  return (
    <div className={`rounded-2xl border p-6 ${approved ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5"}`}>
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${
          approved ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
        }`}>
          {approved ? "✓" : "✎"}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs uppercase tracking-[0.15em] font-semibold ${approved ? "text-emerald-400" : "text-amber-400"}`}>
            {approved ? "Proposal approved" : "Changes requested"}
          </p>
          <p className="text-white text-sm mt-1">
            <strong>{response.clientName}</strong> · {when}
          </p>
          {response.comment && (
            <p className="text-white/70 text-sm mt-3 italic">"{response.comment}"</p>
          )}
          <p className="text-white/40 text-xs mt-4">
            The planner has been notified of your decision.
          </p>
        </div>
      </div>
    </div>
  );
}
