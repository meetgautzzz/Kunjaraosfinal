"use client";

// Public client-facing Event Room.
// No login required — share_token UUID is the access credential.

import { use, useState, useEffect } from "react";
import type { ProposalData } from "@/lib/proposals";
import ProposalClientView from "@/components/proposals/ProposalClientView";
import type { RunOfShowOutput } from "@/lib/ai-tools";
import { FloorPlanViewer } from "@/components/toolkit/FloorPlanBuilder";
import type { FpElement } from "@/components/toolkit/FloorPlanBuilder";

type ClientResponse = {
  action:       "approved" | "declined" | "revision_requested";
  message:      string | null;
  responded_at: string;
  client_name:  string;
};

type PublicRoom = {
  id:              string;
  share_token:     string;
  client_name:     string;
  client_email:    string | null;
  status:          string;
  deal_value:      number;
  client_response: ClientResponse | null;
  run_of_show:     RunOfShowOutput | null;
  floor_plan:      FpElement[] | null;
  proposals:       { id: string; data: ProposalData } | null;
};

// ── Loading skeleton ──────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div style={{ minHeight: "100vh", background: "#0d0d12", padding: "24px 16px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        {[80, 200, 160, 240].map((h, i) => (
          <div key={i} className="animate-pulse" style={{ height: h, borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }} />
        ))}
      </div>
    </div>
  );
}

// ── Action panel ──────────────────────────────────────────────────────────────

