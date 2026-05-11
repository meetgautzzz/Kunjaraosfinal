"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  useEffect(() => {
    const err = params.get("err");
    if (!err) return;
    if (err === "oauth_failed") setError("Google sign-in failed. Try again, or use email below.");
    else if (err === "missing_code") setError("Sign-in was cancelled.");
    else if (err === "unavailable") setError("Service temporarily unavailable. Try again shortly.");
    else setError("Sign-in failed. Try again.");
  }, [params]);

  async function handleGoogle() {
    setGoogleLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const next = params.get("next") ?? "/dashboard";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) {
        // Surfaces in browser devtools so prod issues can be traced from
        // a user's screen-share without needing to repro server-side.
        console.error("[login] Google OAuth start failed:", error.message);
        setError("Could not open Google sign-in. Check that pop-ups aren't blocked, or use email below.");
        setGoogleLoading(false);
      }
      // On success the browser is redirected away; loading stays true on
      // purpose so the button can't be re-clicked during the redirect.
    } catch (err) {
      // signInWithOAuth can throw on network failure, missing supabase
      // config, or unexpected errors — none of which set the {error}
      // return field. Without this catch the button would stay disabled
      // forever and the user would see no message.
      console.error("[login] Google OAuth threw:", err);
      setError("Could not reach Google. Check your connection and try again.");
      setGoogleLoading(false);
    }
  }

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Enter email and password.");
      return;
    }

    setEmailLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setEmailLoading(false);
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setError("Check your inbox for a confirmation link before signing in.");
      } else {
        setError("Incorrect email or password.");
      }
      return;
    }

    const next = params.get("next") ?? "/dashboard";
    window.location.href = next;
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

        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading || emailLoading}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-white/10 bg-surface px-4 py-3 text-sm font-medium text-text-primary transition-colors hover:border-white/20 hover:bg-card disabled:cursor-not-allowed disabled:opacity-40"
        >
          <GoogleG />
          {googleLoading ? "Opening Google..." : "Continue with Google"}
        </button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-[11px] uppercase tracking-widest text-text-secondary/60">
            or
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={handleEmailSignIn} className="space-y-3">
          <input
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            aria-label="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={googleLoading || emailLoading}
            className="w-full rounded-lg border border-white/10 bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-white/30 focus:outline-none disabled:opacity-40"
          />
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            aria-label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={googleLoading || emailLoading}
            className="w-full rounded-lg border border-white/10 bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-white/30 focus:outline-none disabled:opacity-40"
          />
          <button
            type="submit"
            disabled={googleLoading || emailLoading}
            className="w-full rounded-lg bg-text-primary px-4 py-3 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {emailLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {error && (
          <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">
            {error}
          </p>
        )}

        <p className="mt-6 text-center text-xs text-text-secondary">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-text-primary hover:underline">
            Sign up
          </Link>
        </p>

        <p className="mt-8 text-center text-[11px] text-text-secondary/60">
          By continuing you agree to our terms.
        </p>
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
