"use client";

import { useEffect, useState, useRef, useCallback } from "react";

const GOLD = "#D4A85F";

type ApprovalStatus = "pending" | "approved" | "changes_requested" | "rejected";
type SectionApproval = { status: ApprovalStatus; note?: string; by?: string; at?: string };

type Comment = {
  id: string;
  author_name: string;
  author_type: "planner" | "client";
  message: string;
  section_ref: string | null;
  parent_id: string | null;
  created_at: string;
};

type ActivityItem = {
  id: string;
  actor_name: string;
  actor_role: "planner" | "client";
  action: string;
  section: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type RoomData = {
  shareUrl: string;
  shareToken: string;
  status: string;
  sectionApprovals: Record<string, SectionApproval>;
  viewCount: number;
  lastViewedAt: string | null;
  clientName: string | null;
  clientResponse: Record<string, unknown> | null;
};

const APPROVAL_CONFIG: Record<ApprovalStatus, { color: string; bg: string; label: string; icon: string }> = {
  pending:           { color: "#6b7280", bg: "rgba(107,114,128,0.08)", label: "Pending",          icon: "○" },
  approved:          { color: "#34d399", bg: "rgba(52,211,153,0.10)",  label: "Approved",         icon: "✓" },
  changes_requested: { color: "#fbbf24", bg: "rgba(251,191,36,0.10)",  label: "Changes Requested", icon: "✎" },
  rejected:          { color: "#f87171", bg: "rgba(248,113,113,0.10)", label: "Rejected",         icon: "✕" },
};

const ROOM_STATUS_LABEL: Record<string, { label: string; color: string }> = {
  draft:       { label: "Draft",            color: "#6b7280" },
  discussion:  { label: "Under Review",     color: "#60a5fa" },
  revision:    { label: "Changes Requested",color: "#fbbf24" },
  approved:    { label: "Approved",         color: "#34d399" },
  won:         { label: "Won",              color: "#34d399" },
  lost:        { label: "Rejected",         color: "#f87171" },
};

const SECTIONS = [
  "concept", "budget", "timeline", "experience", "visual", "vendors",
] as const;

type Props = {
  proposalId: string;
  activeTab: string;
};

type SidebarTab = "approvals" | "comments" | "activity";

export default function ReviewSidebar({ proposalId, activeTab }: Props) {
  const [sidebarTab, setSidebarTab]     = useState<SidebarTab>("approvals");
  const [room, setRoom]                 = useState<RoomData | null>(null);
  const [comments, setComments]         = useState<Comment[]>([]);
  const [activity, setActivity]         = useState<ActivityItem[]>([]);
  const [loading, setLoading]           = useState(true);
  const [generating, setGenerating]     = useState(false);
  const [copied, setCopied]             = useState(false);
  const [replyText, setReplyText]       = useState("");
  const [replying, setReplying]         = useState(false);
  const commentsEndRef                  = useRef<HTMLDivElement>(null);
  const pollRef                         = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/proposals/${proposalId}/review-data`);
      if (!r.ok) return;
      const d = await r.json();
      if (d.room) setRoom(d.room as RoomData);
      setComments(d.comments ?? []);
      setActivity(d.activity ?? []);
    } finally {
      setLoading(false);
    }
  }, [proposalId]);

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, 30_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [load]);

  useEffect(() => {
    if (sidebarTab === "comments") {
      commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments, sidebarTab]);

  async function generateLink() {
    setGenerating(true);
    try {
      const r = await fetch(`/api/proposals/${proposalId}/share-link`, { method: "POST" });
      if (!r.ok) return;
      const d = await r.json();
      setRoom((prev) => prev ? { ...prev, shareUrl: d.shareUrl, shareToken: d.shareToken, status: d.status ?? prev.status } : d as RoomData);
      await load();
    } finally {
      setGenerating(false);
    }
  }

  async function copyLink() {
    if (!room?.shareUrl) return;
    await navigator.clipboard.writeText(room.shareUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function sendReply() {
    if (!replyText.trim() || replying || !room) return;
    setReplying(true);
    try {
      const r = await fetch(`/api/review/${room.shareToken}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: "Planner",
          authorRole: "planner",
          message: replyText.trim(),
        }),
      });
      if (r.ok) {
        const d = await r.json();
        setComments((prev) => [...prev, d.comment]);
        setReplyText("");
      }
    } finally {
      setReplying(false);
    }
  }

  const sectionComments = comments.filter((c) => c.section_ref === activeTab);
  const allCommentCount = comments.length;
  const approvedCount   = room ? Object.values(room.sectionApprovals).filter((a) => a.status === "approved").length : 0;
  const changesCount    = room ? Object.values(room.sectionApprovals).filter((a) => a.status === "changes_requested").length : 0;
  const roomStatusCfg   = room ? (ROOM_STATUS_LABEL[room.status] ?? { label: room.status, color: "#6b7280" }) : null;

  const btnBase: React.CSSProperties = {
    flex: 1, padding: "8px 6px", borderRadius: 8, fontSize: 12, fontWeight: 700,
    cursor: "pointer", transition: "all 0.15s", border: "1px solid transparent",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-card)", borderLeft: "1px solid var(--border)" }}>

      {/* Sidebar tab bar */}
      <div style={{ display: "flex", padding: "12px 12px 0", gap: 4, borderBottom: "1px solid var(--border)" }}>
        {([
          { id: "approvals", label: "Approvals" },
          { id: "comments",  label: `Comments${allCommentCount > 0 ? ` (${allCommentCount})` : ""}` },
          { id: "activity",  label: "Activity" },
        ] as { id: SidebarTab; label: string }[]).map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setSidebarTab(id)}
            style={{
              ...btnBase,
              background:   sidebarTab === id ? `${GOLD}15` : "transparent",
              borderColor:  sidebarTab === id ? `${GOLD}40` : "transparent",
              color:        sidebarTab === id ? GOLD : "var(--text-3)",
              fontSize: 11,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px" }}>

        {/* ── APPROVALS tab ─────────────────────────────────────────────────── */}
        {sidebarTab === "approvals" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Share link block */}
            <div style={{ borderRadius: 12, border: `1px solid var(--border)`, background: "var(--bg-surface)", padding: "14px 14px" }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-3)", textTransform: "uppercase", marginBottom: 10 }}>
                Client Share Link
              </p>

              {!loading && !room?.shareUrl ? (
                <button
                  onClick={generateLink}
                  disabled={generating}
                  style={{ width: "100%", padding: "10px 0", borderRadius: 9, background: GOLD, border: "none", color: "#07070c", fontWeight: 800, fontSize: 13, cursor: generating ? "not-allowed" : "pointer", opacity: generating ? 0.7 : 1 }}
                >
                  {generating ? "Generating…" : "Generate Share Link"}
                </button>
              ) : room?.shareUrl ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    readOnly
                    value={room.shareUrl}
                    style={{ flex: 1, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", fontSize: 11, color: "var(--text-2)", outline: "none", minWidth: 0 }}
                  />
                  <button
                    onClick={copyLink}
                    style={{ padding: "8px 12px", borderRadius: 8, background: copied ? "rgba(52,211,153,0.12)" : `${GOLD}18`, border: `1px solid ${copied ? "rgba(52,211,153,0.3)" : GOLD + "40"}`, color: copied ? "#34d399" : GOLD, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    {copied ? "✓" : "Copy"}
                  </button>
                </div>
              ) : (
                <div style={{ height: 32, background: "var(--bg-card)", borderRadius: 8, animation: "pulse 1.5s infinite" }} />
              )}

              {room?.viewCount != null && room.viewCount > 0 && (
                <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 8 }}>
                  👁 Viewed {room.viewCount} {room.viewCount === 1 ? "time" : "times"}
                  {room.lastViewedAt && ` · Last ${new Date(room.lastViewedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
                </p>
              )}
            </div>

            {/* Overall status */}
            {room && roomStatusCfg && (
              <div style={{ borderRadius: 12, border: `1px solid ${roomStatusCfg.color}25`, background: `${roomStatusCfg.color}08`, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: roomStatusCfg.color }}>{roomStatusCfg.label}</p>
                <div style={{ display: "flex", gap: 8 }}>
                  {approvedCount > 0 && <span style={{ fontSize: 10, color: "#34d399" }}>✓ {approvedCount} approved</span>}
                  {changesCount > 0  && <span style={{ fontSize: 10, color: "#fbbf24" }}>✎ {changesCount} changes</span>}
                </div>
              </div>
            )}

            {/* Per-section approval status */}
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-3)", textTransform: "uppercase", marginBottom: 10 }}>
                Section Approvals
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {SECTIONS.map((sec) => {
                  const ap = room?.sectionApprovals[sec] as SectionApproval | undefined;
                  const st = ap?.status ?? "pending";
                  const cfg = APPROVAL_CONFIG[st];
                  return (
                    <div key={sec} style={{ borderRadius: 9, border: `1px solid ${cfg.color}20`, background: cfg.bg, padding: "10px 12px", display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <span style={{ fontSize: 14, color: cfg.color, flexShrink: 0, marginTop: 1 }}>{cfg.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-1)", textTransform: "capitalize" }}>{sec}</p>
                          <p style={{ fontSize: 10, color: cfg.color }}>{cfg.label}</p>
                        </div>
                        {ap?.note && <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 3, fontStyle: "italic" }}>"{ap.note}"</p>}
                        {ap?.by && <p style={{ fontSize: 10, color: "var(--text-3)", marginTop: 2 }}>by {ap.by}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Client overall response */}
            {room?.clientResponse && (
              <div style={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg-surface)", padding: "12px 14px" }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-3)", textTransform: "uppercase", marginBottom: 8 }}>Client Response</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", marginBottom: 4 }}>
                  {String(room.clientResponse.action ?? "").replace("_", " ")}
                </p>
                {!!room.clientResponse.comment && (
                  <p style={{ fontSize: 12, color: "var(--text-2)", fontStyle: "italic" }}>"{String(room.clientResponse.comment)}"</p>
                )}
                {!!room.clientResponse.clientName && (
                  <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 6 }}>— {String(room.clientResponse.clientName)}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── COMMENTS tab ──────────────────────────────────────────────────── */}
        {sidebarTab === "comments" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {comments.length === 0 && (
              <p style={{ fontSize: 12, color: "var(--text-3)", textAlign: "center", padding: "24px 0" }}>No comments yet. Share the link with your client to get feedback.</p>
            )}
            {comments.map((c) => (
              <div key={c.id} style={{ borderRadius: 10, border: "1px solid var(--border)", background: c.author_type === "planner" ? `rgba(99,102,241,0.06)` : `${GOLD}06`, padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", background: c.author_type === "planner" ? "rgba(99,102,241,0.25)" : `${GOLD}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: c.author_type === "planner" ? "#a5b4fc" : GOLD, flexShrink: 0 }}>
                    {c.author_name.charAt(0).toUpperCase()}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: c.author_type === "planner" ? "#a5b4fc" : GOLD }}>{c.author_name}</span>
                  {c.section_ref && (
                    <span style={{ fontSize: 10, color: "var(--text-3)", padding: "2px 7px", borderRadius: 10, background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                      {c.section_ref}
                    </span>
                  )}
                  <span style={{ fontSize: 10, color: "var(--text-3)", marginLeft: "auto" }}>
                    {new Date(c.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.55 }}>{c.message}</p>
              </div>
            ))}
            <div ref={commentsEndRef} />

            {/* Planner reply box */}
            {room?.shareToken && (
              <div style={{ marginTop: 8, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-3)", textTransform: "uppercase", marginBottom: 8 }}>Reply as Planner</p>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={3}
                  placeholder="Type your reply…"
                  style={{ width: "100%", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 9, padding: "9px 11px", fontSize: 13, color: "var(--text-1)", resize: "none", outline: "none", boxSizing: "border-box" }}
                />
                <button
                  onClick={sendReply}
                  disabled={!replyText.trim() || replying}
                  style={{ marginTop: 6, width: "100%", padding: "9px 0", borderRadius: 8, background: replyText.trim() ? `${GOLD}18` : "transparent", border: `1px solid ${replyText.trim() ? GOLD + "45" : "var(--border)"}`, color: replyText.trim() ? GOLD : "var(--text-3)", fontWeight: 700, fontSize: 12, cursor: replyText.trim() ? "pointer" : "not-allowed" }}
                >
                  {replying ? "Sending…" : "Send Reply"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── ACTIVITY tab ──────────────────────────────────────────────────── */}
        {sidebarTab === "activity" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {activity.length === 0 && (
              <p style={{ fontSize: 12, color: "var(--text-3)", textAlign: "center", padding: "24px 0" }}>No activity yet.</p>
            )}
            {activity.map((item, i) => (
              <div key={item.id} style={{ display: "flex", gap: 10, paddingBottom: 16, position: "relative" }}>
                {i < activity.length - 1 && (
                  <div style={{ position: "absolute", left: 10, top: 22, bottom: 0, width: 1, background: "var(--border)" }} />
                )}
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: item.actor_role === "planner" ? "rgba(99,102,241,0.25)" : `${GOLD}20`, border: `1px solid ${item.actor_role === "planner" ? "rgba(99,102,241,0.4)" : GOLD + "40"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: item.actor_role === "planner" ? "#a5b4fc" : GOLD, flexShrink: 0, marginTop: 1 }}>
                  {item.actor_name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, color: "var(--text-1)", lineHeight: 1.4 }}>
                    <strong>{item.actor_name}</strong>{" "}
                    <span style={{ color: "var(--text-2)" }}>{item.action}</span>
                  </p>
                  <p style={{ fontSize: 10, color: "var(--text-3)", marginTop: 3 }}>
                    {new Date(item.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
