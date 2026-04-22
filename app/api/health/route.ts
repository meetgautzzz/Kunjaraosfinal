import { NextResponse } from "next/server";

// L1: unauthenticated healthcheck for external uptime monitors (UptimeRobot,
// BetterStack, etc.). Deliberately cheap — no DB round-trip, no secrets —
// so pages every minute are effectively free and can't leak diagnostic info
// to a scanner that stumbles onto the endpoint.
//
// Returns 200 with a small JSON body so monitors can assert on content, not
// just status. The `ts` field lets dashboards detect stale cached responses.
export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: "kunjara-os",
      ts: new Date().toISOString(),
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
