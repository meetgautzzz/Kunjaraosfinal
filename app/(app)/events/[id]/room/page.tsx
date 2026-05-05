"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import type { EventRoom as BaseEventRoom, RoomStatus, RoomComment, SectionRef } from "@/lib/event-rooms";
import { ROOM_STATUS_LABEL, canTransition } from "@/lib/event-rooms";

import type { FpElement } from "@/components/toolkit/FloorPlanBuilder";
import { FloorPlanViewer } from "@/components/toolkit/FloorPlanBuilder";
import FloorPlanBuilder from "@/components/toolkit/FloorPlanBuilder";

type EventRoom = BaseEventRoom & {
  share_token?:     string;
  view_count?:      number;
  last_viewed_at?:  string | null;
  run_of_show?:     RunOfShowOutput | null;
  floor_plan?:      FpElement[] | null;
  client_response?: {
    action:       "approved" | "declined" | "revision_requested";
    message:      string | null;
    responded_at: string;
    client_name:  string;
  } | null;
};
import type { ProposalData } from "@/lib/proposals";
import ProposalClientView from "@/components/proposals/ProposalClientView";
import DiscussionPanel from "@/components/room/DiscussionPanel";
import type { RunOfShowOutput, RunOfShowInput } from "@/lib/ai-tools";
import { mockRunOfShow } from "@/lib/ai-tools";
import { RunOfShowForm, RunOfShowOutput as RunOfShowOutputView } from "@/components/ai/RunOfShowTool";

// ── Status styles ─────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<RoomStatus, { badge: string; dot: string }> = {
  draft:      { badge: "bg-slate-500/15 text-slate-400 border-slate-500/25",     dot: "bg-slate-400" },
  discussion: { badge: "bg-indigo-500/15 text-indigo-400 border-indigo-500/25",  dot: "bg-indigo-400" },
  revision:   { badge: "bg-amber-500/15 text-amber-400 border-amber-500/25",     dot: "bg-amber-400" },
  approved:   { badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25", dot: "bg-emerald-400" },
  won:        { badge: "bg-emerald-700/20 text-emerald-300 border-emerald-700/30", dot: "bg-emerald-300" },
  lost:       { badge: "bg-red-500/15 text-red-400 border-red-500/25",           dot: "bg-red-400" },
};

// ── Create Room form ──────────────────────────────────────────────────────────

function CreateRoomForm({
  proposalId, onCreated, error,
}: {
  proposalId: string;
  onCreated: (room: EventRoom) => void;
  error: string;
}) {
  const [clientName,  setClientName]  = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [creating,    setCreating]    = useState(false);
  const [err,         setErr]         = useState(error);

  async function create() {
    if (!clientName.trim()) return;
    setCreating(true); setErr("");
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposal_id:  proposalId,
          client_name:  clientName.trim(),
          client_email: clientEmail.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create room.");
      onCreated(data as EventRoom);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div style={{ maxWidth: 440, margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, margin: "0 auto 14px",
        }}>🏠</div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)", marginBottom: 6 }}>Open Event Room</h3>
        <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.55 }}>
          Enter client details to create a shared deal space — proposal review, discussion, and approval in one place.
        </p>
      </div>
      {err && (
        <p style={{ fontSize: 12, color: "#f87171", marginBottom: 12, textAlign: "center" }}>{err}</p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)", display: "block", marginBottom: 5 }}>
            Client Name *
          </label>
          <input
            className="input"
            placeholder="Eg. Ravi Mehta"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)", display: "block", marginBottom: 5 }}>
            Client Email <span style={{ fontWeight: 400, color: "var(--text-3)" }}>(optional)</span>
          </label>
          <input
            className="input"
            type="email"
            placeholder="client@company.com"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
          />
        </div>
        <button
          onClick={create}
          disabled={creating || !clientName.trim()}
          style={{
            marginTop: 4, padding: "10px", borderRadius: 9, fontSize: 13, fontWeight: 600,
            background: "var(--accent)", border: "none", color: "#fff",
            cursor: (creating || !clientName.trim()) ? "not-allowed" : "pointer",
            opacity: (creating || !clientName.trim()) ? 0.6 : 1,
            transition: "opacity 0.15s",
          }}
        >
          {creating ? "Creating room…" : "Open Event Room →"}
        </button>
      </div>
    </div>
  );
}

// ── Share button ─────────────────────────────────────────────────────────────

function ShareButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined"
    ? `${window.location.origin}/room/${token}`
    : `/room/${token}`;

  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <input
        readOnly
        value={url}
        style={{
          fontSize: 11, padding: "5px 10px", borderRadius: 7,
          border: "1px solid var(--border)", background: "var(--bg-surface)",
          color: "var(--text-3)", outline: "none", width: 220,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}
        onClick={(e) => (e.target as HTMLInputElement).select()}
      />
      <button
        onClick={copy}
        style={{
          padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: 600,
          background: copied ? "rgba(16,185,129,0.15)" : "var(--accent)",
          border: copied ? "1px solid rgba(16,185,129,0.3)" : "none",
          color: copied ? "#34d399" : "#fff",
          cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
        }}
      >
        {copied ? "✓ Copied!" : "Copy Link"}
      </button>
    </div>
  );
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function EventRoomPage() {
  const { id } = useParams<{ id: string }>();   // id = proposal_id

  const [room,            setRoom]            = useState<EventRoom | null>(null);
  const [proposal,        setProposal]        = useState<ProposalData | null>(null);
  const [comments,        setComments]        = useState<RoomComment[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState("");
  const [transitioning,   setTransitioning]   = useState(false);
  const [highlightSection,setHighlightSection]= useState<SectionRef | null>(null);
  const [activeView,      setActiveView]      = useState<"proposal" | "run-of-show" | "floor-plan">("proposal");
  const [fpSaving,        setFpSaving]        = useState(false);
  const [rosGenerating,   setRosGenerating]   = useState(false);
  const [rosSaving,       setRosSaving]       = useState(false);

  // Load room + proposal in parallel
  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch("/api/rooms").then((r) => r.ok ? r.json() : [] as any[]),
      fetch(`/api/proposals/${id}`).then((r) => r.ok ? r.json() : null),
    ]).then(([rooms, proposalData]) => {
      const found = (rooms as any[]).find((r: any) => r.proposal_id === id);
      if (found) setRoom(found as EventRoom);
      if (proposalData) setProposal({ ...(proposalData as ProposalData), budget: Number((proposalData as ProposalData).budget) });
    }).catch(() => setError("Failed to load room data."))
      .finally(() => setLoading(false));
  }, [id]);

  // Load comments when room is known
  useEffect(() => {
    if (!room?.id) return;
    fetch(`/api/rooms/${room.id}/comments`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setComments(Array.isArray(data) ? data as RoomComment[] : []))
      .catch(() => {});
  }, [room?.id]);

  // Clear highlight after 3s
  useEffect(() => {
    if (!highlightSection) return;
    const el = document.getElementById(`section-${highlightSection}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    const t = setTimeout(() => setHighlightSection(null), 3000);
    return () => clearTimeout(t);
  }, [highlightSection]);

  const transition = useCallback(async (to: RoomStatus) => {
    if (!room || transitioning || !canTransition(room.status, to)) return;
    setTransitioning(true);
    try {
      const res = await fetch(`/api/rooms/${room.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: to }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not update status.");
      setRoom((r) => r ? { ...r, status: to } : r);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setTransitioning(false);
    }
  }, [room, transitioning]);

  const handleApprove = useCallback(async () => {
    await transition("approved");
  }, [transition]);

  const handleRequestChanges = useCallback(async (message: string) => {
    if (!room) return;
    // First add the revision comment, then transition
    await handleAddComment(message, "request_change", null, null);
    await transition("revision");
  }, [room, transition]);

  const handleAddComment = useCallback(async (
    message: string,
    type: "comment" | "request_change",
    section: SectionRef | null,
    parentId: string | null,
  ) => {
    if (!room) return;
    try {
      const res = await fetch(`/api/rooms/${room.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, type, section_ref: section, parent_id: parentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to post comment.");
      setComments((prev) => [...prev, data as RoomComment]);
    } catch (e: any) {
      setError(e.message);
    }
  }, [room]);

  async function saveRunOfShow(ros: RunOfShowOutput) {
    if (!room) return;
    setRosSaving(true);
    try {
      const res = await fetch(`/api/rooms/${room.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ run_of_show: ros }),
      });
      if (res.ok) setRoom((r) => r ? { ...r, run_of_show: ros } : r);
    } catch { /* non-critical */ } finally {
      setRosSaving(false);
    }
  }

  async function saveFloorPlan(fp: FpElement[]) {
    if (!room) return;
    setFpSaving(true);
    try {
      const res = await fetch(`/api/rooms/${room.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ floor_plan: fp }),
      });
      if (res.ok) setRoom((r) => r ? { ...r, floor_plan: fp } : r);
    } catch { /* non-critical */ } finally {
      setFpSaving(false);
    }
  }

  async function handleGenerateROS(input: RunOfShowInput) {
    setRosGenerating(true);
    await new Promise((r) => setTimeout(r, 1800));
    const result = mockRunOfShow(input);
    await saveRunOfShow(result);
    setRosGenerating(false);
  }

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="animate-pulse" style={{ height: i === 0 ? 72 : 140, borderRadius: 14, border: "1px solid var(--border)", background: "var(--bg-card)" }} />
      ))}
    </div>
  );

  // ── No room yet ─────────────────────────────────────────────────────────
  if (!room) return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <CreateRoomForm proposalId={id} onCreated={setRoom} error={error} />
    </div>
  );

  const style = STATUS_STYLE[room.status];

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Room header ────────────────────────────────────────────────────── */}
      <div style={{
        borderRadius: 14, border: "1px solid var(--border)",
        background: "var(--bg-card)", padding: "16px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)", lineHeight: 1.2 }}>
                {proposal?.concept?.title ?? proposal?.title ?? "Event Room"}
              </h2>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${style.badge}`}>
                {ROOM_STATUS_LABEL[room.status]}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
              <p style={{ fontSize: 12, color: "var(--text-3)", margin: 0 }}>
                Client: <strong style={{ color: "var(--text-2)" }}>{room.client_name}</strong>
                {room.client_email && <span> · {room.client_email}</span>}
                {proposal?.eventType && <span> · {proposal.eventType}</span>}
              </p>
              {/* View tracker */}
              {(room.view_count ?? 0) > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 20,
                  background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)",
                  color: "#a5b4fc",
                }}>
                  👁 {room.view_count} view{room.view_count !== 1 ? "s" : ""}
                  {room.last_viewed_at && (
                    <span style={{ opacity: 0.7 }}>
                      {" · "}last {formatTimeAgo(room.last_viewed_at)}
                    </span>
                  )}
                </span>
              )}
              {/* Client response badge */}
              {room.client_response && (
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 20,
                  ...(room.client_response.action === "approved"
                    ? { background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#34d399" }
                    : room.client_response.action === "declined"
                    ? { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }
                    : { background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "#fbbf24" }),
                }}>
                  {room.client_response.action === "approved" ? "✓ Client Approved"
                    : room.client_response.action === "declined" ? "✗ Client Declined"
                    : "✎ Client Requested Changes"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Share link + Pipeline breadcrumb */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          {room.share_token && (
            <ShareButton token={room.share_token} />
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {(["draft","discussion","revision","approved","won"] as RoomStatus[]).map((s, i, arr) => {
              const allStatuses: RoomStatus[] = ["draft","discussion","revision","approved","won","lost"];
              const curIdx = allStatuses.indexOf(room.status);
              const thisIdx = allStatuses.indexOf(s);
              const isActive = room.status === s;
              const isPast = thisIdx < curIdx && room.status !== "lost";
              return (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 20,
                    background: isActive ? "rgba(99,102,241,0.15)" : isPast ? "rgba(16,185,129,0.08)" : "transparent",
                    color: isActive ? "#a5b4fc" : isPast ? "#34d399" : "var(--text-3)",
                    border: isActive ? "1px solid rgba(99,102,241,0.25)" : isPast ? "1px solid rgba(16,185,129,0.15)" : "1px solid transparent",
                    transition: "all 0.15s",
                  }}>
                    {ROOM_STATUS_LABEL[s]}
                  </span>
                  {i < arr.length - 1 && <span style={{ fontSize: 9, color: "var(--text-3)" }}>›</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Error banner ────────────────────────────────────────────────────── */}
      {error && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          padding: "10px 14px", borderRadius: 10,
          background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)",
          color: "#fca5a5", fontSize: 12,
        }}>
          <span>{error}</span>
          <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "rgba(252,165,165,0.5)", cursor: "pointer", fontSize: 10 }}>✕</button>
        </div>
      )}

      {/* ── View tabs ───────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border)", paddingBottom: 0 }}>
        {(["proposal", "run-of-show", "floor-plan"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setActiveView(v)}
            style={{
              padding: "8px 16px", fontSize: 12, fontWeight: 600,
              borderRadius: "8px 8px 0 0", border: "1px solid",
              borderBottom: "none", cursor: "pointer", transition: "all 0.15s",
              background: activeView === v ? "var(--bg-card)" : "transparent",
              borderColor: activeView === v ? "var(--border)" : "transparent",
              color: activeView === v ? "var(--text-1)" : "var(--text-3)",
              marginBottom: -1,
            }}
          >
            {v === "proposal" ? "📋 Proposal" : v === "run-of-show" ? "⏱ Run of Show" : "⬛ Floor Plan"}
            {v === "run-of-show" && room.run_of_show && (
              <span style={{ marginLeft: 6, fontSize: 9, padding: "1px 5px", borderRadius: 10, background: "rgba(16,185,129,0.15)", color: "#34d399", border: "1px solid rgba(16,185,129,0.25)" }}>✓</span>
            )}
            {v === "floor-plan" && room.floor_plan?.length && (
              <span style={{ marginLeft: 6, fontSize: 9, padding: "1px 5px", borderRadius: 10, background: "rgba(16,185,129,0.15)", color: "#34d399", border: "1px solid rgba(16,185,129,0.25)" }}>✓</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Proposal view (70/30 split) ──────────────────────────────────────── */}
      {activeView === "proposal" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, alignItems: "start" }}>

          {/* LEFT — Proposal view */}
          <div>
            {proposal ? (
              <ProposalClientView proposal={proposal} highlightSection={highlightSection} />
            ) : (
              <div style={{
                borderRadius: 14, border: "1px solid var(--border)", background: "var(--bg-card)",
                padding: "48px 24px", textAlign: "center",
              }}>
                <p style={{ fontSize: 13, color: "var(--text-3)" }}>Proposal data unavailable.</p>
              </div>
            )}
          </div>

          {/* RIGHT — Discussion panel (sticky) */}
          <div style={{ position: "sticky", top: 16, height: "calc(100vh - 120px)", minHeight: 500 }}>
            <DiscussionPanel
              roomId={room.id}
              roomStatus={room.status}
              comments={comments}
              onAddComment={handleAddComment}
              onApprove={handleApprove}
              onRequestChanges={handleRequestChanges}
              onHighlight={setHighlightSection}
              transitioning={transitioning}
            />
          </div>
        </div>
      )}

      {/* ── Run of Show view ─────────────────────────────────────────────────── */}
      {activeView === "run-of-show" && (
        <div style={{ maxWidth: 960 }}>
          {rosGenerating ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 320, gap: 16 }}>
              <div style={{ position: "relative", width: 56, height: 56 }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(245,158,11,0.2)", animation: "ping 1s infinite" }} />
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>⏱</div>
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>Building Run of Show…</p>
              <p style={{ fontSize: 12, color: "var(--text-3)" }}>Generating your event timeline</p>
            </div>
          ) : room.run_of_show ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <p style={{ fontSize: 12, color: "var(--text-3)" }}>
                  {rosSaving ? "Saving…" : "Auto-saved · visible to client in shared link"}
                </p>
                <button
                  onClick={() => setRoom((r) => r ? { ...r, run_of_show: null } : r)}
                  style={{ fontSize: 11, color: "var(--text-3)", background: "none", border: "1px solid var(--border)", padding: "4px 10px", borderRadius: 6, cursor: "pointer" }}
                >
                  ↺ Regenerate
                </button>
              </div>
              <RunOfShowOutputView
                output={room.run_of_show}
                onChange={(ros) => { setRoom((r) => r ? { ...r, run_of_show: ros } : r); saveRunOfShow(ros); }}
              />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
                <p style={{ fontSize: 12, color: "rgba(251,191,36,0.8)", lineHeight: 1.6 }}>
                  Generate a minute-by-minute run of show for this event. It will be saved to this room and visible to the client via their share link.
                </p>
              </div>
              <RunOfShowForm
                onGenerate={handleGenerateROS as (i: RunOfShowInput) => void}
                initialValues={proposal ? {
                  eventType: proposal.eventType ?? "",
                  eventName: proposal.concept?.title ?? proposal.title ?? "",
                  eventDate: "",
                  startTime: "18:00",
                  endTime: "23:00",
                  venue: proposal.location ?? "",
                  guestCount: 0,
                  requirements: "",
                } : undefined}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Floor Plan view ───────────────────────────────────────────────────── */}
      {activeView === "floor-plan" && (
        <div style={{ maxWidth: 1280 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <p style={{ fontSize: 12, color: "var(--text-3)" }}>
              {fpSaving ? "Saving…" : "Floor plan · editable · changes saved to this room"}
            </p>
            {room.floor_plan?.length ? (
              <button
                onClick={() => { setRoom((r) => r ? { ...r, floor_plan: null } : r); saveFloorPlan([]); }}
                style={{ fontSize: 11, color: "var(--text-3)", background: "none", border: "1px solid var(--border)", padding: "4px 10px", borderRadius: 6, cursor: "pointer" }}
              >
                Clear
              </button>
            ) : null}
          </div>
          <div style={{ height: 600, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}>
            <FloorPlanBuilder
              initialElements={room.floor_plan ?? []}
              onElementsChange={(els) => saveFloorPlan(els)}
            />
          </div>
        </div>
      )}

    </div>
  );
}
