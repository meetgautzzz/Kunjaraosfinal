"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const trimmed = email.trim();
    if (!trimmed || !password || !confirm) {
      setError("Fill all fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: trimmed,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      setLoading(false);
      if (error.message.toLowerCase().includes("registered")) {
        setError("That email is already registered. Sign in instead.");
      } else {
        setError("Could not create account. Try again.");
      }
      return;
    }

    // If email confirmation is enabled on the Supabase project, session is
    // null and the user must click the link in their inbox. If confirmation
    // is disabled, session is populated and we can redirect straight in.
    if (data.session) {
      router.push("/dashboard");
      return;
    }

    setLoading(false);
    setInfo("Account created. Check your inbox to confirm your email, then sign in.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-text-secondary">
            Kunjara OS
          </p>
          <h1 className="mt-3 text-2xl font-bold text-text-primary">Create account</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Your first 2 proposals are on us.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg border border-white/10 bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-white/30 focus:outline-none disabled:opacity-40"
          />
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg border border-white/10 bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-white/30 focus:outline-none disabled:opacity-40"
          />
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg border border-white/10 bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-white/30 focus:outline-none disabled:opacity-40"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-text-primary px-4 py-3 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        {error && (
          <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">
            {error}
          </p>
        )}

        {info && (
          <p className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-400">
            {info}
          </p>
        )}

        <p className="mt-6 text-center text-xs text-text-secondary">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
