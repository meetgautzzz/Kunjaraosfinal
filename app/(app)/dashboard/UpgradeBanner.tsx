"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function UpgradeBanner() {
  const params = useSearchParams();
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (params.get("upgraded") === "1") {
      setShow(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("upgraded");
      router.replace(url.pathname);
      const t = setTimeout(() => setShow(false), 5000);
      return () => clearTimeout(t);
    }
  }, [params, router]);

  if (!show) return null;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-accent-blue/20 bg-accent-blue/8 px-5 py-4">
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="shrink-0 text-accent-blue">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      <div>
        <p className="text-sm font-semibold text-text-primary">Plan upgraded successfully</p>
        <p className="text-xs text-text-secondary">Your new limits are now active.</p>
      </div>
    </div>
  );
}
