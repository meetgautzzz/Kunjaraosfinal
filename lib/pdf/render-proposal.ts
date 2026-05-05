/**
 * Server-side HTML generator for proposal PDFs.
 * Runs in Node.js — no React, no client APIs.
 */

import type { ProposalData } from "@/lib/proposals";
import type { FpElement } from "@/components/toolkit/FloorPlanBuilder";

// ── Helpers ───────────────────────────────────────────────────────────────────

function inr(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(n);
}

function esc(s: string | undefined | null): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Floor Plan SVG (light-themed, suitable for print) ─────────────────────────

const FP_KINDS: Record<string, { fill: string; stroke: string }> = {
  stage: { fill: "rgba(124,58,237,0.12)",  stroke: "#7C3AED" },
  table: { fill: "rgba(180,130,60,0.15)",  stroke: "#9A7030" },
  chair: { fill: "rgba(30,100,100,0.12)",  stroke: "#1E6464" },
  booth: { fill: "rgba(160,80,50,0.15)",   stroke: "#A05030" },
  entry: { fill: "rgba(20,140,60,0.12)",   stroke: "#148C3C" },
};

function renderFloorPlanSVG(elements: FpElement[]): string {
  const CELL = 36;  // slightly smaller cell for A4 width
  const GW   = 30;
  const GH   = 22;
  const vw   = CELL * GW;
  const vh   = CELL * GH;

  const shapes = elements.map((el) => {
    const cfg = FP_KINDS[el.kind] ?? FP_KINDS.table;
    const px  = el.x * CELL;
    const py  = el.y * CELL;
    const pw  = el.w * CELL;
    const ph  = el.h * CELL;
    const cx  = px + pw / 2;
    const cy  = py + ph / 2;
    const rx  = el.kind === "table" ? Math.min(pw, ph) / 2 : 3;
    const fs  = Math.max(6, Math.min(10, pw / 5));

    return `
      <g transform="rotate(${el.rotation},${cx},${cy})">
        <rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="${rx}"
              fill="${cfg.fill}" stroke="${cfg.stroke}" stroke-width="1"/>
        <text x="${cx}" y="${cy}" dy="0.38em"
              fill="${cfg.stroke}" font-size="${fs}" text-anchor="middle"
              font-family="Helvetica,Arial,sans-serif" font-weight="600">
          ${esc(el.label)}
        </text>
      </g>`;
  }).join("\n");

  // Legend
  const legendItems = [...new Set(elements.map((e) => e.kind))];
  const legend = legendItems.map((k, i) => {
    const cfg = FP_KINDS[k] ?? FP_KINDS.table;
    const x = 10 + i * 90;
    return `
      <rect x="${x}" y="${vh - 20}" width="12" height="12" rx="2"
            fill="${cfg.fill}" stroke="${cfg.stroke}" stroke-width="1"/>
      <text x="${x + 16}" y="${vh - 11}" font-size="9"
            fill="#555" font-family="Helvetica,Arial,sans-serif">
        ${esc(k.charAt(0).toUpperCase() + k.slice(1))}
      </text>`;
  }).join("\n");

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vw} ${vh}" width="${vw}" height="${vh}" style="display:block;max-width:100%">
  <defs>
    <pattern id="fp-cell" width="${CELL}" height="${CELL}" patternUnits="userSpaceOnUse">
      <path d="M${CELL} 0L0 0 0 ${CELL}" fill="none" stroke="#e8eaec" stroke-width="0.5"/>
    </pattern>
    <pattern id="fp-major" width="${CELL * 5}" height="${CELL * 5}" patternUnits="userSpaceOnUse">
      <rect width="${CELL * 5}" height="${CELL * 5}" fill="url(#fp-cell)"/>
      <path d="M${CELL * 5} 0L0 0 0 ${CELL * 5}" fill="none" stroke="#d1d5db" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="${vw}" height="${vh}" fill="#fafafa" rx="4"/>
  <rect width="${vw}" height="${vh}" fill="url(#fp-major)" rx="4"/>
  ${shapes}
  ${legend}
