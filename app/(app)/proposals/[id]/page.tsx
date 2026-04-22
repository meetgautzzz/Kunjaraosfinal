"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ProposalOutput from "@/components/proposals/ProposalOutput";
import { api } from "@/lib/api";
import type { ProposalData } from "@/lib/proposals";

export default function ProposalDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();

  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  useEffect(() => {
    if (!id) return;
    api.proposals.get(id)
      .then((data) => {
        const p = data as ProposalData;
        setProposal({ ...p, budget: Number(p.budget) });
      })
      .catch((err) => setError(err.message ?? "Failed to load proposal"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-5 animate-pulse">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="h-7 w-64 rounded-lg bg-white/5" />
            <div className="h-3 w-48 rounded bg-white/5" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-16 rounded-lg bg-white/5" />
            <div className="h-9 w-28 rounded-lg bg-white/5" />
            <div className="h-9 w-28 rounded-lg bg-white/5" />
          </div>
        </div>
        <div className="h-12 rounded-xl bg-white/5" />
        <div className="h-96 rounded-xl bg-white/5" />
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center py-24 rounded-xl border border-dashed border-[var(--border)]">
          <p className="text-[var(--text-1)] font-semibold">
            {error || "Proposal not found"}
          </p>
          <button
            onClick={() => router.push("/proposals")}
            className="mt-4 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors"
          >
            ← Back to proposals
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProposalOutput
      proposal={proposal}
      onChange={setProposal}
      onBack={() => router.push("/proposals")}
      onSave={() => router.push("/proposals")}
    />
  );
}
