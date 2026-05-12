"use client";

import React from "react";
import type { ProposalData } from "@/lib/proposals";
import { formatINR } from "@/lib/proposals";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { FloorPlanViewer } from "@/components/toolkit/FloorPlanBuilder";

type Props = {
  proposal: ProposalData;
  highlightSection?: string | null;
};

export default function ProposalClientView({ proposal, highlightSection }: Props) {
  const [activeTab, setActiveTab] = React.useState<"overview" | "design" | "budget" | "timeline" | "vendors" | "risks">("overview");

  const c = proposal.concept;
  const hasBudget = !!(proposal.budgetBreakdown?.length);
  const hasTimeline = !!(proposal.timeline?.length);
  const hasVendors = !!(proposal.vendors?.length);
  const hasRisks = !!(proposal.riskFlags?.length || proposal.tips?.length);
  const hasDesign = !!(proposal.visualDirection || proposal.stageDesign || proposal.decorPlan || (proposal.floorPlan && proposal.floorPlan.length > 0));

  const TABS = [
    { id: "overview",  label: "📋 Overview" },
    { id: "design",    label: "🎭 Design & Layout", show: hasDesign },
    { id: "budget",    label: "💰 Budget",           show: hasBudget },
    { id: "timeline",  label: "📅 Timeline",         show: hasTimeline },
    { id: "vendors",   label: "🏪 Vendors",          show: hasVendors },
    { id: "risks",     label: "⚠️ Risks & Tips",     show: hasRisks },
  ].filter(t => t.show !== false);

  const COLORS = ["#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e", "#f97316", "#eab308"];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>

      {/* HERO HEADER */}
      <div style={{
        background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))",
        borderBottom: "1px solid var(--border)",
        padding: "40px 24px",
      }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-3)", marginBottom: 12 }}>
            ✨ Event Proposal
          </p>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: "var(--text-1)", marginBottom: 12, lineHeight: 1.2 }}>
            {c?.title || proposal.title || "Untitled Event"}
          </h1>
          <p style={{ fontSize: 16, color: "var(--text-2)", fontStyle: "italic", marginBottom: 16 }}>
            {c?.tagline || "Create an unforgettable experience"}
          </p>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 16,
            marginTop: 24,
          }}>
            {c?.theme && (
              <div style={{ padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 4 }}>Theme</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{c.theme}</p>
              </div>
            )}
            {proposal.originalBrief?.guestCount && (
              <div style={{ padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 4 }}>Expected Guests</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{proposal.originalBrief.guestCount}</p>
              </div>
            )}
            {hasBudget && proposal.budgetBreakdown && (
              <div style={{ padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 4 }}>Total Budget</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>
                  {formatINR(proposal.budgetBreakdown.reduce((sum, b) => sum + (b.amount || 0), 0))}
                </p>
              </div>
            )}
            {proposal.eventType && (
              <div style={{ padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 4 }}>Event Type</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{proposal.eventType}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div style={{
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-surface)",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", overflowX: "auto" }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: "16px 20px",
                border: "none",
                background: activeTab === tab.id ? "var(--bg-card)" : "transparent",
                borderBottom: activeTab === tab.id ? "2px solid #6366f1" : "2px solid transparent",
                color: activeTab === tab.id ? "var(--text-1)" : "var(--text-3)",
                fontSize: 13,
                fontWeight: activeTab === tab.id ? 600 : 500,
                cursor: "pointer",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px" }}>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

            {/* Concept */}
            {c && (
              <section style={{ padding: 24, borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg-card)" }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)", marginBottom: 16 }}>💡 Event Concept</h2>
                <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.8, marginBottom: 20 }}>{c.description}</p>
                {c.highlights && c.highlights.length > 0 && (
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--text-3)", marginBottom: 12 }}>
                      ✨ Key Highlights
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                      {c.highlights.map((h, idx) => (
                        <div key={idx} style={{
                          padding: 12, borderRadius: 8,
                          background: "rgba(99,102,241,0.1)",
                          border: "1px solid rgba(99,102,241,0.2)",
                        }}>
                          <p style={{ fontSize: 13, color: "var(--text-1)", fontWeight: 500 }}>✓ {h}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Mood Board */}
            {proposal.mood_board_images && proposal.mood_board_images.length > 0 && (
              <section style={{ padding: 24, borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg-card)" }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)", marginBottom: 16 }}>✨ Visual Mood Board</h2>
                <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" }}>
                  <img
                    src={proposal.mood_board_images[0]}
                    alt="Visual mood board"
                    style={{ width: "100%", height: "auto", aspectRatio: "16/9", objectFit: "cover", display: "block" }}
                  />
                </div>
              </section>
            )}

            {/* Color Palette */}
            {proposal.visualDirection?.palette && proposal.visualDirection.palette.length > 0 && (
              <section style={{ padding: 24, borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg-card)" }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)", marginBottom: 16 }}>🎨 Color Palette</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 12 }}>
                  {proposal.visualDirection.palette.map((color, idx) => (
                    <div key={idx} style={{ borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" }}>
                      <div style={{ height: 60, backgroundColor: color.hex }} />
                      <div style={{ padding: 8, background: "var(--bg-surface)" }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-1)" }}>{color.name}</p>
                        <p style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "monospace" }}>{color.hex}</p>
                        {color.usage && <p style={{ fontSize: 10, color: "var(--text-3)", marginTop: 2 }}>{color.usage}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* DESIGN TAB */}
        {activeTab === "design" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

            {/* Visual Direction */}
            {proposal.visualDirection && (
              <section style={{ padding: 24, borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg-card)" }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)", marginBottom: 16 }}>✨ Visual Identity & Theme</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                  {proposal.visualDirection.palette && (
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--text-3)", marginBottom: 12 }}>Color Palette</p>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                        {proposal.visualDirection.palette.map((color, idx) => (
                          <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <div style={{ width: 24, height: 24, borderRadius: 4, backgroundColor: color.hex, border: "1px solid var(--border)", flexShrink: 0 }} />
                            <p style={{ fontSize: 12, color: "var(--text-1)" }}>{color.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {proposal.concept?.theme && (
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--text-3)", marginBottom: 12 }}>Theme Direction</p>
                      <div style={{ padding: 16, borderRadius: 8, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
                        <p style={{ fontSize: 13, color: "var(--text-1)" }}>{proposal.concept.theme}</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Stage Design */}
            {proposal.stageDesign && (
              <section style={{ padding: 24, borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg-card)" }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)", marginBottom: 16 }}>🎭 Stage Design</h2>
                <div style={{ display: "grid", gap: 16 }}>
                  {proposal.stageDesign.layout && (
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", marginBottom: 8 }}>Layout</p>
                      <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>{proposal.stageDesign.layout}</p>
                    </div>
                  )}
                  {proposal.stageDesign.entryExperience && (
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", marginBottom: 8 }}>Entry Experience</p>
                      <p style={{ fontSize: 13, color: "var(--text-2)" }}>{proposal.stageDesign.entryExperience}</p>
                    </div>
                  )}
                  {proposal.stageDesign.signature && (
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", marginBottom: 8 }}>Signature Element</p>
                      <p style={{ fontSize: 13, color: "var(--text-2)" }}>{proposal.stageDesign.signature}</p>
                    </div>
                  )}
                  {proposal.stageDesign.focalPoints && proposal.stageDesign.focalPoints.length > 0 && (
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", marginBottom: 8 }}>Focal Points</p>
                      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
                        {proposal.stageDesign.focalPoints.map((fp, i) => (
                          <li key={i} style={{ fontSize: 12, color: "var(--text-2)", display: "flex", gap: 6 }}>
                            <span style={{ color: "var(--text-3)" }}>•</span>{fp}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Decor Zones */}
            {proposal.decorPlan?.zones && proposal.decorPlan.zones.length > 0 && (
              <section style={{ padding: 24, borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg-card)" }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)", marginBottom: 16 }}>🎨 Decor Zones</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
                  {proposal.decorPlan.zones.map((zone, idx) => (
                    <div key={idx} style={{ padding: 16, borderRadius: 8, background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", marginBottom: 8 }}>{zone.name}</p>
                      <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5 }}>{zone.concept}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 3D Renders */}
            {proposal.generatedVisuals && proposal.generatedVisuals.length > 0 && (
              <section style={{ padding: 24, borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg-card)" }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)", marginBottom: 16 }}>🎬 3D Event Visualization</h2>
                <div style={{ display: "grid", gap: 16 }}>
                  {proposal.generatedVisuals.map((visual, idx) => (
                    <div key={visual.id ?? idx} style={{ borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" }}>
                      <img
                        src={visual.image}
                        alt={`3D Render ${idx + 1}`}
                        style={{ width: "100%", height: "auto", display: "block" }}
                      />
                      {(visual.theme || visual.brandName) && (
                        <div style={{ padding: "8px 12px", background: "var(--bg-surface)", display: "flex", gap: 8 }}>
                          {visual.brandName && <span style={{ fontSize: 11, color: "var(--text-3)" }}>{visual.brandName}</span>}
                          {visual.theme && <span style={{ fontSize: 11, color: "var(--text-3)" }}>· {visual.theme}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Floor Plan */}
            {proposal.floorPlan && proposal.floorPlan.length > 0 && (
              <section style={{ padding: 24, borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg-card)" }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)", marginBottom: 16 }}>📐 Floor Plan & Layout</h2>
                <div style={{ height: 400, borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)", background: "#0d0e11" }}>
                  <FloorPlanViewer elements={proposal.floorPlan} />
                </div>
              </section>
            )}
          </div>
        )}

        {/* BUDGET TAB */}
        {activeTab === "budget" && hasBudget && proposal.budgetBreakdown && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <section style={{ padding: 24, borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg-card)" }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)", marginBottom: 24 }}>💰 Budget Distribution</h2>
              <div style={{ height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={proposal.budgetBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="amount"
                      nameKey="category"
                    >
                      {proposal.budgetBreakdown.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${(value as number).toLocaleString()}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section style={{ padding: 24, borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg-card)" }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)", marginBottom: 16 }}>📊 Breakdown Details</h2>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--border)" }}>
                      <th style={{ textAlign: "left", padding: "12px 0", color: "var(--text-3)", fontWeight: 700 }}>Category</th>
                      <th style={{ textAlign: "right", padding: "12px 0", color: "var(--text-3)", fontWeight: 700 }}>Amount</th>
                      <th style={{ textAlign: "right", padding: "12px 0", color: "var(--text-3)", fontWeight: 700 }}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposal.budgetBreakdown.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "12px 0", color: "var(--text-1)" }}>{item.category}</td>
                        <td style={{ textAlign: "right", padding: "12px 0", color: "var(--text-1)", fontWeight: 600 }}>
                          {formatINR(item.amount || 0)}
                        </td>
                        <td style={{ textAlign: "right", padding: "12px 0", color: "var(--text-2)" }}>
                          {item.percentage}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{
                marginTop: 20, padding: 16, borderRadius: 8,
                background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)",
                textAlign: "right",
              }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>
                  Total: {formatINR(proposal.budgetBreakdown.reduce((sum, b) => sum + (b.amount || 0), 0))}
                </p>
                <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>Including applicable taxes</p>
              </div>
            </section>
          </div>
        )}

        {/* TIMELINE TAB */}
        {activeTab === "timeline" && hasTimeline && proposal.timeline && (
          <section style={{ padding: 24, borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg-card)" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)", marginBottom: 24 }}>📅 Project Timeline</h2>
            <div>
              {proposal.timeline.map((phase, idx) => (
                <div key={idx} style={{ display: "flex", gap: 16, marginBottom: idx < proposal.timeline!.length - 1 ? 32 : 0 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 40 }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: "50%",
                      background: phase.milestone ? "#6366f1" : "var(--bg-surface)",
                      border: "2px solid " + (phase.milestone ? "#6366f1" : "var(--border)"),
                    }} />
                    {idx < proposal.timeline!.length - 1 && (
                      <div style={{ width: 2, height: 60, background: "linear-gradient(180deg, var(--border) 0%, transparent 100%)", marginTop: 8 }} />
                    )}
                  </div>
                  <div style={{ flex: 1, paddingTop: 2 }}>
                    <div style={{
                      padding: 16, borderRadius: 8,
                      background: phase.milestone ? "rgba(99,102,241,0.1)" : "var(--bg-surface)",
                      border: "1px solid " + (phase.milestone ? "rgba(99,102,241,0.2)" : "var(--border)"),
                    }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", marginBottom: 4 }}>{phase.phase}</p>
                      <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: phase.tasks?.length ? 8 : 0 }}>{phase.daysOut}</p>
                      {phase.tasks && phase.tasks.length > 0 && (
                        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                          {phase.tasks.map((task, t) => (
                            <li key={t} style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 4, display: "flex", gap: 6 }}>
                              <span style={{ color: "var(--text-3)" }}>•</span>
                              {task}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* VENDORS TAB */}
        {activeTab === "vendors" && hasVendors && proposal.vendors && (
          <section style={{ padding: 24, borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg-card)" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)", marginBottom: 24 }}>🏪 Recommended Vendors</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
              {proposal.vendors.map((vendor, idx) => (
                <div key={idx} style={{ padding: 16, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-surface)" }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", marginBottom: 4 }}>{vendor.name}</p>
                  <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: vendor.notes ? 12 : 0 }}>{vendor.category}</p>
                  {vendor.notes && <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5 }}>{vendor.notes}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* RISKS TAB */}
        {activeTab === "risks" && hasRisks && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {proposal.riskFlags && proposal.riskFlags.length > 0 && (
              <section style={{ padding: 24, borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg-card)" }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)", marginBottom: 16 }}>⚠️ Important Considerations</h2>
                <div style={{ display: "grid", gap: 12 }}>
                  {proposal.riskFlags.map((flag, idx) => (
                    <div key={idx} style={{
                      padding: 12, borderRadius: 8,
                      background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                      display: "flex", gap: 12,
                    }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
                      <p style={{ fontSize: 13, color: "var(--text-2)" }}>{flag}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {proposal.tips && proposal.tips.length > 0 && (
              <section style={{ padding: 24, borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg-card)" }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)", marginBottom: 16 }}>💡 Expert Tips</h2>
                <div style={{ display: "grid", gap: 12 }}>
                  {proposal.tips.map((tip, idx) => (
                    <div key={idx} style={{
                      padding: 12, borderRadius: 8,
                      background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
                      display: "flex", gap: 12,
                    }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
                      <p style={{ fontSize: 12, color: "var(--text-2)" }}>{tip}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
