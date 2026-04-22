import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseJson } from "@/lib/validate";
import { limit, otpVerifyLimiter } from "@/lib/ratelimit";

const BodySchema = z.object({
  phone: z.string().regex(/^\+91[6-9]\d{9}$/),
  token: z.string().regex(/^\d{6}$/, "6-digit code only."),
});

export async function POST(req: NextRequest) {
  const body = await parseJson(req, BodySchema);
  if (body.error) return body.error;
  const { phone, token } = body.data;

  // Hard cap on guesses per phone per OTP lifetime. Runs BEFORE Supabase
  // so our ceiling holds even if Supabase's own throttles are slow to
  // refresh. At 3 attempts per 2 min, brute-force odds = 3 / 10^6.
  const rl = await limit(otpVerifyLimiter, `phone:${phone}`);
  if (rl) return rl;

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
  }

  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: "sms",
  });

  if (error || !data.session) {
    // Generic message on purpose — don't reveal whether the failure was
    // wrong code, expired code, or unknown phone.
    return NextResponse.json(
      { error: "Incorrect or expired code." },
      { status: 401 }
    );
  }

  // verifyOtp on the server client sets session cookies through our
  // cookie adapter in lib/supabase/server.ts. No further work needed;
  // the session is live on the returned response.
  return NextResponse.json({ ok: true });
}
