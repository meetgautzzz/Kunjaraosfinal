"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import type { EventRoom, RoomStatus } from "@/lib/event-rooms";
import { ROOM_STATUS_LABEL, canTransition } from "@/lib/event-rooms";

const STATUS_STYLE: Record<RoomStatus, string> = {
  draft:      "bg-slate-500/15 text-slate-400 border-slate-500/25",
  discussion: "bg-indigo-500/15 text-indigo-400 border-indigo-500/25",
  revision:   "bg-amber-500/15 text-amber-400 border-amber-500/25",
  approved:   "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  won:        "bg-emerald-700/20 text-emerald-300 border-emerald-700/30",
  lost:       "bg-red-500/15 text-red-400 border-red-500/25",
};

const NEXT_ACTIONS: Partial<Record<RoomStatus, { to: RoomStatus; label: string; color: string }[]>> = {
  draft:      [{ to: "discussion", label: "Send to Client", color: "bg-indigo-500 hover:bg-indigo-600" }, { to: "lost", label: "Mark Lost", color: "bg-red-500/80 hover:bg-red-500" }],
  discussion: [{ to: "revision", label: "Request Revision", color: "bg-amber-500 hover:bg-amber-600" }, { to: "approved", label: "Approve", color: "bg-emerald-500 hover:bg-emerald-600" }, { to: "lost", label: "Mark Lost", color: "bg-red-500/80 hover:bg-red-500" }],
  revision:   [{ to: "discussion", label: "Back to Discussion", color: "bg-indigo-500 hover:bg-indigo-600" }, { to: "lost", label: "Mark Lost", color: "bg-red-500/80 hover:bg-red-500" }],
  approved:   [{ to: "won", label: "Mark Won", color: "bg-emerald-600 hover:bg-emerald-700" }, { to: "lost", label: "Mark Lost", color: "bg-red-500/80 hover:bg-red-500" }],
};

