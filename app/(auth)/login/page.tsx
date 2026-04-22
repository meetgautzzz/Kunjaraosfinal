"use client";

import { Suspense, useEffect, useState } from "react";
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // OAuth error feedback lands here via ?err=...
  useEffect(() => {
    const err = params.get("err");
    if (!err) return;
    if (err === "oauth_failed") setError("Google sign-in failed. Try again.");
    else if (err === "missing_code") setError("Sign-in was cancelled.");
    else if (err === "unavailable") setError("Service unavailable. Try again shortly.");
  }, [params]);

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
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-white/10 bg-surface px-4 py-3 text-sm font-medium text-text-primary transition-colors hover:border-white/20 hover:bg-card disabled:cursor-not-allowed disabled:opacity-40"
        >
          <GoogleG />
          {loading ? "Opening Google..." : "Continue with Google"}
        </button>

        {error && (
          <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">
            {error}
          </p>
        )}

        <p className="mt-8 text-center text-[11px] text-text-secondary/60">
          By continuing you agree to our terms. More sign-in options coming soon.
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
