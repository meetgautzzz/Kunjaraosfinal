"use client";

import { useState } from "react";
import type { ProposalOutput, BudgetItem } from "@/lib/generateProposal";
import { formatINR } from "@/lib/proposals";

interface Props {
  proposal: ProposalOutput;
  eventType: string;
  location: string;
  clientName?: string;
  onRegenerate?: () => void;
  regenerating?: boolean;
}

function buildText(proposal: ProposalOutput, eventType: string, location: string) {
  const lines: string[] = [`EVENT PROPOSAL — ${eventType} | ${location}`, ""];

  lines.push(`CONCEPT\n${proposal.concept}`);

  if (proposal.visual_stage) {
    const vs = proposal.visual_stage;
    lines.push(`VISUAL & STAGE DESIGN\nTheme: ${vs.theme}\nStage: ${vs.stage}\nDecor: ${vs.decor?.join(", ")}\nReferences: ${vs.references?.join(", ")}`);
  }

  if (proposal.activation?.length) lines.push(`ACTIVATION\n${proposal.activation.map((s) => `- ${s}`).join("\n")}`);
  if (proposal.experience?.length) lines.push(`EXPERIENCE\n${proposal.experience.map((s) => `- ${s}`).join("\n")}`);

  const timeline = proposal.timeline ?? proposal.event_flow;
  if (timeline?.length) lines.push(`TIMELINE\n${timeline.map((s, i) => `${i + 1}. ${s}`).join("\n")}`);

  if (proposal.vendors?.length) lines.push(`VENDORS\n${proposal.vendors.map((v) => `${v.name}: ${v.role}`).join("\n")}`);
  if (proposal.budget?.length)  lines.push(`BUDGET\n${proposal.budget.map((b) => `${b.item}: ${b.cost}`).join("\n")}`);
  if (proposal.risks?.length)   lines.push(`RISK & TIPS\n${proposal.risks.map((s) => `- ${s}`).join("\n")}`);
  if (proposal.compliance?.length) lines.push(`COMPLIANCE\n${proposal.compliance.map((s) => `- ${s}`).join("\n")}`);

  return lines.join("\n\n");
}

// ── Collapsible section ───────────────────────────────────────────────────────

function Section({
  label, icon, children, defaultOpen = false,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-white/5 bg-surface overflow-hidden transition-colors duration-150 hover:border-white/8">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-text-secondary">{icon}</span>
          <span className="text-sm font-semibold text-text-primary">{label}</span>
        </div>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-white/5">
          <div className="pt-4">{children}</div>
        </div>
      )}
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="text-text-secondary shrink-0 transition-transform duration-200"
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

// ── Bullet list ───────────────────────────────────────────────────────────────

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-sm text-text-primary">
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent-blue/50 shrink-0" />
          {item}
        </li>
      ))}
    </ul>
  );
}

// ── Main output ───────────────────────────────────────────────────────────────

