import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseJson } from "@/lib/validate";
import {
  ipFromRequest,
  limit,
  otpSendIpLimiter,
  otpSendLimiter,
} from "@/lib/ratelimit";

// India-first: +91 followed by a 10-digit mobile starting with 6-9.
// Reject anything else at the edge so we never burn SMS budget on garbage.
const BodySchema = z.object({
  phone: z
    .string()
    .regex(/^\+91[6-9]\d{9}$/, "Enter a valid Indian mobile number."),
});

export async function POST(req: NextRequest) {
  const body = await parseJson(req, BodySchema);
  if (body.error) return body.error;
  const { phone } = body.data;

  // Per-phone cooldown (prevents SMS-bomb on a single number) AND
  // per-IP burst cap (prevents one attacker from cycling phones to bomb
  // many numbers at once). Both must pass.
  const byPhone = await limit(otpSendLimiter, `phone:${phone}`);
  if (byPhone) return byPhone;

  const byIp = await limit(otpSendIpLimiter, `ip:${ipFromRequest(req)}`);
  if (byIp) return byIp;

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
  }

  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: { channel: "sms" },
  });

  if (error) {
    // Log server-side only — never echo Supabase's message to the client,
    // which can reveal whether the number is provider-valid.
    console.error("[otp/send] Supabase error:", error.message);
    return NextResponse.json(
      { error: "Could not send code. Try again in a minute." },
      { status: 502 }
    );
  }

  // Client uses expiresInSeconds to drive the countdown + resend button.
  return NextResponse.json({ ok: true, expiresInSeconds: 120 });
}
