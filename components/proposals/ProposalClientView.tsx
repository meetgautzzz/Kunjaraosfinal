"use client";

import React from "react";
import type { ProposalData, BudgetLine, TimelinePhase, ProposalVendor } from "@/lib/proposals";
import { formatINR } from "@/lib/proposals";
import { STATUS_CONFIG } from "@/lib/compliance";
import type { ComplianceItem } from "@/lib/compliance";
import { FloorPlanViewer } from "@/components/toolkit/FloorPlanBuilder";
import { PieChart, Pie, Cell, Tooltip } from "recharts";

type SectionRef = "concept" | "experience" | "visual" | "activation" | "timeline" | "budget" | "vendors" | "compliance" | "risks";

type Props = {
  proposal:         ProposalData;
  highlightSection?: SectionRef | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function Section({
  id, title, icon, children, highlight,
}: {
  id: SectionRef; title: string; icon: string; children: React.ReactNode; highlight: boolean;
}) {
  return (
    <section
      id={`section-${id}`}
      style={{
        borderRadius: 14,
        border: highlight ? "1px solid rgba(99,102,241,0.45)" : "1px solid var(--border)",
        background: highlight ? "rgba(99,102,241,0.03)" : "var(--bg-card)",
        overflow: "hidden",
        transition: "border-color 0.2s, background 0.2s",
        scrollMarginTop: 16,
      }}
    >
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "14px 20px",
        borderBottom: "1px solid var(--border)",
        background: highlight ? "rgba(99,102,241,0.04)" : "var(--bg-surface)",
      }}>
        <span style={{ fontSize: 15 }}>{icon}</span>
        <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-2)" }}>
          {title}
        </h3>
        {highlight && (
          <span style={{
            marginLeft: "auto", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em",
            color: "#a5b4fc", background: "rgba(99,102,241,0.12)",
            border: "1px solid rgba(99,102,241,0.25)", borderRadius: 4, padding: "2px 6px",
          }}>
            Highlighted
          </span>
        )}
      </div>
      <div style={{ padding: "20px" }}>{children}</div>
    </section>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 500, border: "1px solid var(--border)",
      background: "var(--bg-surface)", color: "var(--text-2)",
    }}>
      {children}
    </span>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)" }}>{label}</span>
      <span style={{ fontSize: 13, color: "var(--text-1)", lineHeight: 1.55 }}>{value}</span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ProposalClientView({ proposal, highlightSection }: Props) {
  const hl = (id: SectionRef) => highlightSection === id;

  const hasConcept     = !!proposal.concept;
  const hasExperience  = !!(proposal.eventConcept || proposal.selectedIdea);
  const hasVisual      = !!(proposal.visualDirection || proposal.stageDesign || proposal.decorPlan);
  const hasActivations = !!(proposal.experienceElements?.activations?.length);
  const hasTimeline    = !!(proposal.timeline?.length);
  const hasBudget      = !!(proposal.budgetBreakdown?.length);
  const hasVendors     = !!(proposal.vendors?.length);
  const hasRisks       = !!(proposal.riskFlags?.length || proposal.tips?.length);
  const hasCompliance  = !!(proposal.compliance?.length);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Cover ─────────────────────────────────────────────────────────── */}
      <div style={{
        borderRadius: 14, border: "1px solid var(--border)",
        background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))",
        padding: "28px 24px",
      }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-1)", lineHeight: 1.15, marginBottom: 10 }}>
              {proposal.concept?.title ?? proposal.title}
            </h1>
            {proposal.concept?.tagline && (
              <p style={{ fontSize: 14, color: "#a5b4fc", fontStyle: "italic", marginBottom: 10 }}>
                "{proposal.concept.tagline}"
              </p>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {proposal.eventType  && <Tag>{proposal.eventType}</Tag>}
              {proposal.location   && <Tag>📍 {proposal.location}</Tag>}
              {proposal.eventDate  && <Tag>📅 {new Date(proposal.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</Tag>}
            </div>
          </div>
          <div style={{
            textAlign: "right", minWidth: 120,
            padding: "12px 16px", borderRadius: 10,
            background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)",
          }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#a5b4fc", marginBottom: 4 }}>Total Budget</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: "var(--text-1)" }}>{formatINR(proposal.budget)}</p>
          </div>
        </div>
      </div>

      {/* ── Mood Board ────────────────────────────────────────────────────── */}
      {(proposal.mood_board_images?.length ?? 0) > 0 && (
        <div style={{ borderRadius: 14, border: "1px solid var(--border)", background: "var(--bg-card)", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}>
            <span style={{ fontSize: 15 }}>✨</span>
            <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-2)" }}>Visual Mood Board</h3>
          </div>
          <div style={{ padding: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
              {proposal.mood_board_images!.map((url, i) => (
                <div key={i} style={{ borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Mood board ${i + 1}`} style={{ width: "100%", display: "block", aspectRatio: "16/9", objectFit: "cover" }} loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Concept ───────────────────────────────────────────────────────── */}
      {hasConcept && (
        <Section id="concept" title="Event Concept" icon="✦" highlight={hl("concept")}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {proposal.concept.description && (
              <p style={{ fontSize: 14, color: "var(--text-1)", lineHeight: 1.7 }}>{proposal.concept.description}</p>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {proposal.concept.theme && <Row label="Theme" value={proposal.concept.theme} />}
            </div>
            {proposal.concept.highlights?.length > 0 && (
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>
                  Highlights
                </p>
                <ul style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {proposal.concept.highlights.map((h, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "var(--text-1)" }}>
                      <span style={{ color: "#a5b4fc", marginTop: 3, flexShrink: 0, fontSize: 10 }}>▸</span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ── Experience concept ────────────────────────────────────────────── */}
      {hasExperience && proposal.eventConcept && (
        <Section id="experience" title="Experience Design" icon="✨" highlight={hl("experience")}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {proposal.eventConcept.tagline && (
              <p style={{ fontSize: 15, fontWeight: 600, color: "#a5b4fc", fontStyle: "italic" }}>
                "{proposal.eventConcept.tagline}"
              </p>
            )}
            {proposal.eventConcept.storyline && (
              <p style={{ fontSize: 14, color: "var(--text-1)", lineHeight: 1.7 }}>{proposal.eventConcept.storyline}</p>
            )}
            {proposal.eventConcept.theme && <Row label="Theme" value={proposal.eventConcept.theme} />}
            {proposal.eventConcept.emotionalJourney?.length > 0 && (
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>
                  Emotional Journey
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {proposal.eventConcept.emotionalJourney.map((e, i) => (
                    <span key={i} style={{
                      padding: "4px 12px", borderRadius: 20, fontSize: 12,
                      background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)",
                      color: "#a5b4fc",
                    }}>{e}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ── Visual & Stage ────────────────────────────────────────────────── */}
      {hasVisual && (
        <Section id="visual" title="Visual & Stage Design" icon="🎨" highlight={hl("visual")}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {proposal.visualDirection?.generatedImageUrl && (
              <img
                src={proposal.visualDirection.generatedImageUrl}
                alt="Visual direction"
                style={{ width: "100%", borderRadius: 10, border: "1px solid var(--border)", display: "block" }}
              />
            )}

            {(proposal.visualDirection?.palette?.length ?? 0) > 0 && (
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 10 }}>
                  Colour Palette
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {proposal.visualDirection!.palette!.map((c, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: c.hex, border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-1)" }}>{c.name}</p>
                        <p style={{ fontSize: 10, color: "var(--text-3)" }}>{c.usage}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {proposal.visualDirection?.overallAesthetic && (
                <Row label="Overall Aesthetic" value={proposal.visualDirection.overallAesthetic} />
              )}
              {proposal.visualDirection?.lighting && (
                <Row label="Lighting" value={proposal.visualDirection.lighting} />
              )}
            </div>

            {proposal.stageDesign && (
              <div style={{ paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 12 }}>
                  Stage Design
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {proposal.stageDesign.layout        && <Row label="Layout"           value={proposal.stageDesign.layout} />}
                  {proposal.stageDesign.entryExperience && <Row label="Entry Experience" value={proposal.stageDesign.entryExperience} />}
                  {proposal.stageDesign.signature      && <Row label="Signature Moment" value={proposal.stageDesign.signature} />}
                </div>
                {proposal.stageDesign.focalPoints?.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>
                      Focal Points
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {proposal.stageDesign.focalPoints.map((f, i) => <Tag key={i}>{f}</Tag>)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {(proposal.decorPlan?.zones?.length ?? 0) > 0 && (
              <div style={{ paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 10 }}>
                  Décor Zones
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {proposal.decorPlan!.zones!.map((z, i) => (
                    <div key={i} style={{ padding: "10px 12px", borderRadius: 8, background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)" }}>{z.name}</p>
                      <p style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>{z.concept}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ── Activations ───────────────────────────────────────────────────── */}
      {hasActivations && (
        <Section id="activation" title="Activations & Experience" icon="⚡" highlight={hl("activation")}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {proposal.experienceElements!.activations.map((a, i) => (
                <div key={i} style={{ padding: "12px 14px", borderRadius: 10, background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{a.name}</p>
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                      padding: "2px 6px", borderRadius: 4,
                      background: a.engagementType === "ACTIVE" ? "rgba(99,102,241,0.15)"
                        : a.engagementType === "SOCIAL" ? "rgba(16,185,129,0.1)"
                        : a.engagementType === "COMPETITIVE" ? "rgba(245,158,11,0.1)"
                        : "rgba(107,114,128,0.1)",
                      color: a.engagementType === "ACTIVE" ? "#a5b4fc"
                        : a.engagementType === "SOCIAL" ? "#34d399"
                        : a.engagementType === "COMPETITIVE" ? "#fbbf24"
                        : "var(--text-3)",
                    }}>
                      {a.engagementType}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.55 }}>{a.description}</p>
                </div>
              ))}
            </div>

            {proposal.experienceElements!.guestJourney?.length > 0 && (
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>
                  Guest Journey
                </p>
                <ol style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {proposal.experienceElements!.guestJourney.map((g, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <span style={{
                        width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                        background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.2)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 700, color: "#a5b4fc",
                      }}>{i + 1}</span>
                      <span style={{ fontSize: 13, color: "var(--text-1)", lineHeight: 1.55 }}>{g}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ── Timeline ──────────────────────────────────────────────────────── */}
      {hasTimeline && (
        <Section id="timeline" title="Event Timeline" icon="⏱" highlight={hl("timeline")}>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {proposal.timeline.map((phase, i) => (
              <div key={i} style={{ display: "flex", gap: 14, paddingBottom: i < proposal.timeline.length - 1 ? 20 : 0 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 20 }}>
                  <div style={{
                    width: 12, height: 12, borderRadius: "50%", flexShrink: 0, marginTop: 3,
                    background: phase.milestone ? "#a5b4fc" : "var(--border-hi)",
                    border: phase.milestone ? "2px solid rgba(99,102,241,0.4)" : "2px solid var(--border)",
                    boxShadow: phase.milestone ? "0 0 0 3px rgba(99,102,241,0.1)" : "none",
                  }} />
                  {i < proposal.timeline.length - 1 && (
                    <div style={{ width: 1, flex: 1, marginTop: 4, background: "var(--border)" }} />
                  )}
                </div>
                <div style={{ flex: 1, paddingBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{phase.phase}</p>
                    {phase.daysOut && (
                      <span style={{ fontSize: 10, color: "var(--text-3)", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 4, padding: "1px 6px" }}>
                        {phase.daysOut}
                      </span>
                    )}
                    {phase.milestone && (
                      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", color: "#a5b4fc", textTransform: "uppercase" }}>
                        Milestone
                      </span>
                    )}
                  </div>
                  {phase.tasks?.length > 0 && (
                    <ul style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      {phase.tasks.map((t, j) => (
                        <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 12, color: "var(--text-2)" }}>
                          <span style={{ color: "var(--text-3)", marginTop: 2, flexShrink: 0, fontSize: 9 }}>▸</span>
                          {t}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Budget ────────────────────────────────────────────────────────── */}
      {hasBudget && (
        <Section id="budget" title="Budget Breakdown" icon="₹" highlight={hl("budget")}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Pie chart */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <PieChart width={320} height={320}>
                <Pie data={proposal.budgetBreakdown} cx={160} cy={160} innerRadius={80} outerRadius={130} paddingAngle={2} dataKey="amount">
                  {proposal.budgetBreakdown.map((_, idx) => (
                    <Cell key={idx} fill={["#6366f1","#8b5cf6","#a855f7","#d946ef","#ec4899","#f43f5e","#f97316","#eab308"][idx % 8]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Amount"]} />
              </PieChart>
            </div>

            {proposal.budgetBreakdown.map((line, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{line.category}</span>
                    {line.description && (
                      <span style={{ fontSize: 11, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {line.description}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: "var(--text-3)" }}>{line.percentage}%</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", minWidth: 80, textAlign: "right" }}>
                      {formatINR(line.amount)}
                    </span>
                  </div>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: "var(--bg-surface)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 2,
                    background: `hsl(${240 + i * 25}, 70%, 60%)`,
                    width: `${Math.min(line.percentage, 100)}%`,
                    transition: "width 0.3s ease",
                  }} />
                </div>
              </div>
            ))}
            <div style={{ marginTop: 4, paddingTop: 12, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>Total</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: "var(--text-1)" }}>{formatINR(proposal.budget)}</span>
            </div>
          </div>
        </Section>
      )}

      {/* ── Vendors ───────────────────────────────────────────────────────── */}
      {hasVendors && (
        <Section id="vendors" title="Vendor Recommendations" icon="🏪" highlight={hl("vendors")}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {proposal.vendors.map((v, i) => (
              <div key={i} style={{ padding: "12px 14px", borderRadius: 10, background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6, marginBottom: 4 }}>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)" }}>{v.category}</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{v.role}</p>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#a5b4fc", whiteSpace: "nowrap" }}>
                    {formatINR(v.estimatedCost)}
                  </span>
                </div>
                {v.notes && <p style={{ fontSize: 11, color: "var(--text-2)", lineHeight: 1.5 }}>{v.notes}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Risks & Tips ─────────────────────────────────────────────────── */}
      {hasRisks && (
        <Section id="risks" title="Risk Assessment" icon="⚠" highlight={hl("risks")}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {proposal.riskFlags?.length > 0 && (
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#fbbf24", marginBottom: 8 }}>
                  Risk Flags
                </p>
                <ul style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {proposal.riskFlags.map((r, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "var(--text-1)" }}>
                      <span style={{ color: "#fbbf24", marginTop: 2, flexShrink: 0 }}>⚠</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {proposal.tips?.length > 0 && (
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#34d399", marginBottom: 8 }}>
                  Recommendations
                </p>
                <ul style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {proposal.tips.map((t, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "var(--text-1)" }}>
                      <span style={{ color: "#34d399", marginTop: 2, flexShrink: 0 }}>✓</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ── Floor Plan ───────────────────────────────────────────────────── */}
      {(proposal.floorPlan?.length ?? 0) > 0 && (
        <div style={{
          borderRadius: 14, border: "1px solid var(--border)",
          background: "var(--bg-card)", overflow: "hidden",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "14px 20px", borderBottom: "1px solid var(--border)",
            background: "var(--bg-surface)",
          }}>
            <span style={{ fontSize: 15 }}>⬛</span>
            <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-2)" }}>
              Event Floor Plan
            </h3>
            <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-3)" }}>
              {proposal.floorPlan!.length} element{proposal.floorPlan!.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div style={{ padding: "16px" }}>
            <FloorPlanViewer elements={proposal.floorPlan!} height={380} />
          </div>
        </div>
      )}

      {/* ── 3D Event Visuals ──────────────────────────────────────────────── */}
      {(proposal.generatedVisuals?.length ?? 0) > 0 && (
        <div style={{
          borderRadius: 14, border: "1px solid var(--border)",
          background: "var(--bg-card)", overflow: "hidden",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "14px 20px", borderBottom: "1px solid var(--border)",
            background: "var(--bg-surface)",
          }}>
            <span style={{ fontSize: 15 }}>🎨</span>
            <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-2)" }}>
              3D Event Visuals
            </h3>
            <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-3)" }}>
              {proposal.generatedVisuals!.length} render{proposal.generatedVisuals!.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div style={{ padding: "16px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {proposal.generatedVisuals!.map((v) => (
              <div key={v.id} style={{
                borderRadius: 10, overflow: "hidden",
                border: "1px solid var(--border)", background: "#0d0e11",
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={v.image}
                  alt={`3D event visual${v.brandName ? ` for ${v.brandName}` : ""}`}
                  style={{ width: "100%", display: "block" }}
                />
                {(v.eventType || v.theme) && (
                  <div style={{ padding: "8px 12px", display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {v.eventType && (
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                        background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)",
                        color: "#a78bfa", textTransform: "capitalize",
                      }}>{v.eventType}</span>
                    )}
                    {v.theme && (
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                        background: "var(--bg-surface)", border: "1px solid var(--border)",
                        color: "var(--text-3)", textTransform: "capitalize",
                      }}>{v.theme}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 3D Event Visuals ──────────────────────────────────────────────── */}
      {(proposal.generatedVisuals?.length ?? 0) > 0 && (
        <div style={{ borderRadius: 14, border: "1px solid var(--border)", background: "var(--bg-card)", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}>
            <span style={{ fontSize: 15 }}>🎬</span>
            <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-2)" }}>
              3D Event Visualization
            </h3>
            <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-3)" }}>
              {proposal.generatedVisuals!.length} render{proposal.generatedVisuals!.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
            {proposal.generatedVisuals!.map((v) => (
              <div
                key={v.id}
                style={{
                  borderRadius: 12, overflow: "hidden",
                  border: "1px solid var(--border)", background: "#0d0e11",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={v.image}
                  alt={`3D event visual${v.brandName ? ` for ${v.brandName}` : ""}`}
                  style={{ width: "100%", display: "block" }}
                  loading="lazy"
                />
                {(v.eventType || v.theme) && (
                  <div style={{ padding: "8px 12px", display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {v.eventType && (
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", color: "#a78bfa", textTransform: "capitalize" }}>
                        {v.eventType}
                      </span>
                    )}
                    {v.theme && (
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-3)", textTransform: "capitalize" }}>
                        {v.theme}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Compliance ────────────────────────────────────────────────────── */}
      {hasCompliance && (
        <Section id="compliance" title="Compliance Checklist" icon="⚖" highlight={hl("compliance")}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {proposal.compliance!.map((item) => {
              const cfg = STATUS_CONFIG[item.status];
              return (
                <div key={item.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 8,
                  background: "var(--bg-surface)", border: "1px solid var(--border)",
                }}>
                  <span style={{ fontSize: 13 }}>{cfg.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)" }}>{item.name}</p>
                    <p style={{ fontSize: 11, color: "var(--text-3)" }}>{item.authority}</p>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
                    border: "1px solid", ...Object.fromEntries(
                      cfg.bg.split(" ").map((cls) => {
                        if (cls.startsWith("bg-"))    return ["background", `var(--${cls.slice(3)})`];
                        if (cls.startsWith("border-")) return ["borderColor", `var(--${cls.slice(7)})`];
                        return [];
                      })
                    ),
                  }} className={`${cfg.bg} ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Section>
      )}

    </div>
  );
}
