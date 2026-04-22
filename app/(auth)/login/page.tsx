"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

type Step = "phone" | "otp";

const OTP_LIFETIME_S = 120;
const RESEND_COOLDOWN_S = 45;
const MAX_ATTEMPTS = 3;

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginInner />
    </Suspense>
  );
}

function LoginSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-8">
      <div className="w-full max-w-sm text-center text-sm text-text-secondary">
        Loading…
      </div>
    </div>
  );
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();

  const [tab, setTab] = useState<"google" | "phone">("google");
  const [step, setStep] = useState<Step>("phone");
  const [digits, setDigits] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [resendAt, setResendAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // OAuth error feedback lands here via ?err=...
  useEffect(() => {
    const err = params.get("err");
    if (!err) return;
    if (err === "oauth_failed") setError("Google sign-in failed. Try again.");
    else if (err === "missing_code") setError("Sign-in was cancelled.");
    else if (err === "unavailable") setError("Service unavailable. Try again shortly.");
  }, [params]);

  // Tick once a second so countdowns re-render without per-handler setInterval churn.
  useEffect(() => {
    if (step !== "otp") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [step]);

  const phone = `+91${digits}`;
  const otpRemaining = expiresAt ? Math.max(0, Math.ceil((expiresAt - now) / 1000)) : 0;
  const resendIn = resendAt ? Math.max(0, Math.ceil((resendAt - now) / 1000)) : 0;
  const canSubmitOtp = otp.length === 6 && attemptsLeft > 0 && otpRemaining > 0;

  async function handleGoogle() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    if (!supabase) {
      setError("Service unavailable.");
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
    if (error) {
      setError("Could not open Google sign-in.");
      setLoading(false);
    }
  }

  async function handleSendOtp() {
    if (!/^[6-9]\d{9}$/.test(digits)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Could not send code.");
        return;
      }
      setStep("otp");
      setOtp("");
      setAttemptsLeft(MAX_ATTEMPTS);
      setExpiresAt(Date.now() + OTP_LIFETIME_S * 1000);
      setResendAt(Date.now() + RESEND_COOLDOWN_S * 1000);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(codeOverride?: string) {
    const code = codeOverride ?? otp;
    if (code.length !== 6) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, token: code }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAttemptsLeft((n) => Math.max(0, n - 1));
        setError(json.error ?? "Incorrect code.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  function resetToPhone() {
    setStep("phone");
    setOtp("");
    setError(null);
    setExpiresAt(null);
    setResendAt(null);
    setAttemptsLeft(MAX_ATTEMPTS);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-text-secondary">
            Kunjara OS
          </p>
          <h1 className="mt-3 text-2xl font-bold text-text-primary">Sign in</h1>
          <p className="mt-1 text-sm text-text-secondary">Takes under 10 seconds</p>
        </div>

        {/* Google — primary */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-white/10 bg-surface px-4 py-3 text-sm font-medium text-text-primary transition-colors hover:border-white/20 hover:bg-card disabled:cursor-not-allowed disabled:opacity-40"
        >
          <GoogleG />
          Continue with Google
        </button>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/8" />
          <span className="text-[10px] font-medium uppercase tracking-widest text-text-secondary">
            or use phone
          </span>
          <div className="h-px flex-1 bg-white/8" />
        </div>

        {/* Phone — secondary */}
        {step === "phone" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendOtp();
            }}
            className="flex flex-col gap-3"
          >
            <div className="flex gap-2">
              <div className="flex items-center rounded-lg border border-white/8 bg-surface px-3 text-sm text-text-secondary">
                +91
              </div>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="98765 43210"
                value={digits}
                onChange={(e) => setDigits(e.target.value.replace(/\D/g, "").slice(0, 10))}
                maxLength={10}
                className="w-full rounded-lg border border-white/8 bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-white/20 focus:border-white/25 focus:outline-none"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading || digits.length !== 10}
              className="mt-1 w-full py-2.5"
            >
              {loading ? "Sending..." : "Send code"}
            </Button>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerifyOtp();
            }}
            className="flex flex-col gap-3"
          >
            <p className="text-xs text-text-secondary">
              Code sent to <span className="text-text-primary">+91 {digits}</span>{" "}
              <button
                type="button"
                onClick={resetToPhone}
                className="underline hover:text-text-primary"
              >
                change
              </button>
            </p>

            <Input
              label="6-digit code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="••••••"
              value={otp}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                setOtp(v);
                if (v.length === 6) void handleVerifyOtp(v);
              }}
              maxLength={6}
            />

            <div className="flex items-center justify-between text-xs text-text-secondary">
              <span>
                {otpRemaining > 0
                  ? `Expires in ${Math.floor(otpRemaining / 60)}:${String(otpRemaining % 60).padStart(2, "0")}`
                  : "Code expired"}
              </span>
              <span>
                {attemptsLeft > 0
                  ? `${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} left`
                  : "No attempts left"}
              </span>
            </div>

            {error && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">
                {error}
              </p>
            )}

            {attemptsLeft === 0 || otpRemaining === 0 ? (
              <Button type="button" onClick={resetToPhone} className="w-full py-2.5">
                Start again
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={loading || !canSubmitOtp}
                className="w-full py-2.5"
              >
                {loading ? "Verifying..." : "Verify"}
              </Button>
            )}

            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loading || resendIn > 0}
              className="mt-1 text-center text-xs text-text-secondary transition-colors hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.45c-.28 1.48-1.13 2.73-2.41 3.57v2.96h3.88c2.27-2.09 3.57-5.17 3.57-8.77z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-2.96c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.71-4.94H1.3v3.1C3.27 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.35c-.24-.72-.38-1.48-.38-2.35s.14-1.63.38-2.35V6.55H1.3C.47 8.2 0 10.05 0 12s.47 3.8 1.3 5.45l3.99-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.27 2.7 1.3 6.55l3.99 3.1C6.23 6.82 8.88 4.77 12 4.77z"
      />
    </svg>
  );
}
