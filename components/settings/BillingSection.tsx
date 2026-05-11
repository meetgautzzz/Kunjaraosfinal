"use client";

import { useState, useEffect } from "react";
import { PLANS, getPlan, formatPrice, type PlanId, type Plan } from "@/lib/plans";
import { createClient } from "@/lib/supabase/client";

type UsageRow = {
  plan:           PlanId | null;
  proposals_used: number | null;
};

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && "Razorpay" in window) return resolve(true);
    if (document.getElementById("razorpay-script")) return resolve(true);
    const s = document.createElement("script");
    s.id = "razorpay-script";
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

const VISIBLE_PLANS = PLANS.filter((p) => p.id !== "basic");

export default function BillingSection() {
  const [usage,        setUsage]        = useState<UsageRow | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [annual,       setAnnual]       = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<PlanId | null>(null);
  const [toast,        setToast]        = useState<{ type: "success" | "error"; msg: string } | null>(null);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  }

  async function refreshUsage() {
    const supabase = createClient();
    if (!supabase) { setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("user_usage")
      .select("plan, proposals_used")
      .eq("user_id", user.id)
      .maybeSingle();

    setUsage(data as UsageRow ?? { plan: null, proposals_used: 0 });
    setLoading(false);
  }

  useEffect(() => { refreshUsage(); }, []);

  async function handleFreeStart() {
    setCheckoutPlan("free");
    try {
      const res  = await fetch("/api/auth/activate-free", { method: "POST", credentials: "include" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Could not activate free plan.");
      showToast("success", "Free plan activated.");
      await refreshUsage();
    } catch (e: unknown) {
      showToast("error", (e as Error).message ?? "Something went wrong.");
    } finally {
      setCheckoutPlan(null);
    }
  }

  async function handleSubscribe(plan: Plan) {
    if (plan.price === 0) { await handleFreeStart(); return; }

    setCheckoutPlan(plan.id);
    const sdkReady = await loadRazorpayScript();
    if (!sdkReady) {
      showToast("error", "Payment gateway failed to load. Check your connection.");
      setCheckoutPlan(null);
      return;
    }

    const orderRes = await fetch("/api/billing/create-order", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: plan.id, annual }),
    });
    const orderJson = await orderRes.json();
    if (!orderJson.success) {
      showToast("error", orderJson.error ?? "Failed to create order.");
      setCheckoutPlan(null);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rzp = new (window as any).Razorpay({
      key:         orderJson.key_id,
      amount:      orderJson.amount,
      currency:    orderJson.currency,
      order_id:    orderJson.order_id,
      name:        "Kunjara OS™",
      description: `${plan.name} Plan — ${annual ? "Annual" : "Monthly"}`,
      theme:       { color: "#6366f1" },
      config: {
        display: {
          blocks: {
            banks: {
              name: "Pay via UPI",
              instruments: [{ method: "upi", flows: ["collect", "intent", "qr"] }],
            },
          },
          sequence:    ["block.banks"],
          preferences: { show_default_blocks: true },
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handler: async (response: any) => {
        const verifyRes = await fetch("/api/billing/verify", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id:   response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature:  response.razorpay_signature,
          }),
        });
        const result = await verifyRes.json();
        if (result.success) {
          showToast("success", `Payment successful — ${plan.name} plan activated.`);
          await refreshUsage();
        } else {
          showToast("error", result.error ?? "Payment verification failed. Contact support if charged.");
        }
        setCheckoutPlan(null);
      },
      modal: { ondismiss: () => setCheckoutPlan(null) },
    });
    rzp.open();
  }

  const currentPlanId = usage?.plan ?? null;
  const currentPlan   = currentPlanId ? getPlan(currentPlanId) : null;
  const proposalsUsed = usage?.proposals_used ?? 0;
  const proposalLimit = currentPlan?.proposals ?? 2;

  return (
    <div className="space-y-8">
      <div style={{ marginBottom: 28 }}>
        <p className="t-title">Billing & Plans</p>
        <p className="t-body" style={{ marginTop: 4 }}>Simple, transparent pricing. Razorpay + UPI supported.</p>
      </div>

      {/* Current plan */}
      {loading ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 animate-pulse">
          <div className="h-5 w-40 bg-[var(--bg-card)] rounded" />
          <div className="h-4 w-60 bg-[var(--bg-card)] rounded mt-3" />
        </div>
      ) : (
        <CurrentPlanBanner
          plan={currentPlan}
          proposalsUsed={proposalsUsed}
          proposalLimit={proposalLimit}
        />
      )}

      {/* Monthly / annual toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setAnnual(false)}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            !annual ? "bg-indigo-500 text-white" : "text-[var(--text-2)] hover:text-[var(--text-1)]"
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setAnnual(true)}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            annual ? "bg-indigo-500 text-white" : "text-[var(--text-2)] hover:text-[var(--text-1)]"
          }`}
        >
          Annual
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
            Save 17%
          </span>
        </button>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {VISIBLE_PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            annual={annual}
            isCurrent={currentPlanId === plan.id}
            loading={checkoutPlan === plan.id}
            onSubscribe={() => handleSubscribe(plan)}
          />
        ))}
      </div>

      {/* Payment info */}
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { icon: "📱", title: "UPI Payments",  body: "Pay instantly via Google Pay, PhonePe, Paytm, or any UPI app. No card required." },
          { icon: "🇮🇳", title: "India First",   body: "GST-compliant invoicing. All payments in INR. Mumbai jurisdiction." },
          { icon: "🔒", title: "Secure",         body: "Processed by Razorpay with PCI-DSS Level 1 compliance. We never store card details." },
        ].map(({ icon, title, body }) => (
          <div key={title} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 flex items-start gap-3">
            <span className="text-xl shrink-0 mt-0.5">{icon}</span>
            <div>
              <p className="text-[var(--text-1)] text-xs font-semibold">{title}</p>
              <p className="text-[var(--text-3)] text-xs mt-1 leading-relaxed">{body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium max-w-md
          ${toast.type === "success"
            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
            : "bg-red-500/15 border-red-500/30 text-red-400"}`}
        >
          <span>{toast.type === "success" ? "✓" : "✗"}</span>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function CurrentPlanBanner({ plan, proposalsUsed, proposalLimit }: {
  plan: Plan | null;
  proposalsUsed: number;
  proposalLimit: number;
}) {
  const hasActivePlan = !!plan;
  const proposalsLeft = Math.max(0, proposalLimit - proposalsUsed);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 20h20M5 20V10l7-6 7 6v10"/><path d="M9 20v-5h6v5"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[var(--text-1)] font-bold">
              {hasActivePlan ? `${plan.name} Plan` : "No active plan"}
            </p>
            {hasActivePlan && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-emerald-500/15 text-emerald-400 border-emerald-500/20">
                Active
              </span>
            )}
          </div>
          <p className="text-[var(--text-3)] text-xs mt-0.5">
            {hasActivePlan
              ? `${plan.price === 0 ? "Free" : formatPrice(plan.price) + "/month"} · ${plan.proposals} proposals/month`
              : "Choose a plan below to start generating proposals."}
          </p>
        </div>
      </div>

      {hasActivePlan && (
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[var(--border)]">
          <Metric label="Proposals Left"  value={`${proposalsLeft}`}   accent={proposalsLeft > 0 ? "emerald" : "amber"} />
          <Metric label="Proposals Used"  value={`${proposalsUsed}`} />
          <Metric label="Monthly Limit"   value={`${proposalLimit}`} />
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: "emerald" | "amber" }) {
  return (
    <div>
      <p className="text-[var(--text-3)] text-xs">{label}</p>
      <p className={`text-sm font-semibold mt-0.5 tabular-nums ${
        accent === "emerald" ? "text-emerald-400" :
        accent === "amber"   ? "text-amber-400"   :
                               "text-[var(--text-1)]"
      }`}>
        {value}
      </p>
    </div>
  );
}

function PlanCard({ plan, annual, isCurrent, loading, onSubscribe }: {
  plan: Plan;
  annual: boolean;
  isCurrent: boolean;
  loading: boolean;
  onSubscribe: () => void;
}) {
  const isFree   = plan.price === 0;
  const price    = annual && !isFree ? plan.annualPrice : plan.price;
  const priceLbl = annual && !isFree ? "/mo, billed yearly" : "/mo";

  return (
    <div className={`relative rounded-2xl border p-5 flex flex-col gap-4 transition-all ${
      plan.highlighted
        ? "border-indigo-500/50 bg-indigo-500/5 shadow-[0_0_30px_rgba(99,102,241,0.1)]"
        : isCurrent
        ? "border-emerald-500/30 bg-emerald-500/5"
        : "border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--text-3)]/30"
    }`}>
      {plan.highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-indigo-500 text-white whitespace-nowrap">
            Most Popular
          </span>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between">
          <p className="text-[var(--text-1)] font-bold">{plan.name}</p>
          {isCurrent && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              Current
            </span>
          )}
        </div>
        <div className="mt-2">
          {isFree ? (
            <p className="text-[var(--text-1)] text-2xl font-black">Free</p>
          ) : (
            <div className="flex items-baseline gap-1">
              <p className="text-[var(--text-1)] text-2xl font-black">{formatPrice(price)}</p>
              <p className="text-[var(--text-3)] text-xs">{priceLbl}</p>
            </div>
          )}
          {annual && !isFree && (
            <p className="text-emerald-400 text-[11px] mt-1">
              {formatPrice(plan.annualPrice * 12)}/year
            </p>
          )}
        </div>
        <p className="text-[var(--text-3)] text-xs mt-2">
          {plan.proposals} proposals/month · {plan.users} user
        </p>
      </div>

      {isCurrent ? (
        <div className="w-full py-2.5 rounded-xl text-sm font-medium text-center text-emerald-400 border border-emerald-500/20 bg-emerald-500/5">
          ✓ Current plan
        </div>
      ) : (
        <button
          onClick={onSubscribe}
          disabled={loading}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
            plan.highlighted
              ? "bg-indigo-500 hover:bg-indigo-600 text-white"
              : "border border-[var(--border)] text-[var(--text-1)] hover:bg-[var(--bg-hover)]"
          } disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {loading ? <SpinnerIcon /> : isFree ? "Start for Free" : `Upgrade to ${plan.name}`}
        </button>
      )}

      <ul className="space-y-2 mt-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className={`text-xs mt-0.5 shrink-0 ${plan.highlighted ? "text-indigo-400" : "text-emerald-400"}`}>✓</span>
            <span className="text-[var(--text-2)] text-xs leading-snug">{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SpinnerIcon() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"/>
    </svg>
  );
}
