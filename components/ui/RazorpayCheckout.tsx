"use client";

import { useState } from "react";
import type { PlanId } from "@/lib/plans";

interface Props {
  planId: PlanId | "test";
  planName: string;
  annual?: boolean;
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

export default function RazorpayCheckout({
  planId,
  planName,
  annual = false,
  label = "Start Operating",
  className = "",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setError("Failed to load payment gateway.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/billing/create-order", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planId, annual }),
    });

    const json = await res.json();

    if (!json.success) {
      setError(json.error ?? "Failed to create order.");
      setLoading(false);
      return;
    }

    const options = {
      key: json.key_id,
      amount: json.amount,
      currency: json.currency,
      order_id: json.order_id,
      name: "Kunjara OS™",
      description: `${planName} Plan`,
      theme: { color: "#3A86FF" },
      handler: async function (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) {
        console.log("Payment response (full):", JSON.stringify(response));

        const res = await fetch("/api/billing/verify", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            amount: json.amount,
            plan: planId,
          }),
        });

        const result = await res.json();
        if (result.success) {
          const msg = `Payment successful — ${result.credits} proposals added`;
          alert(msg);
          setSuccess(msg);
        } else {
          setError("Payment verification failed: " + (result.error ?? "Unknown error"));
        }
        setLoading(false);
      },
      modal: {
        ondismiss: () => setLoading(false),
      },
    };

    console.log("Razorpay options:", {
      key: json.key_id,
      order_id: json.order_id,
      amount: json.amount,
    });
    console.log("Opening Razorpay");
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
      {success && <p className="text-center text-xs text-green-400">{success}</p>}
    </div>
  );
}
