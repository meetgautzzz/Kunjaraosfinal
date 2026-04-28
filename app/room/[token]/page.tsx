"use client";

// Public client-facing Event Room view.
// Accessed via the share link the organiser copies from the Event Room page.
// No auth required — the token is the access credential.

import { use } from "react";
import { useState, useEffect } from "react";
import RoomShell from "@/components/room/RoomShell";
import type { EventRoom } from "@/lib/room";

export default function ClientRoomPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [room,    setRoom]    = useState<EventRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`/api/rooms/public/${token}`)
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((d) => setRoom(d))
      .catch((status) => setError(status === 404 ? "This room link is invalid or has expired." : "Failed to load room."))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--text-3)", fontSize: 14 }}>Loading event room…</p>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <p style={{ color: "var(--text-2)", fontSize: 16, fontWeight: 600 }}>Room not found</p>
        <p style={{ color: "var(--text-3)", fontSize: 13 }}>{error || "This link is invalid or has expired."}</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", color: "var(--text-1)" }}>
      <RoomShell room={room} readOnly={true} />
    </div>
  );
}
