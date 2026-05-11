"use client";

import { use, useEffect, useState, useRef } from "react";
import type { ProposalData } from "@/lib/proposals";
import { formatINR } from "@/lib/proposals";

const GOLD = "#D4A85F";

type SectionKey = "concept" | "budget" | "timeline" | "vendors" | "visual" | "experience";
type ApprovalStatus = "pending" | "approved" | "changes_requested" | "rejected";

type SectionApproval = {
  status: ApprovalStatus;
  note?: string;
  by?: string;
  at?: string;
};

type Comment = {
  id: string;
  author_name: string;
  author_type: "planner" | "client";
  message: string;
  section_ref: string | null;
  parent_id: string | null;
  created_at: string;
};

const STATUS_STYLE: Record<ApprovalStatus, { color: string; bg: string; label: string; icon: string }> = {
  pending:           { color: "#9ca3af", bg: "rgba(156,163,175,0.10)", label: "Pending",          icon: "○" },
  approved:          { color: "#34d399", bg: "rgba(52,211,153,0.10)",  label: "Approved",         icon: "✓" },
  changes_requested: { color: "#fbbf24", bg: "rgba(251,191,36,0.10)",  label: "Changes Requested", icon: "✎" },
  rejected:          { color: "#f87171", bg: "rgba(248,113,113,0.10)", label: "Rejected",          icon: "✕" },
};

const SECTIONS: { key: SectionKey; label: string; icon: string }[] = [
  { key: "concept",    label: "Concept",   icon: "✦" },
  { key: "budget",     label: "Budget",    icon: "₹" },
  { key: "timeline",   label: "Timeline",  icon: "⏱" },
  { key: "experience", label: "Experience",icon: "✨" },
  { key: "visual",     label: "Visual",    icon: "🎨" },
  { key: "vendors",    label: "Vendors",   icon: "🏪" },
];

