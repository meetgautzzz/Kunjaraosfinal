"use client";

import { useState } from "react";
import { PLANS, formatPrice } from "@/lib/plans";
import Container from "@/components/ui/Container";
import RazorpayCheckout from "@/components/ui/RazorpayCheckout";

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <main className="min-h-screen py-24">
      <Container size="lg">

        {/* Test Plan Banner */}
        <div className="mb-10 mx-auto max-w-sm rounded-2xl border border-accent-blue/30 bg-accent-blue/8 px-6 py-5 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-accent-blue">Testing Mode</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">Test Plan <span className="text-accent-blue">₹1</span></p>
          <p className="mt-1 text-sm text-text-secondary">Includes 10 proposals</p>
          <div className="mt-4">
            <RazorpayCheckout
              planId="test"
              planName="Test Plan"
              label="Pay ₹1 to Test"
              className="bg-gradient-to-r from-accent-purple to-accent-blue text-white hover:opacity-85"
            />
          </div>
        </div>

        {/* Header */}
        <div className="mb-16 text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">
            Pricing
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
            Plans that scale with you
          </h1>
          <p className="mt-4 text-base text-text-secondary">
            Every plan includes AI proposals, PDF export, and overage at ₹199/proposal.
          </p>

          {/* Toggle */}
          <div className="mt-10 inline-flex items-center gap-4 rounded-2xl border border-white/8 bg-surface px-5 py-3">
            <button
              onClick={() => setAnnual(false)}
              className={`text-sm font-medium transition-colors duration-150 ${!annual ? "text-text-primary" : "text-text-secondary"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative h-6 w-10 rounded-full transition-colors duration-200 ${annual ? "bg-accent-blue" : "bg-white/12"}`}
              aria-label="Toggle annual billing"
            >
              <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${annual ? "translate-x-5" : "translate-x-1"}`} />
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`flex items-center gap-2 text-sm font-medium transition-colors duration-150 ${annual ? "text-text-primary" : "text-text-secondary"}`}
            >
              Annual
              <span className="rounded-full bg-accent-blue/15 px-2 py-0.5 text-xs font-semibold text-accent-blue">
                2 months free
              </span>
            </button>
          </div>
        </div>

        {/* Plan grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border transition-colors duration-150 ${
                plan.highlighted
                  ? "border-accent-blue/50 bg-gradient-to-b from-accent-blue/10 via-surface to-surface shadow-[0_0_40px_-12px_rgba(58,134,255,0.25)]"
                  : "border-white/8 bg-surface hover:border-white/15"
              } ${plan.comingSoon ? "opacity-60" : ""}`}
            >
              {plan.highlighted && (
                <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-blue/60 to-transparent" />
              )}
              {plan.highlighted && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent-blue px-3 py-1 text-xs font-semibold text-white">
                  Most Popular
                </span>
              )}
              {plan.comingSoon && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/15 bg-surface px-3 py-1 text-xs font-semibold text-text-secondary">
                  Coming Soon
                </span>
              )}

              <div className="flex flex-1 flex-col p-6">
                {/* Plan name + price */}
                <div className="mb-6 border-b border-white/5 pb-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-text-secondary">
                    {plan.name}
                  </p>
                  <div className="mt-3 flex items-end gap-1">
                    <span className="text-3xl font-bold tracking-tight text-text-primary">
                      {formatPrice(annual ? plan.annualPrice : plan.price)}
                    </span>
                    <span className="mb-1 text-sm text-text-secondary">/mo</span>
                  </div>
                  {annual ? (
                    <p className="mt-1 text-xs text-text-secondary">
                      Billed {formatPrice(plan.annualPrice * 12)}/yr
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-text-secondary">Billed monthly</p>
                  )}
                </div>

                {/* Limits */}
                <div className="mb-6 flex flex-col gap-2.5">
                  <Limit label="Proposals" value={`${plan.events} / month`} />
                  <Limit label="Users" value={`${plan.users} user${plan.users > 1 ? "s" : ""}`} />
                  <Limit label="Storage" value={plan.storage} />
                  {plan.leads && <Limit label="Qualified Leads" value={`${plan.leads} / month`} highlight />}
                </div>

                {/* Features */}
                <ul className="mb-8 flex flex-col gap-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-text-secondary">
                      <svg
                        className={`mt-0.5 shrink-0 ${plan.highlighted ? "text-accent-blue" : "text-white/30"}`}
                        width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="mt-auto">
                  {plan.comingSoon ? (
                    <button
                      disabled
                      className="flex w-full cursor-not-allowed items-center justify-center rounded-xl border border-white/8 bg-white/5 py-2.5 text-sm font-semibold text-text-secondary opacity-60"
                    >
                      Coming Soon
                    </button>
                  ) : (
                    <RazorpayCheckout
                      planId={plan.id}
                      planName={plan.name}
                      annual={annual}
                      className={
                        plan.highlighted
                          ? "bg-gradient-to-r from-accent-purple to-accent-blue text-white hover:opacity-85"
                          : "border border-white/10 bg-bg text-text-primary hover:border-white/20 hover:bg-card"
                      }
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer notes */}
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <div className="flex flex-wrap justify-center gap-6 text-xs text-text-secondary">
            <span>✦ No setup fees</span>
            <span>✦ Cancel anytime</span>
            <span>✦ Overage at ₹199 / proposal</span>
            <span>✦ Annual billing = 2 months free</span>
          </div>
        </div>

      </Container>
    </main>
  );
}

function Limit({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-text-secondary">{label}</span>
      <span className={`text-xs font-semibold ${highlight ? "text-accent-blue" : "text-text-primary"}`}>
        {value}
      </span>
    </div>
  );
}
