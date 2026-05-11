// Server-side GA4 Measurement Protocol.
// Requires NEXT_PUBLIC_GA_MEASUREMENT_ID + GA4_API_SECRET in env.
// Fails open: if either var is missing, the call is silently skipped.

const MP_ENDPOINT = "https://www.google-analytics.com/mp/collect";

export async function sendGA4Event(
  clientId: string,
  eventName: string,
  params: Record<string, string | number | boolean> = {},
): Promise<void> {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const apiSecret     = process.env.GA4_API_SECRET;
  if (!measurementId || !apiSecret) return;

  try {
    const res = await fetch(
      `${MP_ENDPOINT}?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          events: [{
            name: eventName,
            params: { engagement_time_msec: 1, ...params },
          }],
        }),
      },
    );
    if (!res.ok) {
      console.warn("[ga4] MP returned non-2xx", { eventName, status: res.status });
    }
  } catch (err) {
    console.warn("[ga4] Failed to send event", { eventName, err });
  }
}
