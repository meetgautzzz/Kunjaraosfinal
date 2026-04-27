"use client";

// Public client-facing Event Room view.
// Accessed via the share link the organiser copies from the Event Room page.
// No auth required — the token is the access credential.

import { use } from "react";
import RoomShell from "@/components/room/RoomShell";
import { MOCK_ROOM } from "@/lib/room";

export default function ClientRoomPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  // TODO: replace with real API call once room backend is built:
  // const room = await fetch(`/api/rooms/public/${token}`).then(r => r.json())
  const room = { ...MOCK_ROOM, token };

  return (
    <div
      style={{ minHeight: "100vh", background: "var(--bg-base)", color: "var(--text-1)" }}
    >
      <RoomShell room={room} readOnly={true} />
    </div>
  );
}
