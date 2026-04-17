"use client";

import { useState } from "react";
import type { ProposalOutput, BudgetItem } from "@/lib/generateProposal";

interface Props {
  proposal: ProposalOutput;
  eventType: string;
  location: string;
  clientName?: string;
  onRegenerate?: () => void;
  regenerating?: boolean;
}

function buildText(proposal: ProposalOutput, eventType: string, location: string) {
  return [
    `EVENT PROPOSAL — ${eventType} | ${location}`,
    "",
    `CONCEPT\n${proposal.concept}`,
    `EVENT FLOW\n${proposal.event_flow.map((s, i) => `${i + 1}. ${s}`).join("\n")}`,
    `TECHNICAL SETUP\n${proposal.technical_setup.map((s) => `- ${s}`).join("\n")}`,
    `BUDGET\n${proposal.budget.map((b) => `${b.item}: ${b.cost}`).join("\n")}`,
    `ADD-ONS\n${proposal.add_ons.map((s) => `- ${s}`).join("\n")}`,
  ].join("\n\n");
}

const icons = {
  concept: (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  flow: (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h7" />
    </svg>
  ),
  tech: (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
    </svg>
  ),
  budget: (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  addons: (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  ),
};

export default function ProposalOutputPanel({ proposal, eventType, location, clientName, onRegenerate, regenerating }: Props) {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  async function handleCopy() {
    await navigator.clipboard.writeText(buildText(proposal, eventType, location));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Cover */}
      <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-br from-accent-purple/10 via-bg to-accent-blue/10 px-8 py-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent-purple/10 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-accent-blue/5 via-transparent to-transparent" />

        <div className="relative flex flex-col gap-6">
          {/* Top row */}
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">
              Kunjara Architect™
            </p>
            <div className="flex items-center gap-2">
              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  disabled={regenerating}
                  className="no-print flex items-center gap-1.5 rounded-lg border border-white/8 bg-bg/50 px-3 py-1.5 text-xs font-medium text-text-secondary backdrop-blur-sm transition-all duration-150 hover:border-white/15 hover:text-text-primary disabled:opacity-40"
                >
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className={regenerating ? "animate-spin" : ""}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {regenerating ? "Regenerating..." : "Regenerate"}
                </button>
              )}
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-bg/50 px-3 py-1.5 text-xs font-medium text-text-secondary backdrop-blur-sm transition-all duration-150 hover:border-white/15 hover:text-text-primary"
              >
                {copied ? (
                  <><svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Copied</>
                ) : (
                  <><svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy</>
                )}
              </button>
              <button
                onClick={handleCopyLink}
                className="no-print flex items-center gap-1.5 rounded-lg border border-white/8 bg-bg/50 px-3 py-1.5 text-xs font-medium text-text-secondary backdrop-blur-sm transition-all duration-150 hover:border-white/15 hover:text-text-primary"
              >
                {linkCopied ? (
                  <><svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Copied!</>
                ) : (
                  <><svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>Copy Link</>
                )}
              </button>
              <button
                onClick={() => window.print()}
                className="no-print flex items-center gap-1.5 rounded-lg border border-white/8 bg-bg/50 px-3 py-1.5 text-xs font-medium text-text-secondary backdrop-blur-sm transition-all duration-150 hover:border-white/15 hover:text-text-primary"
              >
                <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                Print
              </button>
            </div>
          </div>

          {/* Title block */}
          <div>
            <h2 className="text-3xl font-bold leading-tight tracking-tight text-text-primary">
              {eventType}
            </h2>
            <p className="mt-3 text-base italic text-text-secondary">
              "{proposal.tagline}"
            </p>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/8 pt-5">
            <Meta label="Location" value={location} />
            {clientName && <Meta label="Prepared for" value={clientName} />}
            <Meta label="Date" value={date} />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Event Type" value={eventType} />
        <SummaryCard label="Budget" value={proposal.budget.length > 0 ? proposal.budget[proposal.budget.length - 1].cost : "—"} />
        <SummaryCard label="Duration" value={proposal.duration} />
        <SummaryCard label="Location" value={location} />
      </div>

      {/* Key Highlights */}
      <div className="rounded-2xl border border-white/5 bg-surface px-6 py-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-text-secondary">Key Highlights</p>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {proposal.key_highlights.map((h, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-text-primary">
              <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent-blue/15 text-[10px] font-bold text-accent-blue">
                ✓
              </span>
              {h}
            </li>
          ))}
        </ul>
      </div>

      {/* Concept */}
      <Section label="Concept" icon={icons.concept}>
        <p className="text-sm leading-7 text-text-primary">{proposal.concept}</p>
      </Section>

      {/* Event Flow */}
      <Section label="Event Flow" icon={icons.flow}>
        <ol className="flex flex-col gap-3">
          {proposal.event_flow.map((step, i) => (
            <li key={i} className="flex gap-4">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/5 text-xs font-semibold text-text-secondary ring-1 ring-white/10">
                {i + 1}
              </span>
              <p className="pt-0.5 text-sm leading-6 text-text-primary">{step}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Technical Setup */}
      <Section label="Technical Setup" icon={icons.tech}>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {proposal.technical_setup.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-text-primary">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-blue/60" />
              {item}
            </li>
          ))}
        </ul>
      </Section>

      {/* Budget */}
      <Section label="Budget Breakdown" icon={icons.budget}>
        <BudgetTable items={proposal.budget} />
      </Section>

      {/* Add-ons */}
      <Section label="Optional Add-ons" icon={icons.addons}>
        <ul className="flex flex-col gap-2">
          {proposal.add_ons.map((item, i) => (
            <li key={i} className="flex items-start gap-3 rounded-lg border border-white/5 px-4 py-2.5 text-sm text-text-primary transition-colors duration-150 hover:border-white/10">
              <span className="mt-0.5 text-white/20">+</span>
              {item}
            </li>
          ))}
        </ul>
      </Section>

      {/* Footer */}
      <div className="flex items-center justify-center gap-2 py-2">
        <span className="h-px w-8 bg-white/8" />
        <p className="text-xs text-white/20">Generated with Kunjara OS™</p>
        <span className="h-px w-8 bg-white/8" />
      </div>

    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-white/5 bg-surface px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-widest text-text-secondary">{label}</p>
      <p className="text-sm font-semibold text-text-primary">{value}</p>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs font-medium uppercase tracking-widest text-text-secondary">{label}</p>
      <p className="text-sm text-text-primary">{value}</p>
    </div>
  );
}

