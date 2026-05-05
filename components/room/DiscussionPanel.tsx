"use client";

import React, { useState, useRef, useEffect } from "react";
import type { RoomComment, SectionRef } from "@/lib/event-rooms";
import type { RoomStatus } from "@/lib/event-rooms";

type CommentType = "comment" | "request_change";

type Props = {
  roomId:           string;
  roomStatus:       RoomStatus;
  comments:         RoomComment[];
  onAddComment:     (msg: string, type: CommentType, section: SectionRef | null, parentId: string | null) => Promise<void>;
  onApprove:        () => Promise<void>;
  onRequestChanges: (message: string) => Promise<void>;
  onHighlight:      (section: SectionRef | null) => void;
  transitioning:    boolean;
};

const SECTION_LABELS: Record<string, string> = {
  concept:    "Concept",
  experience: "Experience",
  visual:     "Visual & Stage",
  activation: "Activations",
  timeline:   "Timeline",
  budget:     "Budget",
  vendors:    "Vendors",
  compliance: "Compliance",
};

const SECTION_OPTS = [null, "concept", "experience", "visual", "activation", "timeline", "budget", "vendors", "compliance"] as const;

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Single comment bubble ─────────────────────────────────────────────────────

function CommentBubble({
  comment, onReply, onHighlight,
}: {
  comment:     RoomComment;
  onReply:     (parentId: string) => void;
  onHighlight: (section: SectionRef | null) => void;
}) {
  const isChange = comment.type === "request_change";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{
        padding: "10px 12px",
        borderRadius: comment.parent_id ? "0 10px 10px 10px" : 10,
        background: isChange ? "rgba(245,158,11,0.06)" : "var(--bg-surface)",
        border: isChange ? "1px solid rgba(245,158,11,0.2)" : "1px solid var(--border)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, flexWrap: "wrap" }}>
          <div style={{
            width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
            background: "rgba(99,102,241,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9, fontWeight: 800, color: "#a5b4fc",
          }}>
            {(comment.author_name || "P")[0].toUpperCase()}
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-1)" }}>{comment.author_name}</span>
          {isChange && (
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
              padding: "1px 5px", borderRadius: 3,
              background: "rgba(245,158,11,0.12)", color: "#fbbf24",
              border: "1px solid rgba(245,158,11,0.2)",
            }}>
              Change Request
            </span>
          )}
          {comment.section_ref && (
            <button
              onClick={() => onHighlight(comment.section_ref as SectionRef)}
              style={{
                marginLeft: "auto", fontSize: 9, fontWeight: 600, letterSpacing: "0.06em",
                padding: "1px 6px", borderRadius: 3,
                background: "rgba(99,102,241,0.1)", color: "#a5b4fc",
                border: "1px solid rgba(99,102,241,0.2)",
                cursor: "pointer",
              }}
            >
              {SECTION_LABELS[comment.section_ref] ?? comment.section_ref} ↗
            </button>
          )}
          <span style={{ marginLeft: comment.section_ref ? 0 : "auto", fontSize: 10, color: "var(--text-3)" }}>
            {timeAgo(comment.created_at)}
          </span>
        </div>

        {/* Message */}
        <p style={{ fontSize: 12, color: "var(--text-1)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{comment.message}</p>
      </div>

      {/* Reply button */}
      {!comment.parent_id && (
        <button
          onClick={() => onReply(comment.id)}
          style={{
            alignSelf: "flex-start", fontSize: 10, color: "var(--text-3)",
            background: "none", border: "none", cursor: "pointer", padding: "0 4px",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-2)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-3)")}
        >
          ↩ Reply
        </button>
      )}
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────────

export default function DiscussionPanel({
  roomId, roomStatus, comments, onAddComment, onApprove, onRequestChanges, onHighlight, transitioning,
}: Props) {
  const [message,      setMessage]      = useState("");
  const [commentType,  setCommentType]  = useState<CommentType>("comment");
  const [sectionRef,   setSectionRef]   = useState<SectionRef | null>(null);
  const [replyTo,      setReplyTo]      = useState<string | null>(null);
  const [submitting,   setSubmitting]   = useState(false);
  const [showApprove,  setShowApprove]  = useState(false);
  const [revMessage,   setRevMessage]   = useState("");
  const [showRevision, setShowRevision] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length]);

  // Build threaded structure: top-level → replies
  const threads: { top: RoomComment; replies: RoomComment[] }[] = [];
  const topLevel = comments.filter((c) => !c.parent_id);
  const replies  = comments.filter((c) => !!c.parent_id);

  for (const top of topLevel) {
    threads.push({ top, replies: replies.filter((r) => r.parent_id === top.id) });
  }

  async function submit() {
    if (!message.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onAddComment(message.trim(), commentType, sectionRef, replyTo);
      setMessage("");
      setReplyTo(null);
      setCommentType("comment");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApprove() {
    setShowApprove(false);
    await onApprove();
  }

  async function handleRevision() {
    if (!revMessage.trim()) return;
    setShowRevision(false);
    await onRequestChanges(revMessage.trim());
    setRevMessage("");
  }

  const isClosed = roomStatus === "won" || roomStatus === "lost";
  const isApproved = roomStatus === "approved" || roomStatus === "won";

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100%", minHeight: 0,
      border: "1px solid var(--border)",
      borderRadius: 14, overflow: "hidden",
      background: "var(--bg-card)",
    }}>
      {/* ── Header & Actions ─────────────────────────────────────────────── */}
      <div style={{
        padding: "14px 16px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-surface)",
        flexShrink: 0,
      }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-2)", marginBottom: 10 }}>
          Discussion
        </p>

        {/* Approval buttons */}
        {!isClosed && (
          <div style={{ display: "flex", gap: 6 }}>
            {!isApproved && (
              <button
                onClick={() => setShowApprove(true)}
                disabled={transitioning}
                style={{
                  flex: 1, padding: "7px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)",
                  color: "#34d399", cursor: "pointer", transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(16,185,129,0.18)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(16,185,129,0.1)"; }}
              >
                ✓ Approve
              </button>
            )}
            {!isApproved && (
              <button
                onClick={() => setShowRevision(true)}
                disabled={transitioning}
                style={{
                  flex: 1, padding: "7px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
                  color: "#fbbf24", cursor: "pointer", transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(245,158,11,0.15)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(245,158,11,0.08)"; }}
              >
                ✎ Request Changes
              </button>
            )}
            {isApproved && (
              <div style={{
                width: "100%", padding: "8px 12px", borderRadius: 8, textAlign: "center",
                background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
                fontSize: 12, fontWeight: 600, color: "#34d399",
              }}>
                ✓ Proposal Approved
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Approve confirm modal ─────────────────────────────────────────── */}
      {showApprove && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
          borderRadius: 14,
        }}>
          <div style={{
            width: "90%", maxWidth: 340, borderRadius: 14,
            border: "1px solid rgba(16,185,129,0.25)", background: "var(--bg-raised)",
            padding: "24px 22px", display: "flex", flexDirection: "column", gap: 14,
          }}>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)", marginBottom: 4 }}>Approve Proposal?</p>
              <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.55 }}>
                This will lock the proposal and mark the deal as approved. This action cannot be undone.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowApprove(false)} style={{ flex: 1, padding: "8px", borderRadius: 8, fontSize: 12, background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-2)", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleApprove} style={{ flex: 1, padding: "8px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "rgba(16,185,129,0.85)", border: "none", color: "#fff", cursor: "pointer" }}>
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Request changes modal ─────────────────────────────────────────── */}
      {showRevision && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
          borderRadius: 14,
        }}>
          <div style={{
            width: "90%", maxWidth: 340, borderRadius: 14,
            border: "1px solid rgba(245,158,11,0.25)", background: "var(--bg-raised)",
            padding: "24px 22px", display: "flex", flexDirection: "column", gap: 14,
          }}>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)", marginBottom: 4 }}>Request Changes</p>
              <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.55 }}>
                Describe what needs to be revised. This will move the room to revision status.
              </p>
            </div>
            <textarea
              value={revMessage}
              onChange={(e) => setRevMessage(e.target.value)}
              placeholder="Describe the changes needed…"
              rows={4}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8,
                border: "1px solid var(--border)", background: "var(--bg-surface)",
                color: "var(--text-1)", fontSize: 12, fontFamily: "inherit",
                resize: "vertical", outline: "none", lineHeight: 1.55,
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setShowRevision(false); setRevMessage(""); }} style={{ flex: 1, padding: "8px", borderRadius: 8, fontSize: 12, background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-2)", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleRevision} disabled={!revMessage.trim()} style={{ flex: 1, padding: "8px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "rgba(245,158,11,0.85)", border: "none", color: "#fff", cursor: "pointer", opacity: revMessage.trim() ? 1 : 0.5 }}>
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Thread list ───────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 8px" }}>
        {threads.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <p style={{ fontSize: 22, marginBottom: 8 }}>💬</p>
            <p style={{ fontSize: 12, color: "var(--text-3)" }}>No comments yet. Start the discussion.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {threads.map(({ top, replies: reps }) => (
              <div key={top.id}>
                <CommentBubble comment={top} onReply={(id) => setReplyTo(id)} onHighlight={onHighlight} />
                {reps.length > 0 && (
                  <div style={{ marginLeft: 16, marginTop: 6, paddingLeft: 12, borderLeft: "2px solid var(--border)", display: "flex", flexDirection: "column", gap: 6 }}>
                    {reps.map((r) => (
                      <CommentBubble key={r.id} comment={r} onReply={() => setReplyTo(top.id)} onHighlight={onHighlight} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Compose ───────────────────────────────────────────────────────── */}
      {!isClosed && (
        <div style={{ flexShrink: 0, padding: "10px 14px 14px", borderTop: "1px solid var(--border)" }}>
          {/* Reply indicator */}
          {replyTo && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "4px 8px", marginBottom: 6, borderRadius: 6,
              background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)",
              fontSize: 11, color: "#a5b4fc",
            }}>
              <span>↩ Replying to thread</span>
              <button onClick={() => setReplyTo(null)} style={{ background: "none", border: "none", color: "rgba(165,180,252,0.5)", cursor: "pointer", fontSize: 10 }}>✕</button>
            </div>
          )}

          {/* Type + section selectors */}
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <select
              value={commentType}
              onChange={(e) => setCommentType(e.target.value as CommentType)}
              style={{
                flex: 1, padding: "5px 8px", borderRadius: 6, fontSize: 11,
                border: "1px solid var(--border)", background: "var(--bg-surface)",
                color: "var(--text-2)", cursor: "pointer",
              }}
            >
              <option value="comment">Comment</option>
              <option value="request_change">Request Change</option>
            </select>
            <select
              value={sectionRef ?? ""}
              onChange={(e) => setSectionRef((e.target.value || null) as SectionRef | null)}
              style={{
                flex: 1, padding: "5px 8px", borderRadius: 6, fontSize: 11,
                border: "1px solid var(--border)", background: "var(--bg-surface)",
                color: "var(--text-2)", cursor: "pointer",
              }}
            >
              <option value="">All sections</option>
              {Object.entries(SECTION_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          {/* Input */}
          <div style={{
            display: "flex", gap: 8, alignItems: "flex-end",
            background: "var(--bg-surface)", border: "1px solid var(--border)",
            borderRadius: 10, padding: "8px 10px",
          }}>
            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
              }}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(); }}
              placeholder={commentType === "request_change" ? "Describe what needs to change…" : "Add a comment…"}
              rows={1}
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                resize: "none", fontSize: 12, color: "var(--text-1)",
                lineHeight: 1.5, fontFamily: "inherit", maxHeight: 100, overflow: "auto",
              }}
            />
            <button
              onClick={submit}
              disabled={submitting || !message.trim()}
              style={{
                width: 28, height: 28, borderRadius: 7, border: "none", flexShrink: 0,
                background: message.trim() ? (commentType === "request_change" ? "rgba(245,158,11,0.8)" : "var(--accent)") : "var(--bg-surface)",
                color: message.trim() ? "#fff" : "var(--text-3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: (!submitting && message.trim()) ? "pointer" : "not-allowed",
                transition: "all 0.15s",
              }}
            >
              {submitting ? "…" : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              )}
            </button>
          </div>
          <p style={{ fontSize: 10, color: "var(--text-3)", marginTop: 5 }}>⌘+Enter to send</p>
        </div>
      )}
    </div>
  );
}