export default function EventRoomPage() {
  const { id } = useParams<{ id: string }>();
  const [room,         setRoom]         = useState<EventRoom | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [creating,     setCreating]     = useState(false);
  const [transitioning,setTransitioning]= useState(false);
  const [clientName,   setClientName]   = useState("");
  const [clientEmail,  setClientEmail]  = useState("");
  const [showCreate,   setShowCreate]   = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch("/api/rooms")
      .then((r) => r.ok ? r.json() : [])
      .then((rooms: any[]) => {
        const found = rooms.find((r: any) => r.proposal_id === id);
        if (found) setRoom(found as EventRoom);
      })
      .catch(() => setError("Failed to load room."))
      .finally(() => setLoading(false));
  }, [id]);

  async function createRoom() {
    if (!clientName.trim()) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposal_id: id, client_name: clientName.trim(), client_email: clientEmail.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create room.");
      setRoom(data as EventRoom);
      setShowCreate(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  }

  async function transition(to: RoomStatus) {
    if (!room || transitioning) return;
    if (!canTransition(room.status, to)) return;
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
  }

  if (loading) return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] animate-pulse" />)}
    </div>
  );

  if (!room && !showCreate) return (
    <div className="max-w-3xl mx-auto p-12 text-center">
      <div className="w-14 h-14 rounded-full bg-indigo-500/10 flex items-center justify-center text-2xl mx-auto mb-4">🏠</div>
      <h3 className="text-[var(--text-1)] font-semibold text-base mb-1">No Event Room yet</h3>
      <p className="text-[var(--text-3)] text-sm mb-6 max-w-sm mx-auto">
        Create an Event Room to manage the deal lifecycle — from proposal through approval to won.
      </p>
      {error && <p className="text-red-400 text-xs mb-4">{error}</p>}
      <button
        onClick={() => setShowCreate(true)}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors"
      >
        + Create Event Room
      </button>
    </div>
  );

  if (showCreate) return (
    <div className="max-w-md mx-auto p-6 space-y-5">
      <div>
        <h3 className="text-[var(--text-1)] font-bold text-lg">Create Event Room</h3>
        <p className="text-[var(--text-3)] text-sm mt-1">Enter client details to open the room.</p>
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <div className="space-y-3">
        <div>
          <label className="field-label">Client Name *</label>
          <input className="input" placeholder="Eg. Ravi Mehta" value={clientName} onChange={(e) => setClientName(e.target.value)} />
        </div>
        <div>
          <label className="field-label">Client Email (optional)</label>
          <input className="input" type="email" placeholder="client@company.com" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={() => setShowCreate(false)} className="btn-ghost">Cancel</button>
        <button
          onClick={createRoom}
          disabled={creating || !clientName.trim()}
          className="btn-primary"
        >
          {creating ? "Creating…" : "Create Room"}
        </button>
      </div>
    </div>
  );

  const actions = NEXT_ACTIONS[room!.status] ?? [];

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-1)]">Event Room</h2>
          <p className="text-[var(--text-2)] text-sm mt-0.5">Manage the deal lifecycle for this proposal.</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-red-500/20 bg-red-500/08 p-4">
          <span className="text-red-400 text-sm">{error}</span>
          <button onClick={() => setError("")} className="text-red-400/50 text-xs">✕</button>
        </div>
      )}

      {/* Status card */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 space-y-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[var(--text-3)] text-xs uppercase tracking-wide font-medium mb-1">Client</p>
            <p className="text-[var(--text-1)] font-semibold text-base">{room!.client_name}</p>
            {room!.client_email && <p className="text-[var(--text-3)] text-sm">{room!.client_email}</p>}
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${STATUS_STYLE[room!.status]}`}>
            {ROOM_STATUS_LABEL[room!.status]}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] p-3">
            <p className="text-[var(--text-3)] text-[11px] uppercase tracking-wide mb-1">Deal Value</p>
            <p className="text-[var(--text-1)] font-bold text-lg tabular-nums">
              {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(room!.deal_value))}
            </p>
          </div>
          <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] p-3">
            <p className="text-[var(--text-3)] text-[11px] uppercase tracking-wide mb-1">Created</p>
            <p className="text-[var(--text-1)] font-semibold text-sm">
              {new Date(room!.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Stage pipeline */}
        <div>
          <p className="text-[var(--text-3)] text-xs uppercase tracking-wide font-medium mb-3">Pipeline</p>
          <div className="flex items-center gap-1 flex-wrap">
            {(["draft","discussion","revision","approved","won"] as RoomStatus[]).map((s, i, arr) => {
              const statuses: RoomStatus[] = ["draft","discussion","revision","approved","won","lost"];
              const currentIdx = statuses.indexOf(room!.status);
              const thisIdx = statuses.indexOf(s);
              const isActive = room!.status === s;
              const isPast = thisIdx < currentIdx && room!.status !== "lost";
              return (
                <div key={s} className="flex items-center gap-1">
                  <div className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                    isActive ? STATUS_STYLE[s]
                    : isPast ? "bg-emerald-500/10 text-emerald-400/60 border-emerald-500/15"
                    : "bg-transparent text-[var(--text-3)] border-[var(--border)]"
                  }`}>
                    {ROOM_STATUS_LABEL[s]}
                  </div>
                  {i < arr.length - 1 && <span className="text-[var(--text-3)] text-xs">→</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        {actions.length > 0 && room!.status !== "won" && room!.status !== "lost" && (
          <div className="flex gap-2 flex-wrap pt-1 border-t border-[var(--border)]">
            {actions.map((a) => (
              <button
                key={a.to}
                onClick={() => transition(a.to)}
                disabled={transitioning}
                className={`px-4 py-2 rounded-lg text-white text-sm font-semibold transition-colors disabled:opacity-50 ${a.color}`}
              >
                {transitioning ? "…" : a.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] p-8 text-center">
        <p className="text-[var(--text-3)] text-sm">Discussion threads and revision history coming soon.</p>
      </div>
    </div>
  );
}
