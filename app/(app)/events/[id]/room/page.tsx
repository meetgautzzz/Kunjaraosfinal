"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import RoomShell from "@/components/room/RoomShell";
import { MOCK_ROOM } from "@/lib/room";

export default function OrganizerRoomPage() {
  const { id } = useParams();
  // Real: const room = await api.get(`/rooms/event/${id}`)
  const [room, setRoom] = useState(MOCK_ROOM);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Organizer toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-1)]">Event Room</h2>
          <p className="text-[var(--text-2)] text-sm mt-0.5">
            Manage this room's content and share the client link.
          </p>
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

      {/* Section visibility toggles */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-4">
        <p className="text-[var(--text-1)] text-sm font-semibold mb-3">Visible sections for client</p>
        <div className="flex flex-wrap gap-2">
          {(["Proposal","Budget","Timeline","Vendors","Tasks","Payments","Approvals"] as const).map((s) => {
            const key = `show${s}` as keyof typeof room;
            const active = room[key] as boolean;
            return (
              <button key={s}
                onClick={() => setRoom((r) => ({ ...r, [key]: !r[key] }))}
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

      {/* Room content */}
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
