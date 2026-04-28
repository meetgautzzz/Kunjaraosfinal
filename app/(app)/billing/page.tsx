"use client";

import { useState, useEffect } from "react";
import { PLANS, getPlan, formatPrice, type PlanId, type Plan } from "@/lib/plans";
import { CREDIT_PACKS } from "@/lib/creditPacks";
import { createClient } from "@/lib/supabase/client";

type UsageRow = {
  plan:          PlanId | null;
  events_used:   number | null;
  credits_added: number | null;
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

export default function BillingPage() {
  const [usage,   setUsage]   = useState<UsageRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [annual,  setAnnual]  = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<PlanId | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

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
      .select("plan, events_used, credits_added")
      .eq("user_id", user.id)
      .maybeSingle();

    setUsage(data as UsageRow ?? { plan: null, events_used: 0, credits_added: 0 });
    setLoading(false);
  }

  useEffect(() => { refreshUsage(); }, []);

  async function handleSubscribe(plan: Plan) {
    setCheckoutPlan(plan.id);
    const sdkReady = await loadRazorpayScript();
    if (!sdkReady) {
      showToast("error", "Payment gateway failed to load. Check your connection.");
      setCheckoutPlan(null);
      return;
    }

    // 1. Create Razorpay order server-side
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

    // 2. Open Razorpay Checkout
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
          const msg = result.credited
            ? `Payment successful — ${plan.name} plan activated with ${result.credits} AI credits.`
            : `Payment received — ${result.credits} AI credits applying in a few seconds.`;
          showToast("success", msg);
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
  const creditsAdded  = usage?.credits_added ?? 0;
  const eventsUsed    = usage?.events_used ?? 0;
  const creditsLeft   = Math.max(0, creditsAdded - eventsUsed);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-1)]">Billing & Plans</h2>
        <p className="text-[var(--text-2)] text-sm mt-1">
          Simple, transparent pricing. Razorpay + UPI supported.
        </p>
      </div>

      {/* Launch offer banner */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 px-5 py-3 flex items-center gap-3">
        <span className="text-xl shrink-0">🎉</span>
        <p className="text-amber-300 text-sm font-semibold">
          Launch Offer — 2× AI Credits on all plans. Limited time only.
        </p>
      </div>

      {/* Current subscription state */}
      {loading ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 animate-pulse">
          <div className="h-5 w-40 bg-[var(--bg-surface)] rounded" />
          <div className="h-4 w-60 bg-[var(--bg-surface)] rounded mt-3" />
        </div>
      ) : (
        <CurrentPlanBanner
          plan={currentPlan}
          creditsAdded={creditsAdded}
          eventsUsed={eventsUsed}
          creditsLeft={creditsLeft}
        />
      )}

      {/* Monthly/annual toggle */}
      <div className="flex items-center justify-center gap-3">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto w-full">
        {PLANS.filter((p) => !p.dev).map((plan) => (
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

      {/* Credit top-ups */}
      <div>
        <div className="mb-4">
          <h3 className="text-[var(--text-1)] text-base font-bold">Need more AI power?</h3>
          <p className="text-[var(--text-3)] text-sm mt-1">Top up credits any time — no plan change required.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {CREDIT_PACKS.map((pack) => (
            <div key={pack.id} className={`rounded-2xl border p-4 flex items-center justify-between gap-4 ${
              pack.id === "medium"
                ? "border-indigo-500/30 bg-indigo-500/5"
                : "border-[var(--border)] bg-[var(--bg-card)]"
            }`}>
              <div>
                <p className="text-[var(--text-1)] font-bold text-lg tabular-nums">
                  {pack.credits.toLocaleString("en-IN")}
                  <span className="text-[var(--text-3)] text-xs font-normal ml-1">credits</span>
                </p>
                <p className="text-[var(--text-3)] text-xs mt-0.5">
                  ₹{(pack.amountInr / pack.credits).toFixed(1)} per credit
                </p>
              </div>
              <p className="text-[var(--text-1)] font-bold text-base tabular-nums shrink-0">
                ₹{pack.amountInr.toLocaleString("en-IN")}
              </p>
            </div>
          ))}
        </div>
        <p className="text-[var(--text-3)] text-xs mt-3">
          Buy credits from the ⚡ top-up button on any page.
        </p>
      </div>

      <PaymentInfo />

      <DevSection
        plans={PLANS.filter((p) => p.dev)}
        loadingPlan={checkoutPlan}
        onSubscribe={handleSubscribe}
      />

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

// ── Current plan banner ───────────────────────────────────────────────────────

function CurrentPlanBanner({ plan, creditsAdded, eventsUsed, creditsLeft }: {
  plan: Plan | null;
  creditsAdded: number;
  eventsUsed: number;
  creditsLeft: number;
}) {
  const isFree = !plan || creditsAdded === 0;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0">
          <CrownIcon />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[var(--text-1)] font-bold text-lg">
              {isFree ? "No active plan" : `${plan.name} Plan`}
            </p>
            {!isFree && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-emerald-500/15 text-emerald-400 border-emerald-500/20">
                Active
              </span>
            )}
          </div>
          <p className="text-[var(--text-3)] text-sm mt-0.5">
            {isFree
              ? "Choose a plan below to start generating proposals."
              : `${formatPrice(plan.price)}/month · ${plan.proposals} proposals · ${plan.credits.toLocaleString("en-IN")} AI credits`}
          </p>
        </div>
      </div>

      {!isFree && (
        <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-[var(--border)]">
          <Metric label="Credits Left"    value={`${creditsLeft}`}  accent={creditsLeft > 0 ? "emerald" : "amber"} hint="Available to spend on AI features" />
          <Metric label="Credits Used"    value={`${eventsUsed}`}   hint="Total credits consumed across all AI actions" />
          <Metric label="Credits Bought"  value={`${creditsAdded}`} hint="Total credits added to your account" />
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, accent, hint }: { label: string; value: string; accent?: "emerald" | "amber"; hint?: string }) {
  return (
    <div title={hint}>
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

// ── Plan card ─────────────────────────────────────────────────────────────────

function PlanCard({ plan, annual, isCurrent, loading, onSubscribe }: {
  plan: Plan;
  annual: boolean;
  isCurrent: boolean;
  loading: boolean;
  onSubscribe: () => void;
}) {
  const price    = annual ? plan.annualPrice : plan.price;
  const priceLbl = annual ? "/mo, billed yearly" : "/mo";

  return (
    <div className={`relative rounded-2xl border p-5 flex flex-col gap-4 transition-all ${
      plan.highlighted
        ? "border-indigo-500/50 bg-indigo-500/5 shadow-[0_0_30px_rgba(99,102,241,0.1)]"
        : isCurrent
        ? "border-emerald-500/30 bg-emerald-500/5"
        : "border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--text-3)]/30"
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
          <p className="text-[var(--text-1)] font-bold text-base">{plan.name}</p>
          {isCurrent && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              Current
            </span>
          )}
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-1">
            <p className="text-[var(--text-1)] text-2xl font-black">{formatPrice(price)}</p>
            <p className="text-[var(--text-3)] text-xs">{priceLbl}</p>
          </div>
          {annual && (
            <p className="text-emerald-400 text-[11px] mt-1">
              {formatPrice(plan.annualPrice * 12)}/year
            </p>
          )}
        </div>
        <p className="text-[var(--text-3)] text-xs mt-2">
          {plan.proposals} proposals · {plan.credits.toLocaleString("en-IN")} AI credits · {plan.users} user
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
          {loading ? <SpinnerIcon /> : plan.highlighted ? "Upgrade to Pro" : "Subscribe"}
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

// ── Dev section (test plan, hidden from public grid) ─────────────────────────

function DevSection({ plans, loadingPlan, onSubscribe }: {
  plans: Plan[];
  loadingPlan: PlanId | null;
  onSubscribe: (plan: Plan) => void;
}) {
  if (plans.length === 0) return null;
  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-black">DEV</span>
        <p className="text-[var(--text-1)] text-sm font-semibold">Internal test plans</p>
      </div>
      <p className="text-[var(--text-3)] text-xs mb-4">
        Real Razorpay charges. Used to verify the end-to-end pay → webhook → credit flow without burning ₹1999.
      </p>
      <div className="flex flex-wrap gap-3">
        {plans.map((plan) => (
          <button
            key={plan.id}
            onClick={() => onSubscribe(plan)}
            disabled={loadingPlan === plan.id}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-colors disabled:opacity-60"
          >
            {loadingPlan === plan.id ? "Opening…" : `Pay ${formatPrice(plan.price)} — ${plan.name} (${plan.credits} AI credits)`}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Payment info ──────────────────────────────────────────────────────────────

function PaymentInfo() {
  return (
    <div className="grid sm:grid-cols-3 gap-4">
      {[
        { icon: "📱", title: "UPI Payments", body: "Pay instantly via Google Pay, PhonePe, Paytm, or any UPI app. No card required." },
        { icon: "🇮🇳", title: "India First",   body: "GST-compliant invoicing. All payments in INR. Mumbai jurisdiction." },
        { icon: "🔒", title: "Secure",         body: "Processed by Razorpay with PCI-DSS Level 1 compliance. We never store card details." },
      ].map(({ icon, title, body }) => (
        <div key={title} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 flex items-start gap-3">
          <span className="text-xl shrink-0 mt-0.5">{icon}</span>
          <div>
            <p className="text-[var(--text-1)] text-sm font-semibold">{title}</p>
            <p className="text-[var(--text-3)] text-xs mt-1 leading-relaxed">{body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function CrownIcon() {
  return (
    <svg className="w-6 h-6 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20h20M5 20V10l7-6 7 6v10"/>
      <path d="M9 20v-5h6v5"/>
    </svg>
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
