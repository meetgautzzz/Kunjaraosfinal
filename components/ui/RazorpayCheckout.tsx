"use client";

import { useState } from "react";
import type { PlanId } from "@/lib/plans";

interface Props {
  planId: PlanId;
  planName: string;
  label?: string;
  className?: string;
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) return resolve(true);
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function RazorpayCheckout({ planId, planName, label = "Start Operating", className = "" }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setError("Failed to load payment gateway.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/billing/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planId }),
    });

    const json = await res.json();

    if (!json.success) {
      setError(json.error ?? "Failed to start checkout.");
      setLoading(false);
      return;
    }

    const options = {
      key: json.key_id,
      subscription_id: json.subscription_id,
      name: "Kunjara OS™",
      description: `${planName} Plan`,
      theme: { color: "#3A86FF" },
      handler: () => {
        window.location.href = "/dashboard?upgraded=1";
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleCheckout}
        disabled={loading}
        className={`flex w-full items-center justify-center rounded-xl py-2.5 text-sm font-semibold transition-all duration-150 disabled:opacity-50 ${className}`}
      >
        {loading ? "Loading..." : label}
      </button>
      {error && <p className="text-center text-xs text-red-400">{error}</p>}
    </div>
  );
}