function ActionPanel({
  token, clientName, existingResponse, dealStatus,
}: {
  token: string; clientName: string; existingResponse: ClientResponse | null; dealStatus: string;
}) {
  const [responded,   setResponded]   = useState<ClientResponse | null>(existingResponse);
  const [showRevForm, setShowRevForm] = useState(false);
  const [revMessage,  setRevMessage]  = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState("");

  const isClosed = dealStatus === "won" || dealStatus === "lost";

  async function respond(action: "approved" | "declined" | "revision_requested", message?: string) {
    setSubmitting(true); setError("");
    try {
      const res = await fetch(`/api/rooms/public/${token}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit.");
      setResponded({ action, message: message ?? null, responded_at: new Date().toISOString(), client_name: clientName });
      setShowRevForm(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Already responded
  if (responded) {
    const config = {
      approved:           { icon: "✓", label: "You approved this proposal", color: "#34d399", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)" },
      declined:           { icon: "✗", label: "You declined this proposal", color: "#f87171", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)" },
      revision_requested: { icon: "✎", label: "You requested changes", color: "#fbbf24", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)" },
    }[responded.action];
    return (
      <div style={{
        borderRadius: 14, padding: "18px 20px",
        background: config.bg, border: `1px solid ${config.border}`,
        display: "flex", alignItems: "flex-start", gap: 12,
      }}>
        <span style={{ fontSize: 20, color: config.color, flexShrink: 0 }}>{config.icon}</span>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: config.color }}>{config.label}</p>
          {responded.message && (
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4, fontStyle: "italic" }}>"{responded.message}"</p>
          )}
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
            {new Date(responded.responded_at).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}
          </p>
        </div>
      </div>
    );
  }

  if (isClosed) return null;

  return (
    <div style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", padding: "20px" }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
        Ready to decide?
      </p>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 16, lineHeight: 1.5 }}>
        Review the proposal above and share your decision with the team.
      </p>

      {error && <p style={{ fontSize: 12, color: "#f87171", marginBottom: 12 }}>{error}</p>}

      {showRevForm ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <textarea
            value={revMessage}
            onChange={(e) => setRevMessage(e.target.value)}
            placeholder="Describe what you'd like changed…"
            rows={4}
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)",
              color: "#fff", fontSize: 13, fontFamily: "inherit",
              resize: "vertical", outline: "none", lineHeight: 1.55, boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => { setShowRevForm(false); setRevMessage(""); }}
              style={{ flex: 1, padding: "9px", borderRadius: 8, fontSize: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              onClick={() => respond("revision_requested", revMessage)}
              disabled={submitting || !revMessage.trim()}
              style={{ flex: 2, padding: "9px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "rgba(245,158,11,0.7)", border: "none", color: "#fff", cursor: "pointer", opacity: (!revMessage.trim() || submitting) ? 0.5 : 1 }}
            >
              {submitting ? "Sending…" : "Send Request"}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => respond("approved")}
            disabled={submitting}
            style={{
              flex: 1, minWidth: 120, padding: "11px 16px", borderRadius: 9, fontSize: 13, fontWeight: 700,
              background: "rgba(16,185,129,0.85)", border: "1px solid rgba(16,185,129,0.4)",
              color: "#fff", cursor: "pointer", transition: "all 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(16,185,129,1)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(16,185,129,0.85)")}
          >
            ✓ Approve Proposal
          </button>
          <button
            onClick={() => setShowRevForm(true)}
            disabled={submitting}
            style={{
              flex: 1, minWidth: 120, padding: "11px 16px", borderRadius: 9, fontSize: 13, fontWeight: 600,
              background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)",
              color: "#fbbf24", cursor: "pointer", transition: "all 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(245,158,11,0.2)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(245,158,11,0.12)")}
          >
            ✎ Request Changes
          </button>
          <button
            onClick={() => respond("declined")}
            disabled={submitting}
            style={{
              padding: "11px 16px", borderRadius: 9, fontSize: 13, fontWeight: 500,
              background: "transparent", border: "1px solid rgba(239,68,68,0.25)",
              color: "rgba(248,113,113,0.7)", cursor: "pointer", transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget.style.background = "rgba(239,68,68,0.08)"); (e.currentTarget.style.color = "#f87171"); }}
            onMouseLeave={(e) => { (e.currentTarget.style.background = "transparent"); (e.currentTarget.style.color = "rgba(248,113,113,0.7)"); }}
          >
            Decline
          </button>
        </div>
      )}
    </div>
  );
}

// ── Comments thread (client ↔ planner) ───────────────────────────────────────

type PublicComment = {
  id:          string;
  author_name: string;
  author_type: "planner" | "client";
  message:     string;
  type:        string;
  created_at:  string;
};

function CommentsSection({ token, clientName, dealStatus }: { token: string; clientName: string; dealStatus: string }) {
  const [comments,  setComments]  = useState<PublicComment[]>([]);
  const [text,      setText]      = useState("");
  const [sending,   setSending]   = useState(false);
  const [error,     setError]     = useState("");

  useEffect(() => {
    fetch(`/api/rooms/public/${token}/comments`)
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setComments(Array.isArray(d) ? d as PublicComment[] : []))
      .catch(() => {});
  }, [token]);

  async function send() {
    if (!text.trim()) return;
    setSending(true); setError("");
    try {
      const res = await fetch(`/api/rooms/public/${token}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send.");
      setComments((prev) => [...prev, data as PublicComment]);
      setText("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  const isClosed = dealStatus === "won" || dealStatus === "lost";

  return (
    <div style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.02)", overflow: "hidden" }}>
      <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 15 }}>💬</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>Discussion</span>
        {comments.length > 0 && (
          <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 10, background: "rgba(99,102,241,0.15)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.25)" }}>{comments.length}</span>
        )}
      </div>

      <div style={{ padding: "12px 18px", display: "flex", flexDirection: "column", gap: 10, maxHeight: 320, overflowY: "auto" }}>
        {comments.length === 0 ? (
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", textAlign: "center", padding: "20px 0" }}>No messages yet. Start the conversation below.</p>
        ) : comments.map((c) => {
          const isClient = c.author_type === "client";
          return (
            <div key={c.id} style={{ display: "flex", flexDirection: "column", alignItems: isClient ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "80%", padding: "8px 12px", borderRadius: isClient ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                background: isClient ? "rgba(99,102,241,0.18)" : "rgba(255,255,255,0.06)",
                border: isClient ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(255,255,255,0.1)",
              }}>
                <p style={{ fontSize: 13, color: "#fff", lineHeight: 1.5, margin: 0 }}>{c.message}</p>
              </div>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 3 }}>
                {isClient ? clientName : c.author_name} · {new Date(c.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
              </p>
            </div>
          );
        })}
      </div>

      {!isClosed && (
        <div style={{ padding: "12px 18px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          {error && <p style={{ fontSize: 11, color: "#f87171", marginBottom: 8 }}>{error}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Type a message…"
              style={{
                flex: 1, padding: "8px 12px", borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)",
                color: "#fff", fontSize: 13, fontFamily: "inherit", outline: "none",
              }}
            />
            <button
              onClick={send}
              disabled={sending || !text.trim()}
              style={{
                padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: "rgba(99,102,241,0.7)", border: "none", color: "#fff",
                cursor: (sending || !text.trim()) ? "not-allowed" : "pointer",
                opacity: (sending || !text.trim()) ? 0.5 : 1,
              }}
            >
              {sending ? "…" : "Send"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Run of Show (read-only for client) ───────────────────────────────────────

const CAT_COLORS: Record<string, string> = {
  SETUP:   "rgba(156,163,175,0.8)",
  GUEST:   "#818cf8",
  PROGRAM: "#fbbf24",
  BREAK:   "#22d3ee",
  CLOSE:   "#c084fc",
};
const CAT_DOTS: Record<string, string> = {
  SETUP: "#6b7280", GUEST: "#6366f1", PROGRAM: "#f59e0b", BREAK: "#06b6d4", CLOSE: "#a855f7",
};

function RunOfShowSection({ ros }: { ros: RunOfShowOutput }) {
  return (
    <div style={{ borderRadius: 14, border: "1px solid rgba(245,158,11,0.2)", background: "rgba(245,158,11,0.03)", overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(245,158,11,0.12)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>⏱</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Run of Show</span>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {ros.date && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>📅 {new Date(ros.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>}
          {ros.venue && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>📍 {ros.venue}</span>}
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{ros.entries.length} cues</span>
        </div>
      </div>

      {/* Legend */}
      <div style={{ padding: "10px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 14, flexWrap: "wrap" }}>
        {Object.keys(CAT_DOTS).map((c) => (
          <div key={c} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: CAT_DOTS[c] }} />
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "capitalize" }}>{c.toLowerCase()}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.02)" }}>
              {["Time", "Duration", "Item", "Owner", "Notes"].map((h) => (
                <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", borderBottom: "1px solid rgba(255,255,255,0.06)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ros.entries.map((entry, i) => (
              <tr key={entry.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                <td style={{ padding: "9px 14px", fontSize: 12, fontFamily: "monospace", color: "rgba(255,255,255,0.7)", whiteSpace: "nowrap" }}>{entry.time}</td>
                <td style={{ padding: "9px 14px", fontSize: 11, color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>{entry.duration}m</td>
                <td style={{ padding: "9px 14px", fontSize: 12, fontWeight: 500, color: CAT_COLORS[entry.category] ?? "#fff" }}>{entry.item}</td>
                <td style={{ padding: "9px 14px", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{entry.owner}</td>
                <td style={{ padding: "9px 14px", fontSize: 11, color: "rgba(255,255,255,0.3)", maxWidth: 220 }}>{entry.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {ros.notes?.length > 0 && (
        <div style={{ padding: "12px 18px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {ros.notes.map((n, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
              <span style={{ color: "#fbbf24", fontSize: 11, flexShrink: 0 }}>→</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>{n}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ClientRoomPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [room,    setRoom]    = useState<PublicRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`/api/rooms/public/${token}`)
      .then((r) => r.ok ? r.json() : r.json().then((d: any) => Promise.reject(d.error ?? r.status)))
      .then((d) => setRoom(d as PublicRoom))
      .catch((msg) => setError(typeof msg === "string" ? msg : "This link is invalid or has expired."))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <Skeleton />;

  if (error || !room) {
    return (
      <div style={{ minHeight: "100vh", background: "#0d0d12", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 380 }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>🔗</p>
          <p style={{ fontSize: 16, fontWeight: 600, color: "rgba(255,255,255,0.8)", marginBottom: 8 }}>Link not found</p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
            {error || "This room link is invalid or has expired. Please ask your event planner to resend the link."}
          </p>
        </div>
      </div>
    );
  }

  const proposal = room.proposals?.data ?? null;

  return (
    <div style={{ minHeight: "100vh", background: "#0d0d12", color: "#fff" }}>

      {/* Top bar */}
      <div style={{
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(255,255,255,0.02)",
        padding: "12px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: "linear-gradient(135deg, #4338ca, #7c3aed)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 900, color: "#fff", flexShrink: 0,
          }}>K</div>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Kunjara OS · Event Proposal</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Prepared for</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{room.client_name}</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 16px 48px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Action panel — top so client sees it immediately */}
          <ActionPanel
            token={token}
            clientName={room.client_name}
            existingResponse={room.client_response}
            dealStatus={room.status}
          />

          {/* Proposal */}
          {proposal ? (
            // Wrap in dark-mode override so ProposalClientView reads CSS vars correctly
            <div className="dark">
              <ProposalClientView proposal={proposal} />
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "48px 24px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>Proposal details are not available yet.</p>
            </div>
          )}

          {/* Run of Show — shown if planner generated one */}
          {room.run_of_show && (
            <RunOfShowSection ros={room.run_of_show} />
          )}

          {/* Floor Plan — shown if planner created one */}
          {room.floor_plan && room.floor_plan.length > 0 && (
            <div style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>⬛</span>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.9)", margin: 0 }}>Event Floor Plan</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>{room.floor_plan.length} element{room.floor_plan.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <FloorPlanViewer elements={room.floor_plan} height={380} />
            </div>
          )}

          {/* Comments thread */}
          <CommentsSection token={token} clientName={room.client_name} dealStatus={room.status} />

          {/* Second action panel at bottom for long proposals */}
          <ActionPanel
            token={token}
            clientName={room.client_name}
            existingResponse={room.client_response}
            dealStatus={room.status}
          />

          {/* Footer */}
          <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 8 }}>
            Powered by Kunjara OS · This link is private and unique to you
          </p>
        </div>
      </div>
    </div>
  );
}