export default function ProposalOutputPanel({
  proposal, eventType, location, clientName, onRegenerate, regenerating,
}: Props) {
  const [copied,     setCopied]     = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const date = new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });

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

  // Backward compat: use timeline if present, else fall back to event_flow
  const timeline    = proposal.timeline    ?? proposal.event_flow    ?? [];
  const risks       = proposal.risks       ?? [];
  const activation  = proposal.activation  ?? [];
  const experience  = proposal.experience  ?? [];
  const compliance  = proposal.compliance  ?? [];
  const vendors     = proposal.vendors     ?? [];
  const visualStage = proposal.visual_stage;

  return (
    <div className="flex flex-col gap-3">

      {/* ── Cover ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-br from-accent-purple/10 via-bg to-accent-blue/10 px-6 py-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent-purple/10 via-transparent to-transparent" />

        <div className="relative flex flex-col gap-5">
          {/* Action bar */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">
              Kunjara Architect™
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {onRegenerate && (
                <ActionButton onClick={onRegenerate} disabled={regenerating} className="no-print">
                  <RefreshIcon spinning={regenerating} />
                  {regenerating ? "Regenerating…" : "Regenerate"}
                </ActionButton>
              )}
              <ActionButton onClick={handleCopy}>
                {copied ? <><CheckIcon />Copied</> : <><CopyIcon />Copy</>}
              </ActionButton>
              <ActionButton onClick={handleCopyLink} className="no-print">
                {linkCopied ? <><CheckIcon />Copied!</> : <><LinkIcon />Copy Link</>}
              </ActionButton>
              <ActionButton onClick={() => window.print()} className="no-print">
                <PrintIcon />Print
              </ActionButton>
            </div>
          </div>

          {/* Title */}
          <div>
            <h2 className="text-2xl font-bold leading-tight tracking-tight text-text-primary">
              {eventType}
            </h2>
            {proposal.tagline && (
              <p className="mt-2 text-sm italic text-text-secondary">"{proposal.tagline}"</p>
            )}
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/8 pt-4">
            <Meta label="Location" value={location} />
            {clientName && <Meta label="Prepared for" value={clientName} />}
            <Meta label="Duration"  value={proposal.duration ?? "—"} />
            <Meta label="Date"      value={date} />
          </div>
        </div>
      </div>

      {/* ── Key Highlights ─────────────────────────────────────────────────── */}
      {proposal.key_highlights?.length > 0 && (
        <div className="rounded-xl border border-white/5 bg-surface px-5 py-4">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-text-secondary">
            Key Highlights
          </p>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {proposal.key_highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-text-primary">
                <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent-blue/15 text-[9px] font-bold text-accent-blue">
                  ✓
                </span>
                {h}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Section 1: Concept ────────────────────────────────────────────── */}
      <Section label="Concept" icon={<ConceptIcon />} defaultOpen>
        <p className="text-sm leading-7 text-text-primary">{proposal.concept}</p>
      </Section>

      {/* ── Section 2: Visual & Stage Design ─────────────────────────────── */}
      {visualStage && (
        <Section label="Visual & Stage Design" icon={<VisualIcon />} defaultOpen>
          <div className="flex flex-col gap-4">
            {visualStage.theme && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary mb-1.5">
                  Visual Theme
                </p>
                <p className="text-sm text-text-primary leading-6">{visualStage.theme}</p>
              </div>
            )}
            {visualStage.stage && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary mb-1.5">
                  Stage Design
                </p>
                <p className="text-sm text-text-primary leading-6">{visualStage.stage}</p>
              </div>
            )}
            {visualStage.decor?.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary mb-1.5">
                  Decor Elements
                </p>
                <BulletList items={visualStage.decor} />
              </div>
            )}
            {visualStage.references?.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary mb-1.5">
                  Look & Feel References
                </p>
                <BulletList items={visualStage.references} />
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ── Section 3: Activation ─────────────────────────────────────────── */}
      {activation.length > 0 && (
        <Section label="Activation" icon={<ActivationIcon />}>
          <BulletList items={activation} />
        </Section>
      )}

      {/* ── Section 4: Experience ─────────────────────────────────────────── */}
      {experience.length > 0 && (
        <Section label="Experience" icon={<ExperienceIcon />}>
          <BulletList items={experience} />
        </Section>
      )}

      {/* ── Section 5: Timeline ───────────────────────────────────────────── */}
      {timeline.length > 0 && (
        <Section label="Timeline" icon={<TimelineIcon />}>
          <ol className="flex flex-col gap-3">
            {timeline.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/5 text-[10px] font-semibold text-text-secondary ring-1 ring-white/10 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm leading-6 text-text-primary">{step}</p>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* ── Section 6: Vendors ────────────────────────────────────────────── */}
      {vendors.length > 0 && (
        <Section label="Vendors" icon={<VendorIcon />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {vendors.map((v, i) => (
              <div key={i} className="flex flex-col gap-0.5 rounded-lg border border-white/5 px-3 py-2.5">
                <p className="text-xs font-semibold text-text-primary">{v.name}</p>
                <p className="text-xs text-text-secondary">{v.role}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Section 7: Budget ─────────────────────────────────────────────── */}
      {proposal.budget?.length > 0 && (
        <Section label="Budget" icon={<BudgetIcon />} defaultOpen>
          <BudgetTable items={proposal.budget} />
        </Section>
      )}

      {/* ── Section 8: Risk & Tips ────────────────────────────────────────── */}
      {risks.length > 0 && (
        <Section label="Risk & Tips" icon={<RiskIcon />}>
          <BulletList items={risks} />
        </Section>
      )}

      {/* ── Section 9: Compliance ─────────────────────────────────────────── */}
      {compliance.length > 0 && (
        <Section label="Compliance" icon={<ComplianceIcon />}>
          <BulletList items={compliance} />
        </Section>
      )}

      {/* Footer */}
      <div className="flex items-center justify-center gap-2 py-2">
        <span className="h-px w-8 bg-white/8" />
        <p className="text-xs text-white/20">Generated with Kunjara OS™</p>
        <span className="h-px w-8 bg-white/8" />
      </div>
    </div>
  );
}

// ── Budget table ──────────────────────────────────────────────────────────────

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

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(groups).map(([category, rows]) => (
        <div key={category}>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-text-secondary">
            {category}
          </p>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-white/5">
              {rows.map((row, i) => (
                <tr key={i} className="group">
                  <td className="py-2 text-text-primary group-first:pt-0">{row.item}</td>
                  <td className="py-2 text-right tabular-nums text-text-secondary group-first:pt-0">
                    {row.cost}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {total > 0 && (
        <div className="flex items-center justify-between border-t border-white/10 pt-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
            Estimated Total
          </p>
          <p className="text-base font-bold text-text-primary tabular-nums">{formatINR(total)}</p>
        </div>
      )}
    </div>
  );
}

// ── Small components ──────────────────────────────────────────────────────────

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[10px] font-medium uppercase tracking-widest text-text-secondary">{label}</p>
      <p className="text-sm text-text-primary">{value}</p>
    </div>
  );
}

function ActionButton({
  onClick, disabled, children, className = "",
}: {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 rounded-lg border border-white/8 bg-bg/50 px-2.5 py-1.5 text-xs font-medium text-text-secondary backdrop-blur-sm transition-all duration-150 hover:border-white/15 hover:text-text-primary disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function RefreshIcon({ spinning }: { spinning?: boolean }) {
  return (
    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className={spinning ? "animate-spin" : ""}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}
function CopyIcon() {
  return (
    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
function LinkIcon() {
  return (
    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}
function PrintIcon() {
  return (
    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
  );
}

function SectionIcon({ d }: { d: string }) {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

function ConceptIcon()    { return <SectionIcon d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />; }
function VisualIcon()     { return <SectionIcon d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />; }
function ActivationIcon() { return <SectionIcon d="M13 10V3L4 14h7v7l9-11h-7z" />; }
function ExperienceIcon() { return <SectionIcon d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />; }
function TimelineIcon()   { return <SectionIcon d="M4 6h16M4 10h16M4 14h16M4 18h7" />; }
function VendorIcon()     { return <SectionIcon d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />; }
function BudgetIcon()     { return <SectionIcon d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />; }
function RiskIcon()       { return <SectionIcon d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />; }
function ComplianceIcon() { return <SectionIcon d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />; }
