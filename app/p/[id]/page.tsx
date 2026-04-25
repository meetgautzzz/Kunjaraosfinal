"use client";

import { use, useEffect, useState } from "react";
import { ClientView } from "@/components/proposals/ProposalOutput";
import type { ProposalData } from "@/lib/proposals";

export default function PublicProposalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [error, setError] = useState<string>("");

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

  return <ClientView proposal={proposal} />;
}
