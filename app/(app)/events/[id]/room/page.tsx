"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import RoomShell from "@/components/room/RoomShell";
import type { EventRoom } from "@/lib/room";

export default function OrganizerRoomPage() {
  const { id } = useParams<{ id: string }>();
  const [room,    setRoom]    = useState<EventRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/rooms/event/${id}`)
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((d) => setRoom(d))
      .catch((status) => setError(status === 404 ? "Room not found for this event." : "Failed to load room."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-4 p-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="max-w-7xl mx-auto p-12 text-center">
        <p className="text-[var(--text-3)] text-sm">{error || "Room not found."}</p>
        <p className="text-[var(--text-3)] text-xs mt-2">Open a proposal and use the Room tab to create an event room.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-1)]">Event Room</h2>
          <p className="text-[var(--text-2)] text-sm mt-0.5">Manage this room's content and share the client link.</p>
        </div>
        <div className="flex items-center gap-2">
          <a href={`/room/${room.token}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-2)] hover:text-[var(--text-1)] text-sm transition-colors">
            <EyeIcon /> Preview Client View
          </a>
          <button
            onClick={() => navigator.clipboard.writeText(`${window.location.origin}/room/${room.token}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors">
            <LinkIcon /> Copy Client Link
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-4">
        <p className="text-[var(--text-1)] text-sm font-semibold mb-3">Visible sections for client</p>
        <div className="flex flex-wrap gap-2">
          {(["Proposal","Budget","Timeline","Vendors","Tasks","Payments","Approvals"] as const).map((s) => {
            const key = `show${s}` as keyof typeof room;
            const active = room[key] as boolean;
            return (
              <button key={s}
                onClick={() => setRoom((r) => r ? { ...r, [key]: !r[key] } : r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  active
                    ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400"
                    : "border-[var(--border)] text-[var(--text-3)]"
                }`}>
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
        <RoomShell room={room} readOnly={false} onRoomChange={setRoom} />
      </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
function LinkIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  );
}