export default function ClientReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [proposal, setProposal]         = useState<ProposalData | null>(null);
  const [branding, setBranding]         = useState<Record<string, string>>({});
  const [roomStatus, setRoomStatus]     = useState<string>("discussion");
  const [approvals, setApprovals]       = useState<Record<string, SectionApproval>>({});
  const [comments, setComments]         = useState<Comment[]>([]);
  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(true);

  const [clientName, setClientName]     = useState("");
  const [nameSet, setNameSet]           = useState(false);
  const [activeSection, setActiveSection] = useState<SectionKey>("concept");
  const [commentText, setCommentText]   = useState("");
  const [commenting, setCommenting]     = useState(false);
  const [approving, setApproving]       = useState<string | null>(null);
  const [overallAction, setOverallAction] = useState<string | null>(null);
  const [overallNote, setOverallNote]   = useState("");
  const [submittingOverall, setSubmittingOverall] = useState(false);
  const [submitted, setSubmitted]       = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/review/${token}`)
      .then((r) => r.ok ? r.json() : Promise.reject(r.status === 404 ? "Link not found." : "Could not load."))
      .then((d) => {
        setProposal(d.proposal as ProposalData);
        setBranding(d.branding ?? {});
        setRoomStatus(d.room?.status ?? "discussion");
        setApprovals(d.room?.sectionApprovals ?? {});
        setLoading(false);
      })
      .catch((e) => { setError(typeof e === "string" ? e : "Could not load."); setLoading(false); });

    fetch(`/api/review/${token}/comment`)
      .then((r) => r.ok ? r.json() : { comments: [] })
      .then((d) => setComments(d.comments ?? []));
  }, [token]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  async function sendComment(sectionRef?: SectionKey) {
    if (!commentText.trim() || !clientName.trim() || commenting) return;
    setCommenting(true);
    try {
      const r = await fetch(`/api/review/${token}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorName: clientName, authorRole: "client", message: commentText.trim(), sectionRef }),
      });
      const d = await r.json();
      if (r.ok) {
        setComments((prev) => [...prev, d.comment]);
        setCommentText("");
      }
    } finally {
      setCommenting(false);
    }
  }

  async function approveSection(section: SectionKey, status: ApprovalStatus) {
    if (!clientName.trim() || approving) return;
    setApproving(section);
    try {
      const r = await fetch(`/api/review/${token}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientName, section, status }),
      });
      const d = await r.json();
      if (r.ok) setApprovals(d.sectionApprovals ?? {});
    } finally {
      setApproving(null);
    }
  }

  async function submitOverall() {
    if (!clientName.trim() || !overallAction || submittingOverall) return;
    setSubmittingOverall(true);
    try {
      const r = await fetch(`/api/review/${token}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientName, proposalAction: overallAction, status: overallAction, note: overallNote }),
      });
      const d = await r.json();
      if (r.ok) {
        setRoomStatus(d.status ?? overallAction);
        setSubmitted(true);
      }
    } finally {
      setSubmittingOverall(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#07070c", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: `2px solid ${GOLD}30`, borderTopColor: GOLD, animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div style={{ minHeight: "100vh", background: "#07070c", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>{error || "Proposal not found."}</p>
          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, marginTop: 8 }}>The link may have expired or been revoked.</p>
        </div>
      </div>
    );
  }

  if (!nameSet) {
    return (
      <div style={{ minHeight: "100vh", background: "#07070c", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 420, borderRadius: 20, border: `1px solid ${GOLD}30`, background: "#0e0e18", padding: "40px 32px" }}>
          {branding.logo_url && (
            <img src={branding.logo_url} alt="logo" style={{ height: 40, marginBottom: 28, objectFit: "contain" }} />
          )}
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: GOLD, textTransform: "uppercase", marginBottom: 8 }}>
            Proposal Review
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 6, lineHeight: 1.2 }}>
            {proposal.concept?.title ?? proposal.title}
          </h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 32 }}>
            {branding.company_name ? `from ${branding.company_name}` : "Please enter your name to continue"}
          </p>
          <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
            Your Name
          </label>
          <input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && clientName.trim()) setNameSet(true); }}
            placeholder="e.g. Priya Mehta"
            style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid rgba(255,255,255,0.12)`, borderRadius: 10, padding: "12px 14px", fontSize: 15, color: "#fff", outline: "none", marginBottom: 16, boxSizing: "border-box" }}
            autoFocus
          />
          <button
            onClick={() => { if (clientName.trim()) setNameSet(true); }}
            disabled={!clientName.trim()}
            style={{ width: "100%", padding: "13px 0", borderRadius: 10, background: GOLD, border: "none", color: "#07070c", fontWeight: 800, fontSize: 15, cursor: clientName.trim() ? "pointer" : "not-allowed", opacity: clientName.trim() ? 1 : 0.5 }}
          >
            View Proposal →
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    const isFinal = overallAction === "approved" || overallAction === "rejected";
    return (
      <div style={{ minHeight: "100vh", background: "#07070c", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>{overallAction === "approved" ? "✓" : overallAction === "rejected" ? "✕" : "✎"}</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 8 }}>
            {overallAction === "approved" ? "Proposal Approved!" : overallAction === "rejected" ? "Proposal Rejected" : "Changes Requested"}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
            {isFinal ? "Your response has been recorded. The planner will follow up shortly." : "The planner has been notified of your requested changes."}
          </p>
          {!isFinal && (
            <button onClick={() => { setSubmitted(false); setOverallAction(null); }} style={{ marginTop: 24, padding: "10px 20px", borderRadius: 10, border: `1px solid ${GOLD}40`, background: "transparent", color: GOLD, cursor: "pointer", fontSize: 14 }}>
              ← Back to Proposal
            </button>
          )}
        </div>
      </div>
    );
  }

  const sectionComments = comments.filter((c) => c.section_ref === activeSection);
  const currentApproval = approvals[activeSection] as SectionApproval | undefined;
  const approvedCount = Object.values(approvals).filter((a) => (a as SectionApproval).status === "approved").length;
  const totalSections = SECTIONS.filter((s) => {
    if (s.key === "budget")     return !!(proposal.budgetBreakdown?.length);
    if (s.key === "timeline")   return !!(proposal.timeline?.length);
    if (s.key === "experience") return !!(proposal.eventConcept || proposal.selectedIdea);
    if (s.key === "visual")     return !!(proposal.visualDirection || proposal.stageDesign);
    if (s.key === "vendors")    return !!(proposal.vendors?.length);
    return true;
  }).length;

  return (
    <div style={{ minHeight: "100vh", background: "#07070c", color: "#fff" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {branding.logo_url && <img src={branding.logo_url} alt="logo" style={{ height: 28, objectFit: "contain" }} />}
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{proposal.concept?.title ?? proposal.title}</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
              {proposal.eventType} · {proposal.location} · {formatINR(proposal.budget)}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Reviewing as</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: GOLD, padding: "4px 10px", borderRadius: 20, background: `${GOLD}15`, border: `1px solid ${GOLD}30` }}>{clientName}</span>
          {approvedCount > 0 && (
            <span style={{ fontSize: 11, color: "#34d399", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)", padding: "4px 10px", borderRadius: 20 }}>
              {approvedCount}/{totalSections} approved
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", minHeight: "calc(100vh - 61px)" }}>
        {/* LEFT: Proposal sections */}
        <div style={{ overflowY: "auto", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          {/* Section tabs */}
          <div style={{ display: "flex", gap: 4, padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", overflowX: "auto" }}>
            {SECTIONS.filter((s) => {
              if (s.key === "budget")     return !!(proposal.budgetBreakdown?.length);
              if (s.key === "timeline")   return !!(proposal.timeline?.length);
              if (s.key === "experience") return !!(proposal.eventConcept || proposal.selectedIdea);
              if (s.key === "visual")     return !!(proposal.visualDirection || proposal.stageDesign);
              if (s.key === "vendors")    return !!(proposal.vendors?.length);
              return true;
            }).map((s) => {
              const ap = approvals[s.key] as SectionApproval | undefined;
              const st = ap?.status ?? "pending";
              const style = STATUS_STYLE[st];
              const isActive = activeSection === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setActiveSection(s.key)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                    border: isActive ? `1px solid ${GOLD}50` : "1px solid rgba(255,255,255,0.08)",
                    background: isActive ? `${GOLD}15` : "transparent",
                    color: isActive ? GOLD : "rgba(255,255,255,0.5)",
                    cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
                  }}
                >
                  {s.icon} {s.label}
                  {st !== "pending" && (
                    <span style={{ fontSize: 10, color: style.color, marginLeft: 2 }}>{style.icon}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Section content */}
          <div style={{ padding: "28px 28px" }}>
            <SectionContent proposal={proposal} section={activeSection} />
          </div>
        </div>

        {/* RIGHT: Review panel */}
        <div style={{ display: "flex", flexDirection: "column", background: "#0a0a14", overflowY: "auto" }}>
          {/* Section approval */}
          <div style={{ padding: "20px 20px 0" }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 14 }}>
              {SECTIONS.find((s) => s.key === activeSection)?.label ?? activeSection} Review
            </p>

            {currentApproval && currentApproval.status !== "pending" ? (
              <div style={{ borderRadius: 10, border: `1px solid ${STATUS_STYLE[currentApproval.status].color}30`, background: STATUS_STYLE[currentApproval.status].bg, padding: "14px 16px", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16, color: STATUS_STYLE[currentApproval.status].color }}>{STATUS_STYLE[currentApproval.status].icon}</span>
                  <p style={{ fontSize: 13, fontWeight: 700, color: STATUS_STYLE[currentApproval.status].color }}>{STATUS_STYLE[currentApproval.status].label}</p>
                </div>
                {currentApproval.note && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 6, fontStyle: "italic" }}>"{currentApproval.note}"</p>}
                <button
                  onClick={() => approveSection(activeSection, "pending")}
                  style={{ marginTop: 10, fontSize: 11, color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  undo
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                {(["approved", "changes_requested", "rejected"] as ApprovalStatus[]).map((st) => {
                  const s = STATUS_STYLE[st];
                  return (
                    <button
                      key={st}
                      onClick={() => approveSection(activeSection, st)}
                      disabled={!!approving}
                      style={{
                        flex: 1, padding: "8px 4px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                        border: `1px solid ${s.color}40`, background: s.bg, color: s.color,
                        cursor: approving ? "not-allowed" : "pointer", transition: "all 0.15s",
                      }}
                    >
                      {approving === activeSection ? "…" : s.icon + " " + (st === "changes_requested" ? "Changes" : st === "approved" ? "Approve" : "Reject")}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Comments for this section */}
          <div style={{ flex: 1, padding: "0 20px", display: "flex", flexDirection: "column", gap: 0, overflowY: "auto" }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 12, marginTop: 4 }}>
              Comments {sectionComments.length > 0 && `(${sectionComments.length})`}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 80 }}>
              {sectionComments.length === 0 && (
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", textAlign: "center", padding: "20px 0" }}>No comments on this section yet.</p>
              )}
              {sectionComments.map((c) => (
                <div key={c.id} style={{ borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", background: c.author_type === "planner" ? "rgba(99,102,241,0.06)" : "rgba(255,255,255,0.03)", padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 22, height: 22, borderRadius: "50%", background: c.author_type === "planner" ? "rgba(99,102,241,0.3)" : `${GOLD}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: c.author_type === "planner" ? "#a5b4fc" : GOLD, flexShrink: 0 }}>
                      {c.author_name.charAt(0).toUpperCase()}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: c.author_type === "planner" ? "#a5b4fc" : GOLD }}>{c.author_name}</span>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginLeft: "auto" }}>
                      {new Date(c.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.7)", lineHeight: 1.55 }}>{c.message}</p>
                </div>
              ))}
              <div ref={commentsEndRef} />
            </div>

            {/* Comment input */}
            <div style={{ padding: "12px 0 20px", borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 12 }}>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment on this section…"
                rows={3}
                style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#fff", resize: "none", outline: "none", boxSizing: "border-box" }}
              />
              <button
                onClick={() => sendComment(activeSection)}
                disabled={!commentText.trim() || commenting}
                style={{ marginTop: 8, width: "100%", padding: "9px 0", borderRadius: 9, background: commentText.trim() ? `${GOLD}20` : "transparent", border: `1px solid ${GOLD}${commentText.trim() ? "50" : "20"}`, color: commentText.trim() ? GOLD : "rgba(255,255,255,0.2)", fontWeight: 700, fontSize: 13, cursor: commentText.trim() ? "pointer" : "not-allowed" }}
              >
                {commenting ? "Sending…" : "Send Comment"}
              </button>
            </div>
          </div>

          {/* Overall decision */}
          <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.3)" }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 12 }}>
              Overall Decision
            </p>
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {[
                { action: "approved",          label: "✓ Approve All", color: "#34d399", bg: "rgba(52,211,153,0.10)" },
                { action: "changes_requested", label: "✎ Changes",     color: "#fbbf24", bg: "rgba(251,191,36,0.10)" },
                { action: "rejected",          label: "✕ Reject",      color: "#f87171", bg: "rgba(248,113,113,0.10)" },
              ].map(({ action, label, color, bg }) => (
                <button
                  key={action}
                  onClick={() => setOverallAction(action === overallAction ? null : action)}
                  style={{
                    flex: 1, padding: "8px 4px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                    border: `1px solid ${color}${overallAction === action ? "80" : "30"}`,
                    background: overallAction === action ? bg : "transparent",
                    color: overallAction === action ? color : "rgba(255,255,255,0.35)",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {overallAction && (
              <>
                <textarea
                  value={overallNote}
                  onChange={(e) => setOverallNote(e.target.value)}
                  placeholder="Add a note (optional)…"
                  rows={2}
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "9px 12px", fontSize: 12, color: "#fff", resize: "none", outline: "none", boxSizing: "border-box", marginBottom: 8 }}
                />
                <button
                  onClick={submitOverall}
                  disabled={submittingOverall}
                  style={{ width: "100%", padding: "11px 0", borderRadius: 9, background: GOLD, border: "none", color: "#07070c", fontWeight: 800, fontSize: 13, cursor: submittingOverall ? "not-allowed" : "pointer", opacity: submittingOverall ? 0.7 : 1 }}
                >
                  {submittingOverall ? "Submitting…" : "Submit Response"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionContent({ proposal, section }: { proposal: ProposalData; section: SectionKey }) {
  const GOLD = "#D4A85F";
  const cardStyle: React.CSSProperties = { borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", padding: "16px 18px", marginBottom: 12 };
  const label: React.CSSProperties = { fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 6 };
  const val: React.CSSProperties = { fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 };

  if (section === "concept") {
    const c = proposal.concept;
    return (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 4 }}>{c?.title ?? proposal.title}</h2>
        {c?.tagline && <p style={{ fontSize: 13, color: GOLD, fontStyle: "italic", marginBottom: 20 }}>{c.tagline}</p>}
        {c?.description && <p style={{ ...val, marginBottom: 20 }}>{c.description}</p>}
        {(c?.highlights ?? []).map((h, i) => (
          <div key={i} style={{ ...cardStyle, display: "flex", gap: 12 }}>
            <span style={{ width: 20, height: 20, borderRadius: "50%", background: `${GOLD}20`, border: `1px solid ${GOLD}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: GOLD, flexShrink: 0, marginTop: 2 }}>{i + 1}</span>
            <p style={val}>{h}</p>
          </div>
        ))}
      </div>
    );
  }

  if (section === "budget") {
    const lines = proposal.budgetBreakdown ?? [];
    const total = lines.reduce((s, l) => s + (l.amount ?? 0), 0);
    return (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 20 }}>Budget Breakdown</h2>
        {lines.map((l, i) => (
          <div key={i} style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>{l.category}</p>
              {l.description && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{l.description}</p>}
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: GOLD, flexShrink: 0 }}>₹{(l.amount ?? 0).toLocaleString("en-IN")}</p>
          </div>
        ))}
        <div style={{ borderRadius: 12, border: `1px solid ${GOLD}30`, background: `${GOLD}10`, padding: "16px 18px", display: "flex", justifyContent: "space-between" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: GOLD }}>Total</p>
          <p style={{ fontSize: 16, fontWeight: 800, color: GOLD }}>₹{total.toLocaleString("en-IN")}</p>
        </div>
      </div>
    );
  }

  if (section === "timeline") {
    return (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 20 }}>Event Timeline</h2>
        {(proposal.timeline ?? []).map((phase, i) => (
          <div key={i} style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ padding: "3px 10px", borderRadius: 20, background: `${GOLD}20`, color: GOLD, fontSize: 11, fontWeight: 700 }}>{phase.phase}</span>
              {phase.daysOut && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{phase.daysOut}</span>}
            </div>
            <ul style={{ paddingLeft: 16, margin: 0 }}>
              {(phase.tasks ?? []).map((t, j) => (
                <li key={j} style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginBottom: 4, lineHeight: 1.5 }}>{t}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  if (section === "experience") {
    const ec = proposal.eventConcept;
    const idea = proposal.selectedIdea;
    return (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 20 }}>Experience Design</h2>
        {idea && (
          <div style={{ ...cardStyle, borderColor: `${GOLD}30` }}>
            <p style={{ ...label, color: GOLD }}>{idea.experienceType}</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{idea.title}</p>
            <p style={val}>{idea.concept}</p>
            {idea.wowFactor && <p style={{ fontSize: 12, color: GOLD, marginTop: 10, fontStyle: "italic" }}>★ {idea.wowFactor}</p>}
          </div>
        )}
        {ec && (
          <>
            <div style={cardStyle}>
              <p style={label}>Narrative</p>
              <p style={val}>{ec.storyline}</p>
            </div>
            {ec.emotionalJourney?.length > 0 && (
              <div style={cardStyle}>
                <p style={label}>Emotional Journey</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                  {ec.emotionalJourney.map((beat, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ width: 20, height: 20, borderRadius: "50%", background: `${GOLD}15`, border: `1px solid ${GOLD}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: GOLD, flexShrink: 0 }}>{i + 1}</span>
                      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.5, marginTop: 2 }}>{beat}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  if (section === "visual") {
    const vd = proposal.visualDirection;
    const sd = proposal.stageDesign;
    return (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 20 }}>Visual & Stage Design</h2>
        {vd && (
          <div style={cardStyle}>
            <p style={label}>Visual Direction</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{vd.overallAesthetic}</p>
            {vd.palette?.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                {vd.palette.map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: c.hex, display: "inline-block" }} />
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{c.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {sd && (
          <div style={cardStyle}>
            <p style={label}>Stage Design</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{sd.signature}</p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{sd.layout}</p>
          </div>
        )}
      </div>
    );
  }

  if (section === "vendors") {
    return (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 20 }}>Recommended Vendors</h2>
        {(proposal.vendors ?? []).map((v, i) => (
          <div key={i} style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{v.role}</p>
                <p style={{ fontSize: 11, color: GOLD, marginTop: 2 }}>{v.category}</p>
              </div>
              {v.estimatedCost && <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)", flexShrink: 0 }}>₹{v.estimatedCost.toLocaleString("en-IN")}</p>}
            </div>
            {v.notes && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>{v.notes}</p>}
          </div>
        ))}
      </div>
    );
  }

  return <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>No content for this section.</p>;
}
