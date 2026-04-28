"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { ProposalData } from "@/lib/proposals";
import { formatINR } from "@/lib/proposals";
import { useCredits } from "@/components/credits/useCredits";

type BatchProposal = ProposalData & { id: string };

export default function BatchPage({ params }: { params: Promise<{ batchId: string }> }) {
  const router = useRouter();
  const credits = useCredits();

  const [batchId,    setBatchId]    = useState<string>("");
  const [proposals,  setProposals]  = useState<BatchProposal[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [regenId,    setRegenId]    = useState<string | null>(null);
  const [regenError, setRegenError] = useState("");
  const [dupLoading, setDupLoading] = useState<string | null>(null);
  const [lockLoading, setLockLoading] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ batchId: bid }) => {
      setBatchId(bid);
      api.proposals.getBatch(bid)
        .then((res: any) => {
          setProposals(res.proposals ?? []);
        })
        .catch((err: any) => setError(err.message ?? "Failed to load batch."))
        .finally(() => setLoading(false));
    });
  }, [params]);

  async function handleRegenerate(id: string) {
    if (regenId) return;
    setRegenError("");
    setRegenId(id);
    try {
      const res = await api.proposals.regenerate(id, {}) as any;
      const next = (res.data ?? res) as BatchProposal;
      if (typeof res.credits_remaining === "number") credits.setRemaining(res.credits_remaining);
      setProposals((prev) => prev.map((p) => p.id === id ? { ...next, id } : p));
    } catch (err: any) {
      if (err.message?.includes("LIMIT_REACHED")) { credits.openBuyModal(); credits.refresh(); return; }
      setRegenError(err.message ?? "Regeneration failed.");
    } finally {
      setRegenId(null);
    }
  }

  async function handleDuplicate(id: string) {
    if (dupLoading) return;
    setDupLoading(id);
    try {
      const res = await api.proposals.duplicate(id) as { id: string };
      router.push(`/proposals/${res.id}`);
    } catch (err: any) {
      alert(err.message ?? "Could not duplicate proposal.");
    } finally {
      setDupLoading(null);
    }
  }

  async function handleToggleLock(proposal: BatchProposal) {
    if (lockLoading) return;
    setLockLoading(proposal.id);
    const next = !proposal.isLocked;
    try {
      await api.proposals.update(proposal.id, { isLocked: next });
      setProposals((prev) => prev.map((p) => p.id === proposal.id ? { ...p, isLocked: next } : p));
    } catch (err: any) {
      alert(err.message ?? "Could not update lock.");
    } finally {
      setLockLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center animate-fade-in" style={{ minHeight: "55vh", gap: 16 }}>
        <div className="animate-pulse" style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(99,102,241,0.2)" }} />
        <p className="t-body">Loading proposals…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: "55vh", gap: 16 }}>
        <p style={{ color: "#f87171" }}>{error}</p>
        <button onClick={() => router.push("/proposals")} className="btn-ghost">Back to proposals</button>
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: "55vh", gap: 16 }}>
        <p className="t-body">No proposals found in this batch.</p>
        <button onClick={() => router.push("/proposals/new")} className="btn-primary">New proposal</button>
      </div>
    );
  }

  const first = proposals[0];

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", paddingBottom: 64 }}>

      {/* Header */}
      <div style={{ marginBottom: 36, paddingBottom: 24, borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="eyebrow" style={{ marginBottom: 8, color: "var(--text-3)" }}>
              Batch · {proposals.length} proposals
            </p>
            <h2 className="t-heading">
              {first.eventType} — {first.location}
            </h2>
            <p className="t-body" style={{ marginTop: 6 }}>
              {formatINR(first.budget)} budget · Each proposal is independent — edit, regenerate, or share separately.
            </p>
          </div>
          <button onClick={() => router.push("/proposals")} className="btn-ghost shrink-0">
            ← All proposals
          </button>
        </div>

        {regenError && (
          <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 8, background: "var(--red-dim)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5", fontSize: 13 }}>
            {regenError}
          </div>
        )}
      </div>

      {/* Isolation notice */}
      <div
        style={{
          marginBottom: 28,
          padding: "12px 16px",
          borderRadius: 10,
          border: "1px solid rgba(99,102,241,0.2)",
          background: "rgba(99,102,241,0.05)",
          color: "var(--text-2)",
          fontSize: 13,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span style={{ fontSize: 16, color: "#a5b4fc" }}>⚡</span>
        <span>
          <strong style={{ color: "var(--text-1)" }}>Fully isolated.</strong>{" "}
          Editing one proposal never affects the others. Each has its own version history.
        </span>
      </div>

      {/* Proposal grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
        {proposals.map((proposal, index) => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            index={index}
            regenLoading={regenId === proposal.id}
            dupLoading={dupLoading === proposal.id}
            lockLoading={lockLoading === proposal.id}
            onEdit={() => router.push(`/proposals/${proposal.id}`)}
            onRegenerate={() => handleRegenerate(proposal.id)}
            onDuplicate={() => handleDuplicate(proposal.id)}
            onToggleLock={() => handleToggleLock(proposal)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Proposal Card ─────────────────────────────────────────────────────────────

function ProposalCard({
  proposal, index, regenLoading, dupLoading, lockLoading,
  onEdit, onRegenerate, onDuplicate, onToggleLock,
}: {
  proposal:    BatchProposal;
  index:       number;
  regenLoading: boolean;
  dupLoading:  boolean;
  lockLoading: boolean;
  onEdit:      () => void;
  onRegenerate:() => void;
  onDuplicate: () => void;
  onToggleLock:() => void;
}) {
  const tagline = proposal.eventConcept?.tagline
    ?? proposal.concept?.tagline
    ?? proposal.selectedIdea?.headline
    ?? "";

  const regensUsed = proposal.regenerationsUsed ?? 0;
  const regensLeft = Math.max(0, 5 - regensUsed);
  const isLocked   = !!proposal.isLocked;

  return (
    <div
      style={{
        borderRadius: 14,
        border: isLocked ? "1px solid rgba(245,158,11,0.35)" : "1px solid var(--border)",
        background: "var(--bg-card)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: "border-color 0.15s, box-shadow 0.15s",
        boxShadow: isLocked ? "0 0 0 1px rgba(245,158,11,0.1)" : "none",
      }}
    >
      {/* Index + lock badge */}
      <div
        style={{
          padding: "12px 16px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--text-3)",
          }}
        >
          Proposal {index + 1}
        </span>
        {isLocked && (
          <span style={{ fontSize: 11, color: "#fbbf24", fontWeight: 600 }}>🔒 Locked</span>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "12px 16px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-1)", lineHeight: 1.2 }}>
          {proposal.title}
        </h3>

        {tagline && (
          <p style={{ fontSize: 13, color: "#a5b4fc", fontStyle: "italic", lineHeight: 1.5 }}>
            "{tagline}"
          </p>
        )}

        {proposal.eventConcept?.storyline || proposal.concept?.description ? (
          <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {proposal.eventConcept?.storyline ?? proposal.concept?.description}
          </p>
        ) : null}

        {/* Score + budget row */}
        <div className="flex items-center flex-wrap" style={{ gap: "6px 14px", marginTop: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#a5b4fc" }}>{formatINR(proposal.budget)}</span>
          {proposal.selectedIdea?.score?.overall != null && (
            <span style={{ fontSize: 12, color: "var(--text-3)" }}>
              Score: {proposal.selectedIdea.score.overall}/10
              {proposal.selectedIdea.score.isRecommended && (
                <span style={{ marginLeft: 6, color: "#fbbf24" }}>★ Recommended</span>
              )}
            </span>
          )}
        </div>

        {/* Version info */}
        <p style={{ fontSize: 11, color: "var(--text-3)" }}>
          {proposal.activeVersionLabel ?? "v1"} · {regensLeft} of 5 regenerations left
        </p>

        {/* Isolation notice */}
        <p style={{ fontSize: 11.5, color: "var(--text-3)", fontStyle: "italic" }}>
          Edits apply only to this proposal
        </p>
      </div>

      {/* Action buttons */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <button
          onClick={onEdit}
          className="btn-primary"
          style={{ flex: 1, minWidth: 80, fontSize: 13, padding: "8px 12px" }}
          disabled={isLocked}
          title={isLocked ? "Unlock to edit" : "Open full editor"}
        >
          ✏️ Edit
        </button>

        <button
          onClick={onRegenerate}
          disabled={regenLoading || regensLeft <= 0 || isLocked}
          title={
            isLocked ? "Unlock to regenerate"
            : regensLeft <= 0 ? "Regeneration limit reached"
            : `Regenerate this proposal (${regensLeft} left)`
          }
          style={{
            flex: 1,
            minWidth: 80,
            fontSize: 13,
            padding: "8px 12px",
            borderRadius: 9,
            border: "1px solid rgba(99,102,241,0.3)",
            background: regenLoading ? "rgba(99,102,241,0.18)" : "rgba(99,102,241,0.06)",
            color: (regenLoading || regensLeft <= 0 || isLocked) ? "var(--text-3)" : "#a5b4fc",
            fontWeight: 600,
            cursor: (regenLoading || regensLeft <= 0 || isLocked) ? "not-allowed" : "pointer",
            opacity: (regensLeft <= 0 || isLocked) ? 0.5 : 1,
          }}
        >
          {regenLoading ? "…" : "🔁 Regen"}
        </button>

        <button
          onClick={onDuplicate}
          disabled={!!dupLoading}
          title="Duplicate as independent proposal"
          style={{
            flex: 1,
            minWidth: 80,
            fontSize: 13,
            padding: "8px 12px",
            borderRadius: 9,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text-2)",
            fontWeight: 600,
            cursor: dupLoading ? "not-allowed" : "pointer",
            opacity: dupLoading ? 0.5 : 1,
          }}
        >
          {dupLoading ? "…" : "📄 Copy"}
        </button>

        <button
          onClick={onToggleLock}
          disabled={!!lockLoading}
          title={isLocked ? "Unlock this proposal" : "Lock this version"}
          style={{
            fontSize: 13,
            padding: "8px 12px",
            borderRadius: 9,
            border: isLocked ? "1px solid rgba(245,158,11,0.35)" : "1px solid var(--border)",
            background: isLocked ? "rgba(245,158,11,0.08)" : "transparent",
            color: isLocked ? "#fbbf24" : "var(--text-3)",
            fontWeight: 600,
            cursor: lockLoading ? "not-allowed" : "pointer",
          }}
        >
          {lockLoading ? "…" : isLocked ? "🔓" : "🔒"}
        </button>
      </div>
    </div>
  );
}