function BudgetTable({ items }: { items: BudgetItem[] }) {
  const groups = items.reduce<Record<string, BudgetItem[]>>((acc, item) => {
    const cat = item.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const total = items
    .map((r) => parseFloat(r.cost.replace(/[^0-9.]/g, "")))
    .filter(Boolean)
    .reduce((a, b) => a + b, 0);

  const formatted = total
    ? total.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    : "—";

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(groups).map(([category, rows]) => (
        <div key={category}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-secondary">
            {category}
          </p>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-white/5">
              {rows.map((row, i) => (
                <tr key={i} className="group">
                  <td className="py-2.5 text-text-primary group-first:pt-0">{row.item}</td>
                  <td className="py-2.5 text-right tabular-nums text-text-secondary group-first:pt-0">
                    {row.cost}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <div className="flex items-center justify-between border-t border-white/10 pt-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
          Estimated Total
        </p>
        <p className="text-base font-bold text-text-primary tabular-nums">{formatted}</p>
      </div>
    </div>
  );
}

function Section({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-surface px-6 py-5 transition-colors duration-150 hover:border-white/8">
      <div className="mb-4 flex items-center gap-2.5 border-b border-white/5 pb-4">
        <span className="text-text-secondary">{icon}</span>
        <h3 className="text-sm font-bold text-text-primary">{label}</h3>
      </div>
      {children}
    </div>
  );
}