</svg>`;
}

// ── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: A4; margin: 0; }

  body {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    color: #1a1a2e;
    background: #fff;
    font-size: 11pt;
    line-height: 1.5;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ── Cover ── */
  .cover {
    width: 210mm;
    height: 297mm;
    background: linear-gradient(145deg, #0d0e11 0%, #13151c 50%, #1a1c25 100%);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 56px 52px 48px;
    color: #fff;
    page-break-after: always;
  }
  .cover-logo { font-size: 13px; font-weight: 700; letter-spacing: 0.18em; color: #D4A85F; text-transform: uppercase; }
  .cover-title { font-size: 36px; font-weight: 800; line-height: 1.15; letter-spacing: -0.02em; color: #fff; margin-top: 12px; }
  .cover-subtitle { font-size: 14px; color: rgba(255,255,255,0.55); margin-top: 8px; }
  .cover-badge {
    display: inline-block; margin-top: 20px;
    background: rgba(212,168,95,0.15); border: 1px solid rgba(212,168,95,0.4);
    color: #D4A85F; font-size: 10px; font-weight: 700;
    padding: 4px 12px; border-radius: 20px; letter-spacing: 0.1em; text-transform: uppercase;
  }
  .cover-meta { display: flex; flex-direction: column; gap: 8px; }
  .cover-meta-row { display: flex; align-items: center; gap: 10px; font-size: 12px; color: rgba(255,255,255,0.65); }
  .cover-meta-label { color: rgba(255,255,255,0.35); font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; width: 72px; }
  .cover-footer { font-size: 10px; color: rgba(255,255,255,0.25); }
  .cover-accent-bar { width: 48px; height: 3px; background: #D4A85F; border-radius: 2px; margin: 24px 0 16px; }

  /* ── Sections ── */
  .section {
    padding: 44px 52px;
    page-break-before: always;
    min-height: 297mm;
  }
  .section-first { page-break-before: auto; }

  .section-eyebrow {
    font-size: 9px; font-weight: 700; letter-spacing: 0.18em;
    text-transform: uppercase; color: #D4A85F; margin-bottom: 6px;
  }
  .section-title {
    font-size: 22px; font-weight: 800; color: #1a1a2e;
    letter-spacing: -0.02em; line-height: 1.2; margin-bottom: 24px;
    padding-bottom: 14px;
    border-bottom: 2px solid #f0e9da;
  }
  .section-title span { color: #D4A85F; }

  /* ── Cards ── */
  .card {
    background: #fafafa; border: 1px solid #e8e8e8;
    border-radius: 8px; padding: 18px 20px; margin-bottom: 12px;
  }
  .card-title { font-size: 12px; font-weight: 700; color: #1a1a2e; margin-bottom: 4px; }
  .card-body  { font-size: 11px; color: #555; line-height: 1.6; }

  /* ── Highlights ── */
  .highlights { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
  .highlight-pill {
    background: rgba(212,168,95,0.1); border: 1px solid rgba(212,168,95,0.3);
    color: #8a6e30; font-size: 10px; font-weight: 600;
    padding: 4px 10px; border-radius: 20px;
  }

  /* ── Table ── */
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  thead { background: #1a1a2e; }
  thead th { color: #fff; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; padding: 10px 12px; text-align: left; }
  tbody tr { border-bottom: 1px solid #f0f0f0; }
  tbody tr:last-child { border-bottom: none; }
  tbody td { font-size: 11px; color: #333; padding: 9px 12px; vertical-align: top; }
  tbody tr:nth-child(even) { background: #fafafa; }
  .td-amount { font-weight: 700; color: #1a1a2e; font-variant-numeric: tabular-nums; }
  .td-pct { color: #888; font-size: 10px; }
  .budget-total-row { background: rgba(212,168,95,0.08) !important; border-top: 2px solid #D4A85F !important; }
  .budget-total-row td { font-weight: 800; font-size: 12px; color: #1a1a2e; }

  /* ── Timeline ── */
  .timeline-phase { display: flex; gap: 16px; margin-bottom: 18px; }
  .timeline-bullet {
    width: 28px; height: 28px; border-radius: 50%;
    background: #1a1a2e; color: #D4A85F;
    font-size: 11px; font-weight: 800;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; margin-top: 2px;
  }
  .timeline-bullet.milestone { background: #D4A85F; color: #1a1a2e; }
  .timeline-content { flex: 1; }
  .timeline-phase-title { font-size: 13px; font-weight: 700; color: #1a1a2e; }
  .timeline-days { font-size: 10px; color: #888; margin-bottom: 6px; }
  .timeline-task { font-size: 10.5px; color: #444; margin-bottom: 3px; padding-left: 10px; position: relative; }
  .timeline-task::before { content: "·"; position: absolute; left: 0; color: #D4A85F; }

  /* ── Risks ── */
  .risk-item {
    display: flex; gap: 10px; align-items: flex-start;
    padding: 10px 14px; background: #fff8f0;
    border-left: 3px solid #f59e0b; border-radius: 0 6px 6px 0;
    margin-bottom: 8px; font-size: 11px; color: #444;
  }
  .risk-icon { color: #f59e0b; font-weight: 800; flex-shrink: 0; }

  /* ── Tips ── */
  .tip-item {
    display: flex; gap: 10px; align-items: flex-start;
    padding: 10px 14px; background: #f0faf4;
    border-left: 3px solid #10b981; border-radius: 0 6px 6px 0;
    margin-bottom: 8px; font-size: 11px; color: #444;
  }
  .tip-icon { color: #10b981; font-weight: 800; flex-shrink: 0; }

  /* ── Color swatches ── */
  .swatch-row { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 12px; }
  .swatch {
    display: flex; flex-direction: column; align-items: center; gap: 5px;
    font-size: 9px; color: #666; text-align: center; width: 64px;
  }
  .swatch-circle { width: 40px; height: 40px; border-radius: 50%; border: 1px solid rgba(0,0,0,0.08); }

  /* ── Compliance ── */
  .compliance-status { font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 10px; }
  .cs-NOT_STARTED   { background: #f3f4f6; color: #6b7280; }
  .cs-IN_PROGRESS   { background: #fef3c7; color: #d97706; }
  .cs-SUBMITTED     { background: #dbeafe; color: #2563eb; }
  .cs-APPROVED      { background: #d1fae5; color: #059669; }

  /* ── Floor plan section ── */
  .fp-container {
    border: 1px solid #e5e7eb; border-radius: 8px;
    overflow: hidden; margin-top: 12px;
  }

  /* ── Footer on content pages ── */
  .page-footer {
    position: fixed; bottom: 24px; left: 52px; right: 52px;
    display: flex; justify-content: space-between;
    font-size: 9px; color: #bbb; border-top: 1px solid #f0f0f0; padding-top: 8px;
  }

  /* ── Two-col grid ── */
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .info-block { background: #fafafa; border: 1px solid #e8e8e8; border-radius: 6px; padding: 14px 16px; }
  .info-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: #999; margin-bottom: 4px; }
  .info-value { font-size: 13px; font-weight: 700; color: #1a1a2e; }

  /* ── Activation types ── */
  .activation-type {
    font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 10px;
    display: inline-block; margin-bottom: 4px;
  }
  .PASSIVE    { background: #f3f4f6; color: #6b7280; }
  .ACTIVE     { background: #dbeafe; color: #1d4ed8; }
  .SOCIAL     { background: #fce7f3; color: #be185d; }
  .COMPETITIVE{ background: #fef3c7; color: #d97706; }
`;

// ── Section builders ──────────────────────────────────────────────────────────

function cover(p: ProposalData): string {
  const title = esc(p.concept?.title ?? p.title ?? "Event Proposal");
  const date  = p.eventDate
    ? new Date(p.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "";

  return `
<div class="cover">
  <div>
    <div class="cover-logo">Kunjara OS · Event Intelligence</div>
    <div style="margin-top:56px">
      <div class="cover-badge">${esc(p.eventType)}</div>
      <div class="cover-title">${title}</div>
      ${p.concept?.tagline ? `<div class="cover-subtitle">"${esc(p.concept.tagline)}"</div>` : ""}
      <div class="cover-accent-bar"></div>
    </div>
  </div>
  <div>
    <div class="cover-meta">
      ${p.location ? `<div class="cover-meta-row"><span class="cover-meta-label">Venue</span>${esc(p.location)}</div>` : ""}
      ${date ? `<div class="cover-meta-row"><span class="cover-meta-label">Date</span>${date}</div>` : ""}
      ${p.budget ? `<div class="cover-meta-row"><span class="cover-meta-label">Budget</span>${inr(p.budget)}</div>` : ""}
      ${p.client?.name ? `<div class="cover-meta-row"><span class="cover-meta-label">Client</span>${esc(p.client.name)}${p.client.companyName ? ` · ${esc(p.client.companyName)}` : ""}</div>` : ""}
    </div>
    <div class="cover-footer" style="margin-top:32px">Generated by Kunjara OS · ${new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</div>
  </div>
</div>`;
}

function conceptSection(p: ProposalData): string {
  const c = p.concept;
  if (!c) return "";
  return `
<div class="section section-first">
  <div class="section-eyebrow">Event Concept</div>
  <div class="section-title">${esc(c.title)}</div>
  ${c.tagline ? `<div style="font-size:14px;font-style:italic;color:#888;margin-bottom:18px">"${esc(c.tagline)}"</div>` : ""}
  <div class="card">
    <div class="card-title">Theme</div>
    <div class="card-body">${esc(c.theme)}</div>
  </div>
  <div class="card">
    <div class="card-title">Description</div>
    <div class="card-body">${esc(c.description)}</div>
  </div>
  ${(c.highlights?.length) ? `
  <div style="margin-top:16px">
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#999;margin-bottom:8px">Highlights</div>
    <div class="highlights">
      ${c.highlights.map((h) => `<div class="highlight-pill">${esc(h)}</div>`).join("")}
    </div>
  </div>` : ""}
</div>`;
}

function budgetSection(p: ProposalData): string {
  if (!p.budgetBreakdown?.length) return "";
  const total = p.budgetBreakdown.reduce((s, b) => s + b.amount, 0);
  return `
<div class="section">
  <div class="section-eyebrow">Financial Breakdown</div>
  <div class="section-title">Budget <span>Breakdown</span></div>
  <div class="two-col" style="margin-bottom:20px">
    <div class="info-block">
      <div class="info-label">Total Budget</div>
      <div class="info-value">${inr(p.budget ?? total)}</div>
    </div>
    <div class="info-block">
      <div class="info-label">Line Items</div>
      <div class="info-value">${p.budgetBreakdown.length}</div>
    </div>
  </div>
  <table>
    <thead><tr>
      <th>Category</th>
      <th>Description</th>
      <th style="text-align:right">Amount</th>
      <th style="text-align:right">%</th>
    </tr></thead>
    <tbody>
      ${p.budgetBreakdown.map((b) => `
      <tr>
        <td class="td-amount">${esc(b.category)}</td>
        <td>${esc(b.description)}</td>
        <td class="td-amount" style="text-align:right">${inr(b.amount)}</td>
        <td class="td-pct" style="text-align:right">${b.percentage ?? Math.round((b.amount / total) * 100)}%</td>
      </tr>`).join("")}
      <tr class="budget-total-row">
        <td colspan="2">Total</td>
        <td style="text-align:right">${inr(total)}</td>
        <td style="text-align:right">100%</td>
      </tr>
    </tbody>
  </table>
</div>`;
}

function timelineSection(p: ProposalData): string {
  if (!p.timeline?.length) return "";
  return `
<div class="section">
  <div class="section-eyebrow">Planning Timeline</div>
  <div class="section-title">Event <span>Timeline</span></div>
  ${p.timeline.map((ph, i) => `
  <div class="timeline-phase">
    <div class="timeline-bullet${ph.milestone ? " milestone" : ""}">${i + 1}</div>
    <div class="timeline-content">
      <div class="timeline-phase-title">${esc(ph.phase)}</div>
      <div class="timeline-days">${esc(ph.daysOut)}</div>
      ${ph.tasks.map((t) => `<div class="timeline-task">${esc(t)}</div>`).join("")}
    </div>
  </div>`).join("")}
</div>`;
}

function vendorsSection(p: ProposalData): string {
  if (!p.vendors?.length) return "";
  return `
<div class="section">
  <div class="section-eyebrow">Vendor Plan</div>
  <div class="section-title">Recommended <span>Vendors</span></div>
  <table>
    <thead><tr>
      <th>Category</th><th>Role</th><th style="text-align:right">Est. Cost</th><th>Notes</th>
    </tr></thead>
    <tbody>
      ${p.vendors.map((v) => `
      <tr>
        <td class="td-amount">${esc(v.category)}</td>
        <td>${esc(v.role)}</td>
        <td class="td-amount" style="text-align:right">${inr(v.estimatedCost)}</td>
        <td style="font-size:10px;color:#666">${esc(v.notes)}</td>
      </tr>`).join("")}
    </tbody>
  </table>
</div>`;
}

function risksSection(p: ProposalData): string {
  if (!p.riskFlags?.length && !p.tips?.length) return "";
  return `
<div class="section">
  <div class="section-eyebrow">Risk Management</div>
  <div class="section-title">Risks &amp; <span>Tips</span></div>
  ${p.riskFlags?.length ? `
  <div style="margin-bottom:20px">
    <div style="font-size:11px;font-weight:700;color:#1a1a2e;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.08em">Risk Flags</div>
    ${p.riskFlags.map((r) => `<div class="risk-item"><span class="risk-icon">⚠</span>${esc(r)}</div>`).join("")}
  </div>` : ""}
  ${p.tips?.length ? `
  <div>
    <div style="font-size:11px;font-weight:700;color:#1a1a2e;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.08em">Planning Tips</div>
    ${p.tips.map((t) => `<div class="tip-item"><span class="tip-icon">✓</span>${esc(t)}</div>`).join("")}
  </div>` : ""}
</div>`;
}

function experienceSection(p: ProposalData): string {
  const ec = p.eventConcept;
  if (!ec) return "";
  return `
<div class="section">
  <div class="section-eyebrow">Experience Design</div>
  <div class="section-title">Event <span>Concept</span></div>
  <div class="two-col" style="margin-bottom:20px">
    <div class="card"><div class="card-title">Theme</div><div class="card-body">${esc(ec.theme)}</div></div>
    <div class="card"><div class="card-title">Tagline</div><div class="card-body">"${esc(ec.tagline)}"</div></div>
  </div>
  <div class="card"><div class="card-title">Storyline</div><div class="card-body">${esc(ec.storyline)}</div></div>
  ${ec.emotionalJourney?.length ? `
  <div style="margin-top:16px">
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#999;margin-bottom:8px">Emotional Journey</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      ${ec.emotionalJourney.map((j, i) => `
      <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#444">
        ${i > 0 ? '<span style="color:#D4A85F">→</span>' : ""}
        <span style="background:#fafafa;border:1px solid #e8e8e8;padding:4px 10px;border-radius:16px">${esc(j)}</span>
      </div>`).join("")}
    </div>
  </div>` : ""}
</div>`;
}

function visualSection(p: ProposalData): string {
  const vd = p.visualDirection;
  if (!vd) return "";
  return `
<div class="section">
  <div class="section-eyebrow">Aesthetic Direction</div>
  <div class="section-title">Visual <span>Design</span></div>
  ${vd.generatedImageUrl ? `<img src="${vd.generatedImageUrl}" style="width:100%;max-height:200px;object-fit:cover;border-radius:8px;margin-bottom:18px" alt="Mood board"/>` : ""}
  <div class="two-col" style="margin-bottom:16px">
    <div class="card"><div class="card-title">Overall Aesthetic</div><div class="card-body">${esc(vd.overallAesthetic)}</div></div>
    <div class="card"><div class="card-title">Lighting Direction</div><div class="card-body">${esc(vd.lighting)}</div></div>
  </div>
  ${vd.palette?.length ? `
  <div style="margin-top:4px">
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#999;margin-bottom:10px">Colour Palette</div>
    <div class="swatch-row">
      ${vd.palette.map((sw) => `
      <div class="swatch">
        <div class="swatch-circle" style="background:${esc(sw.hex)}"></div>
        <div style="font-weight:700;color:#333">${esc(sw.name)}</div>
        <div>${esc(sw.hex)}</div>
        <div style="font-size:8px;color:#999">${esc(sw.usage)}</div>
      </div>`).join("")}
    </div>
  </div>` : ""}
</div>`;
}

function activationsSection(p: ProposalData): string {
  const ee = p.experienceElements;
  if (!ee?.activations?.length) return "";
  return `
<div class="section">
  <div class="section-eyebrow">Guest Experience</div>
  <div class="section-title">Experience <span>Activations</span></div>
  ${ee.activations.map((a) => `
  <div class="card" style="margin-bottom:10px">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:4px">
      <div class="card-title">${esc(a.name)}</div>
      <span class="activation-type ${esc(a.engagementType)}">${esc(a.engagementType)}</span>
    </div>
    <div class="card-body">${esc(a.description)}</div>
  </div>`).join("")}
  ${ee.guestJourney?.length ? `
  <div style="margin-top:16px">
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#999;margin-bottom:8px">Guest Journey</div>
    ${ee.guestJourney.map((j) => `<div class="tip-item"><span class="tip-icon">→</span>${esc(j)}</div>`).join("")}
  </div>` : ""}
</div>`;
}

function floorPlanSection(elements: FpElement[]): string {
  if (!elements.length) return "";
  return `
<div class="section">
  <div class="section-eyebrow">Venue Layout</div>
  <div class="section-title">Event <span>Floor Plan</span></div>
  <div style="font-size:10px;color:#888;margin-bottom:12px">${elements.length} element${elements.length !== 1 ? "s" : ""} · 1 cell = 1 metre · grid: 30m × 22m</div>
  <div class="fp-container">
    ${renderFloorPlanSVG(elements)}
  </div>
</div>`;
}

function complianceSection(p: ProposalData): string {
  if (!p.compliance?.length) return "";
  return `
<div class="section">
  <div class="section-eyebrow">Regulatory</div>
  <div class="section-title">Compliance <span>Checklist</span></div>
  <table>
    <thead><tr>
      <th>Item</th><th>Category</th><th>Deadline</th><th>Status</th>
    </tr></thead>
    <tbody>
      ${p.compliance.map((ci) => `
      <tr>
        <td>
          <div style="font-weight:600;font-size:11px">${esc(ci.name)}</div>
          ${ci.notes ? `<div style="font-size:10px;color:#888;margin-top:2px">${esc(ci.notes)}</div>` : ""}
        </td>
        <td style="font-size:10px">${esc(ci.authority)}</td>
        <td style="font-size:10px;color:#888">${ci.deadline ? new Date(ci.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}</td>
        <td><span class="compliance-status cs-${esc(ci.status)}">${esc(ci.status?.replace(/_/g, " "))}</span></td>
      </tr>`).join("")}
    </tbody>
  </table>
</div>`;
}

// ── Main export ───────────────────────────────────────────────────────────────

export function buildProposalHtml(p: ProposalData): string {
  const title = esc(p.concept?.title ?? p.title ?? "Event Proposal");
  const floorPlan = (p.floorPlan ?? []) as FpElement[];

  const sections = [
    cover(p),
    conceptSection(p),
    budgetSection(p),
    timelineSection(p),
    vendorsSection(p),
    risksSection(p),
    experienceSection(p),
    visualSection(p),
    activationsSection(p),
    floorPlan.length ? floorPlanSection(floorPlan) : "",
    complianceSection(p),
  ].filter(Boolean).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${title} — Proposal</title>
  <style>${CSS}</style>
</head>
<body>
  ${sections}
  <div class="page-footer">
    <span>${title}</span>
    <span>Generated by Kunjara OS</span>
  </div>
</body>
</html>`;
}
