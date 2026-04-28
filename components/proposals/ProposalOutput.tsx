"use client";

import React, { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import type {
  ProposalData, BudgetLine, TimelinePhase, ProposalVendor,
  ExperienceActivation, ColorSwatch, ProposalVersionSnapshot,
} from "@/lib/proposals";
import { formatINR, MAX_REGENERATIONS } from "@/lib/proposals";
import { useCredits } from "@/components/credits/useCredits";
import {
  generateChecklist, calcScore, deadlineState, STATUS_CONFIG,
  type ComplianceItem, type ComplianceStatus,
} from "@/lib/compliance";
import {
  PAYMENT_STATUS_STYLES,
  type ProposalPayment, type PaymentMethod, type PaymentStatus,
} from "@/lib/payments";
import ToolkitTab from "@/components/proposals/ToolkitTab";
import { useBranding } from "@/lib/branding";

type Tab = "concept" | "budget" | "timeline" | "vendors" | "risks"
         | "experience" | "visual" | "stage" | "activations" | "compliance" | "payments" | "toolkit";

// Flip to true once /api/proposals/generate-image ships (planned ~1 week
// post-launch, Google Imagen 3 backed). Until then, hide the button so
// users don't hit the missing endpoint.
const IMAGE_GEN_ENABLED = false;

type Props = {
  proposal: ProposalData;
  onChange:  (p: ProposalData) => void;
  onBack:    () => void;
  onSave:    () => void;
};

export default function ProposalOutput({ proposal, onChange, onBack, onSave }: Props) {
  const hasExperience = !!(proposal.eventConcept || proposal.selectedIdea);
  const hasVisual     = !!proposal.visualDirection;
  const hasStage      = !!(proposal.stageDesign || proposal.decorPlan);
  const hasActivations= !!proposal.experienceElements;

  const [tab,             setTab]             = useState<Tab>(hasExperience ? "experience" : "concept");
  const [saved,           setSaved]           = useState(false);
  const [saveError,       setSaveError]       = useState("");
  const [clientView,      setClientView]      = useState(false);
  const [showTplModal,    setShowTplModal]    = useState(false);
  const [templateName,    setTemplateName]    = useState(proposal.concept?.title ?? proposal.title);
  const [savingTemplate,  setSavingTemplate]  = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [linkCopied,      setLinkCopied]      = useState(false);
  const [exportOpen,      setExportOpen]      = useState(false);
  const [versionsOpen,    setVersionsOpen]    = useState(false);
  const [regenerating,    setRegenerating]    = useState(false);
  const [regenError,      setRegenError]      = useState("");
  const [duplicating,     setDuplicating]     = useState(false);
  const [lockLoading,     setLockLoading]     = useState(false);

  const credits = useCredits();
  const { branding } = useBranding();
  const regensUsed = proposal.regenerationsUsed ?? 0;
  const regensLeft = Math.max(0, MAX_REGENERATIONS - regensUsed);
  const versions   = proposal.versions ?? [];
  const activeLabel = proposal.activeVersionLabel ?? "v1";

  async function handleRegenerate() {
    if (regenerating) return;
    setRegenError("");
    setRegenerating(true);
    try {
      const res = await fetch(`/api/proposals/${proposal.id}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json?.error === "LIMIT_REACHED") {
          credits.openBuyModal();
          credits.refresh();
          return;
        }
        throw new Error(json?.message ?? json?.error ?? "Regeneration failed.");
      }
      const next = (json.data ?? json) as ProposalData;
      onChange({ ...next, budget: Number(next.budget) });
      if (typeof json.credits_remaining === "number") credits.setRemaining(json.credits_remaining);
    } catch (e: any) {
      setRegenError(e.message ?? "Something went wrong. Please try again.");
    } finally {
      setRegenerating(false);
    }
  }

  async function handleSwitchVersion(label: string) {
    if (label === activeLabel) { setVersionsOpen(false); return; }
    setVersionsOpen(false);
    setRegenError("");
    try {
      const res = await fetch(`/api/proposals/${proposal.id}/switch-version`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Could not switch version.");
      onChange({ ...(json as ProposalData), budget: Number((json as ProposalData).budget) });
    } catch (e: any) {
      setRegenError(e.message ?? "Could not switch version.");
    }
  }

  function handleExportPDF() {
    setExportOpen(false);
    setClientView(true);
    // Wait for ClientView to mount before invoking print.
    setTimeout(() => window.print(), 300);
  }

  async function handleCopyShareLink() {
    try {
      const url = `${window.location.origin}/p/${proposal.id}`;
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1800);
    } catch {
      alert("Could not copy link. Long-press to copy from the address bar instead.");
    }
  }

  function update(field: keyof ProposalData, value: any) {
    onChange({ ...proposal, [field]: value });
  }

  // Update title — works for both classic (concept.title) and Experience Generator (title only)
  function updateTitle(value: string) {
    onChange({
      ...proposal,
      title: value,
      ...(proposal.concept ? { concept: { ...proposal.concept, title: value } } : {}),
    });
  }

  async function handleSave() {
    setSaveError("");
    try {
      await api.proposals.update(proposal.id, {
        title:             proposal.title,
        concept:           proposal.concept,
        budgetBreakdown:   proposal.budgetBreakdown,
        timeline:          proposal.timeline,
        vendors:           proposal.vendors,
        riskFlags:         proposal.riskFlags,
        eventConcept:      proposal.eventConcept,
        visualDirection:   proposal.visualDirection,
        stageDesign:       proposal.stageDesign,
        decorPlan:         proposal.decorPlan,
        experienceElements:proposal.experienceElements,
        compliance:        proposal.compliance,
        status:            "SAVED",
      });
      setSaved(true);
      setTimeout(() => { setSaved(false); onSave(); }, 1200);
    } catch (err: any) {
      setSaveError(err.message ?? "Failed to save");
    }
  }

  async function handleSaveTemplate() {
    if (!templateName.trim()) return;
    setSavingTemplate(true);
    try {
      await api.proposals.saveTemplate(proposal.id, templateName.trim());
      setShowTplModal(false);
    } catch (err: any) {
      alert(err.message ?? "Failed to save template");
    } finally {
      setSavingTemplate(false);
    }
  }

  async function handleDuplicate() {
    if (duplicating) return;
    setDuplicating(true);
    try {
      const res = await api.proposals.duplicate(proposal.id) as { id: string };
      window.open(`/proposals/${res.id}`, "_blank");
    } catch (err: any) {
      alert(err.message ?? "Could not duplicate proposal.");
    } finally {
      setDuplicating(false);
    }
  }

  async function handleToggleLock() {
    if (lockLoading) return;
    setLockLoading(true);
    const next = !proposal.isLocked;
    try {
      await api.proposals.update(proposal.id, { isLocked: next });
      onChange({ ...proposal, isLocked: next });
    } catch (err: any) {
      alert(err.message ?? "Could not update lock.");
    } finally {
      setLockLoading(false);
    }
  }

  async function handleGenerateImage() {
    const dallePrompt = proposal.visualDirection?.dallePrompt;
    if (!dallePrompt) return;
    setGeneratingImage(true);
    try {
      const result = await api.proposals.generateImage({ proposalId: proposal.id, dallePrompt }) as { imageUrl: string };
      update("visualDirection", { ...proposal.visualDirection, generatedImageUrl: result.imageUrl });
    } catch (err: any) {
      alert(err.message ?? "Image generation failed");
    } finally {
      setGeneratingImage(false);
    }
  }

  function handleUploadImage(file: File) {
    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file (PNG, JPG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image is over 5MB. Please choose a smaller file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      update("visualDirection", { ...proposal.visualDirection, generatedImageUrl: dataUrl });
    };
    reader.onerror = () => alert("Failed to read image. Try again.");
    reader.readAsDataURL(file);
  }

  // ── Build tab list ─────────────────────────────────────────────────────────
  const hasVendors = !!(proposal.vendors?.length);
  const hasRisks   = !!(proposal.riskFlags?.length || proposal.tips?.length);

  const ALL_TABS: { id: Tab; label: string; icon: string; show: boolean }[] = [
    { id: "concept",     label: "Concept",       icon: "✦",  show: true },
    { id: "budget",      label: "Budget",         icon: "₹",  show: !!(proposal.budgetBreakdown?.length) },
    { id: "timeline",    label: "Timeline",       icon: "⏱", show: !!(proposal.timeline?.length) },
    { id: "vendors",     label: "Vendors",        icon: "🏪", show: hasVendors || !hasExperience },
    { id: "risks",       label: "Risks & Tips",   icon: "⚠", show: hasRisks   || !hasExperience },
    { id: "experience",  label: "Experience",     icon: "✨", show: hasExperience },
    { id: "visual",      label: "Visual",         icon: "🎨", show: hasVisual },
    { id: "stage",       label: "Stage & Decor",  icon: "🏛", show: hasStage },
    { id: "activations", label: "Activations",    icon: "⚡", show: hasActivations },
    { id: "compliance",  label: "Compliance",     icon: "⚖", show: !!proposal.eventType },
    { id: "payments",    label: "Payments",       icon: "₹", show: true },
    { id: "toolkit",     label: "AI Toolkit",     icon: "✦", show: true },
  ];
  const TABS = ALL_TABS.filter((t) => t.show);

  // ── Client View ────────────────────────────────────────────────────────────
  if (clientView) {
    return <ClientView proposal={proposal} branding={branding} onClose={() => setClientView(false)} />;
  }

  return (
    <div className="max-w-7xl mx-auto" style={{ paddingBottom: 48, display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      {proposal.clientResponse && (
        <div
          style={{
            borderRadius: 12,
            border: `1px solid ${proposal.clientResponse.action === "APPROVED" ? "rgba(16,185,129,0.28)" : "rgba(245,158,11,0.28)"}`,
            background: proposal.clientResponse.action === "APPROVED" ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)",
            padding: "12px 16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <span style={{ fontSize: 16, color: proposal.clientResponse.action === "APPROVED" ? "#34d399" : "#fbbf24" }}>
              {proposal.clientResponse.action === "APPROVED" ? "✓" : "✎"}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: proposal.clientResponse.action === "APPROVED" ? "#34d399" : "#fbbf24", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {proposal.clientResponse.action === "APPROVED" ? "Client approved" : "Client requested changes"}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-1)", marginTop: 2 }}>
                <strong>{proposal.clientResponse.clientName}</strong>
                <span style={{ color: "var(--text-3)" }}>
                  {" · "}
                  {new Date(proposal.clientResponse.respondedAt).toLocaleString("en-IN", {
                    day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit",
                  })}
                </span>
              </div>
              {proposal.clientResponse.comment && (
                <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 6, fontStyle: "italic" }}>
                  "{proposal.clientResponse.comment}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div
        className="px-4 py-4 sm:px-6 sm:py-[18px]"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 14,
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">

          {/* Title + meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <input
              value={proposal.concept?.title ?? proposal.title}
              onChange={(e) => updateTitle(e.target.value)}
              style={{
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: "-0.025em",
                lineHeight: 1.15,
                color: "var(--text-1)",
                background: "transparent",
                borderBottom: "1px solid transparent",
                outline: "none",
                width: "100%",
                transition: "border-color 0.15s",
                paddingBottom: 2,
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.borderBottomColor = "var(--border)")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.borderBottomColor = "transparent")}
              onFocus={(e) => ((e.target as HTMLElement).style.borderBottomColor = "rgba(99,102,241,0.45)")}
              onBlur={(e) => ((e.target as HTMLElement).style.borderBottomColor = "transparent")}
            />
            <div className="flex items-center flex-wrap" style={{ gap: "6px 10px", marginTop: 10 }}>
              <span className="eyebrow" style={{ color: "var(--text-3)" }}>{proposal.eventType}</span>
              <span style={{ color: "var(--border-hi)", fontSize: 10 }}>·</span>
              <span className="eyebrow" style={{ color: "var(--text-3)" }}>{proposal.location}</span>
              <span style={{ color: "var(--border-hi)", fontSize: 10 }}>·</span>
              <span
                className="t-num"
                style={{ fontSize: 13, fontWeight: 700, color: "#a5b4fc" }}
              >
                {formatINR(proposal.budget)}
              </span>
            </div>
          </div>

          {/* Actions — wraps on mobile so all 8 buttons stay tappable */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-start sm:justify-end -mx-1 px-1 overflow-x-auto sm:overflow-visible">
            <button onClick={onBack} className="btn-ghost">
              ← Back
            </button>

            {/* Version chip + dropdown */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setVersionsOpen((v) => !v)}
                title={versions.length ? `Switch between ${versions.length + 1} versions` : "Only one version so far"}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 12px",
                  borderRadius: 9,
                  border: "1px solid var(--border)",
                  background: "var(--bg-surface)",
                  color: "var(--text-2)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: versions.length ? "pointer" : "default",
                  opacity: versions.length ? 1 : 0.6,
                }}
                disabled={versions.length === 0}
              >
                {activeLabel} <span style={{ fontSize: 10, opacity: 0.6 }}>▾</span>
              </button>
              {versionsOpen && versions.length > 0 && (
                <>
                  <div onClick={() => setVersionsOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      right: 0,
                      zIndex: 50,
                      minWidth: 220,
                      maxHeight: 280,
                      overflowY: "auto",
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                      background: "var(--bg-card)",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
                      padding: 6,
                    }}
                  >
                    <div style={{ padding: "6px 10px", fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      Active
                    </div>
                    <div style={{ padding: "8px 10px", borderRadius: 6, color: "#a5b4fc", fontSize: 13, fontWeight: 600 }}>
                      {activeLabel} (current)
                    </div>
                    <div style={{ padding: "6px 10px", marginTop: 4, fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      History
                    </div>
                    {versions.map((v: ProposalVersionSnapshot) => (
                      <button
                        key={v.label}
                        onClick={() => handleSwitchVersion(v.label)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "8px 10px",
                          borderRadius: 6,
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--text-1)",
                          fontSize: 13,
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--bg-surface)")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                      >
                        <span style={{ fontWeight: 600 }}>{v.label} · {v.title}</span>
                        <span style={{ fontSize: 11, color: "var(--text-3)" }}>
                          {new Date(v.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Regenerate */}
            <button
              onClick={handleRegenerate}
              disabled={regenerating || regensLeft <= 0}
              title={regensLeft <= 0 ? "Regeneration limit reached for this proposal" : `Regenerate this proposal (2 credits) — ${regensLeft} of ${MAX_REGENERATIONS} left`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 13px",
                borderRadius: 9,
                border: "1px solid rgba(99,102,241,0.3)",
                background: regenerating ? "rgba(99,102,241,0.18)" : "rgba(99,102,241,0.08)",
                color: "#a5b4fc",
                fontSize: 13,
                fontWeight: 600,
                cursor: (regenerating || regensLeft <= 0) ? "not-allowed" : "pointer",
                opacity: regensLeft <= 0 ? 0.45 : 1,
                transition: "all 0.15s",
              }}
            >
              {regenerating ? (
                <>
                  <span className="w-3 h-3 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin" />
                  Regenerating…
                </>
              ) : (
                <>↺ Regenerate <span style={{ opacity: 0.55, fontWeight: 500 }}>({regensLeft}/{MAX_REGENERATIONS})</span></>
              )}
            </button>

            <button
              onClick={() => setClientView(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 13px",
                borderRadius: 9,
                border: "1px solid rgba(139,92,246,0.25)",
                background: "rgba(139,92,246,0.08)",
                color: "#c4b5fd",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <span>◈</span> Client View
            </button>
            <button
              onClick={handleCopyShareLink}
              title="Copy a shareable link to send to your client"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 13px",
                borderRadius: 9,
                border: linkCopied ? "1px solid rgba(34,197,94,0.28)" : "1px solid var(--border)",
                background: linkCopied ? "rgba(34,197,94,0.12)" : "var(--bg-surface)",
                color: linkCopied ? "#4ade80" : "var(--text-1)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {linkCopied ? <>✓ Link copied</> : <>🔗 Copy share link</>}
            </button>
            <button onClick={() => setShowTplModal(true)} className="btn-ghost">
              Save Template
            </button>
            <button
              onClick={handleDuplicate}
              disabled={duplicating}
              title="Duplicate as a new independent proposal"
              className="btn-ghost"
            >
              {duplicating ? "…" : "📄 Duplicate"}
            </button>
            <button
              onClick={handleToggleLock}
              disabled={lockLoading}
              title={proposal.isLocked ? "Unlock this proposal to allow edits" : "Lock this version to prevent changes"}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "8px 12px",
                borderRadius: 9,
                border: proposal.isLocked ? "1px solid rgba(245,158,11,0.35)" : "1px solid var(--border)",
                background: proposal.isLocked ? "rgba(245,158,11,0.08)" : "transparent",
                color: proposal.isLocked ? "#fbbf24" : "var(--text-3)",
                fontSize: 13,
                fontWeight: 600,
                cursor: lockLoading ? "not-allowed" : "pointer",
                transition: "all 0.15s",
              }}
            >
              {lockLoading ? "…" : proposal.isLocked ? "🔒 Locked" : "🔒 Lock"}
            </button>
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setExportOpen((v) => !v)}
                className="btn-ghost"
                aria-expanded={exportOpen}
              >
                Export ▾
              </button>
              {exportOpen && (
                <>
                  <div
                    onClick={() => setExportOpen(false)}
                    style={{ position: "fixed", inset: 0, zIndex: 40 }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      right: 0,
                      zIndex: 50,
                      minWidth: 220,
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                      background: "var(--bg-card)",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
                      padding: 6,
                    }}
                  >
                    <button onClick={handleExportPDF} className="export-row">
                      <span>📄</span>
                      <div style={{ flex: 1, textAlign: "left" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>Export as PDF</div>
                        <div style={{ fontSize: 11, color: "var(--text-3)" }}>Opens print dialog · save as PDF</div>
                      </div>
                    </button>
                    <button
                      onClick={() => { setExportOpen(false); window.location.href = `/proposals/${proposal.id}/pitch-deck`; }}
                      className="export-row"
                      title="Create a pitch deck and export as PowerPoint"
                    >
                      <span>🎯</span>
                      <div style={{ flex: 1, textAlign: "left" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>Create Pitch Deck (.pptx)</div>
                        <div style={{ fontSize: 11, color: "var(--text-3)" }}>AI-generated slides · editable · download</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
              <style jsx>{`
                .export-row {
                  width: 100%;
                  display: flex;
                  align-items: center;
                  gap: 10px;
                  padding: 10px 12px;
                  border-radius: 8px;
                  background: transparent;
                  border: 1px solid transparent;
                  cursor: pointer;
                  text-align: left;
                  transition: background 0.12s;
                }
                .export-row:hover:not(:disabled) {
                  background: var(--bg-surface);
                }
                .export-row:disabled {
                  cursor: not-allowed;
                  opacity: 0.55;
                }
              `}</style>
            </div>
            <button
              onClick={() => window.location.href = `/proposals/${proposal.id}/pitch-deck`}
              title="Create a client-ready pitch deck from this proposal"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 13px",
                borderRadius: 9,
                border: "1px solid rgba(245,158,11,0.3)",
                background: "rgba(245,158,11,0.07)",
                color: "#fbbf24",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              🎯 Pitch Deck
            </button>
            <button
              onClick={handleSave}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
                ...(saved
                  ? {
                      background: "rgba(34,197,94,0.12)",
                      border: "1px solid rgba(34,197,94,0.28)",
                      color: "#4ade80",
                    }
                  : {
                      background: "var(--accent)",
                      border: "1px solid transparent",
                      color: "#fff",
                      boxShadow: "var(--shadow-accent)",
                    }),
              }}
            >
              {saved ? "✓ Saved" : "Save Proposal"}
            </button>
          </div>
        </div>
      </div>

      {/* Branding strip — shown when the planner has set company_name or logo */}
      {(branding.logo_url || branding.company_name) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 16px",
            borderRadius: 10,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          {branding.logo_url && (
            <img
              src={branding.logo_url}
              alt="Logo"
              style={{ width: 32, height: 32, objectFit: "contain", borderRadius: 6, flexShrink: 0 }}
            />
          )}
          <div style={{ minWidth: 0 }}>
            {branding.company_name && (
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", lineHeight: 1.2 }}>
                {branding.company_name}
              </p>
            )}
            {(branding.phone_number || branding.address) && (
              <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
                {[branding.phone_number, branding.address].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Save error */}
      {saveError && (
        <div
          className="flex items-center justify-between gap-4"
          style={{
            padding: "11px 16px",
            borderRadius: 10,
            background: "var(--red-dim)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#fca5a5",
            fontSize: 13.5,
          }}
        >
          <span>{saveError}</span>
          <button
            onClick={() => setSaveError("")}
            style={{ color: "rgba(252,165,165,0.5)", fontSize: 11, background: "none", border: "none", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
      )}

      {regenError && (
        <div
          className="flex items-center justify-between gap-4"
          style={{
            padding: "11px 16px",
            borderRadius: 10,
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.25)",
            color: "#fbbf24",
            fontSize: 13.5,
          }}
        >
          <span>{regenError}</span>
          <button
            onClick={() => setRegenError("")}
            style={{ color: "rgba(251,191,36,0.5)", fontSize: 11, background: "none", border: "none", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Isolation / lock notice ──────────────────────────────────────────── */}
      {proposal.isLocked ? (
        <div
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            background: "rgba(245,158,11,0.07)",
            border: "1px solid rgba(245,158,11,0.28)",
            color: "#fbbf24",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <span>🔒 This proposal is locked. Unlock it to make edits.</span>
          <button
            onClick={handleToggleLock}
            style={{ fontSize: 12, color: "#fbbf24", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}
          >
            Unlock
          </button>
        </div>
      ) : proposal.batchId ? (
        <div
          style={{
            padding: "8px 14px",
            borderRadius: 9,
            border: "1px solid rgba(99,102,241,0.15)",
            background: "rgba(99,102,241,0.04)",
            color: "var(--text-3)",
            fontSize: 12.5,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ color: "#a5b4fc" }}>⚡</span>
          Edits apply only to this proposal — others in the batch are unaffected.
          <a
            href={`/proposals/batch/${proposal.batchId}`}
            style={{ marginLeft: "auto", color: "#a5b4fc", textDecoration: "underline", textUnderlineOffset: 3, fontSize: 12, whiteSpace: "nowrap" }}
          >
            View batch →
          </a>
        </div>
      ) : null}

      {/* ── Tab bar ──────────────────────────────────────────────────────────── */}
      <div style={{ overflowX: "auto" }}>
        <div className="tab-bar" style={{ width: "fit-content", minWidth: "100%" }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`tab-item${tab === t.id ? " active" : ""}`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div
        style={{
          borderRadius: 14,
          border: "1px solid var(--border)",
          background: "var(--bg-card)",
          overflow: "hidden",
        }}
      >
        {tab === "concept"     && <ConceptTab      proposal={proposal} update={update} />}
        {tab === "budget"      && <BudgetTab       proposal={proposal} update={update} />}
        {tab === "timeline"    && <TimelineTab     proposal={proposal} update={update} />}
        {tab === "vendors"     && <VendorsTab      proposal={proposal} update={update} />}
        {tab === "risks"       && <RisksTab        proposal={proposal} update={update} />}
        {tab === "experience"  && <ExperienceTab   proposal={proposal} update={update} />}
        {tab === "visual"      && (
          <VisualTab
            proposal={proposal}
            update={update}
            onGenerateImage={handleGenerateImage}
            onUploadImage={handleUploadImage}
            generatingImage={generatingImage}
          />
        )}
        {tab === "stage"       && <StageTab        proposal={proposal} update={update} />}
        {tab === "activations" && <ActivationsTab  proposal={proposal} update={update} />}
        {tab === "compliance"  && <ComplianceTab   proposal={proposal} update={update} />}
        {tab === "payments"    && <PaymentsTab     proposal={proposal} />}
        {tab === "toolkit"     && <ToolkitTab />}
      </div>

      {/* ── Save as Template modal ─────────────────────────────────────────── */}
      {showTplModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
        >
          <div
            className="animate-scale-in"
            style={{
              width: "100%",
              maxWidth: 440,
              borderRadius: 16,
              border: "1px solid var(--border-mid)",
              background: "var(--bg-raised)",
              padding: "28px 28px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div>
              <h3 className="t-heading" style={{ marginBottom: 6 }}>Save as Template</h3>
              <p className="t-body">
                Templates can be reused when generating new proposals. The current proposal will be cloned.
              </p>
            </div>
            <div>
              <label className="field-label">Template name</label>
              <input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="input"
                placeholder="e.g. Corporate Gala Premium"
                autoFocus
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowTplModal(false)}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={savingTemplate || !templateName.trim()}
                className="btn-primary"
                style={{ fontSize: 13.5 }}
              >
                {savingTemplate ? "Saving…" : "Save Template"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Client View (pitch-ready) ──────────────────────────────────────────────────
const CV_COLORS = ["#6366f1","#8b5cf6","#06b6d4","#10b981","#f59e0b","#ef4444","#ec4899","#14b8a6"];

function CvSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-6">
      <div className="cv-section-rule">
        <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-400 shrink-0">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export function ClientView({ proposal, branding, onClose }: { proposal: ProposalData; branding?: import("@/lib/branding").Branding; onClose?: () => void }) {
  const c  = proposal.concept;
  const ec = proposal.eventConcept;
  const vd = proposal.visualDirection;
  const ee = proposal.experienceElements;
  const sd = proposal.stageDesign;
  const dp = proposal.decorPlan;
  const budget = proposal.budgetBreakdown ?? [];
  const timeline = proposal.timeline ?? [];

  const title   = c?.title   ?? proposal.title;
  const tagline = c?.tagline ?? ec?.tagline;
  const desc    = c?.description ?? ec?.storyline;
  const theme   = c?.theme ?? ec?.theme;

  return (
    <div className="cv-root min-h-screen bg-[#07070c] text-white font-[var(--font-geist-sans)]">
      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 18mm; }
          .cv-root { background: #fff !important; color: #111 !important; }
          .cv-no-print { display: none !important; }
          .cv-root * { color: #111 !important; }
          .cv-root .text-transparent { color: #111 !important; -webkit-background-clip: initial !important; background: none !important; }
          html, body { background: #fff !important; }
        }
      `}</style>

      {/* ── Exit bar ── */}
      <div className="cv-no-print sticky top-0 z-50 flex items-center justify-between px-8 py-3.5 bg-[#07070c]/90 backdrop-blur-xl border-b border-white/6">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[10px] font-black">K</div>
          <span className="text-white/30 text-xs uppercase tracking-[0.15em]">Kunjara · Proposal Deck</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 text-white/40 hover:text-white hover:border-white/20 text-xs transition-all"
          >
            <span>✕</span> Exit Preview
          </button>
        )}
      </div>

      <div className="max-w-[860px] mx-auto px-6 sm:px-10 py-20 space-y-24">

        {/* ── HERO ── */}
        <div className="text-center space-y-5">
          {/* Planner branding */}
          {(branding?.logo_url || branding?.company_name) && (
            <div className="flex flex-col items-center gap-2 mb-2">
              {branding.logo_url && (
                <img
                  src={branding.logo_url}
                  alt={branding.company_name || "Logo"}
                  className="h-12 w-auto object-contain"
                  style={{ maxWidth: 160 }}
                />
              )}
              {branding.company_name && (
                <p className="text-white/30 text-xs font-semibold uppercase tracking-[0.15em]">
                  {branding.company_name}
                </p>
              )}
            </div>
          )}

          {/* Event type badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/25 bg-indigo-500/8 text-indigo-400 text-xs font-semibold uppercase tracking-[0.15em]">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            {proposal.eventType}
          </div>

          {/* Title */}
          <h1 className="text-5xl sm:text-6xl font-black leading-[1.05] tracking-tight bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
            {title}
          </h1>

          {/* Tagline */}
          {tagline && (
            <p className="text-xl sm:text-2xl text-indigo-300 italic font-light leading-snug max-w-xl mx-auto">
              "{tagline}"
            </p>
          )}

          {/* Theme pill */}
          {theme && (
            <div className="inline-block px-4 py-1 rounded-full bg-white/5 border border-white/8 text-white/50 text-sm">
              {theme}
            </div>
          )}

          {/* Meta row */}
          <div className="flex items-center justify-center gap-4 pt-2 text-sm">
            <span className="flex items-center gap-1.5 text-white/40">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {proposal.location}
            </span>
            <span className="text-white/15">·</span>
            <span className="text-indigo-400 font-bold text-base">{formatINR(proposal.budget)}</span>
            {proposal.requirements && (
              <>
                <span className="text-white/15">·</span>
                <span className="text-white/30 text-xs italic max-w-[200px] truncate">{proposal.eventType}</span>
              </>
            )}
          </div>
        </div>

        {/* ── VISUAL ── */}
        {vd?.generatedImageUrl && (
          <div className="rounded-2xl overflow-hidden border border-white/8 shadow-2xl shadow-black/80">
            <img
              src={vd.generatedImageUrl}
              alt="Event Visual Direction"
              className="w-full object-cover"
              style={{ maxHeight: "520px" }}
            />
          </div>
        )}

        {/* ── DESCRIPTION ── */}
        {desc && !ec && (
          <CvSection title="The Concept">
            <p className="text-white/75 text-lg leading-relaxed">{desc}</p>
          </CvSection>
        )}

        {/* ── EXPERIENCE NARRATIVE ── */}
        {ec && (
          <CvSection title="The Experience">
            <p className="text-white/75 text-lg leading-relaxed">{ec.storyline}</p>

            {/* Emotional Journey */}
            {ec.emotionalJourney?.length > 0 && (
              <div>
                <p className="text-white/30 text-xs uppercase tracking-[0.15em] mb-4">Guest Emotional Journey</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {ec.emotionalJourney.map((beat, i) => (
                    <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 text-center space-y-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold mx-auto">
                        {i + 1}
                      </div>
                      <p className="text-white/65 text-xs leading-relaxed">{beat}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CvSection>
        )}

        {/* ── HIGHLIGHTS (classic proposals) ── */}
        {c?.highlights && c.highlights.length > 0 && (
          <CvSection title="Event Highlights">
            <div className="grid gap-3 sm:grid-cols-2">
              {c.highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-white/6 bg-white/3">
                  <span className="text-indigo-400 font-black text-lg shrink-0 leading-none mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                  <p className="text-white/80 text-sm leading-relaxed">{h}</p>
                </div>
              ))}
            </div>
          </CvSection>
        )}

        {/* ── ACTIVATIONS (experience proposals) ── */}
        {ee?.activations && ee.activations.length > 0 && (
          <CvSection title="Experience Activations">
            <div className="grid gap-3 sm:grid-cols-2">
              {ee.activations.map((act, i) => {
                const typeColor: Record<string, string> = {
                  ACTIVE: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
                  PASSIVE: "text-slate-300 bg-slate-500/10 border-slate-500/20",
                  SOCIAL: "text-violet-400 bg-violet-500/10 border-violet-500/20",
                  COMPETITIVE: "text-orange-400 bg-orange-500/10 border-orange-500/20",
                };
                return (
                  <div key={i} className="rounded-xl border border-white/6 bg-white/3 p-5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-white font-semibold text-sm">{act.name}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${typeColor[act.engagementType] ?? "text-white/40 bg-white/5 border-white/10"}`}>
                        {act.engagementType.toLowerCase()}
                      </span>
                    </div>
                    <p className="text-white/50 text-xs leading-relaxed">{act.description}</p>
                  </div>
                );
              })}
            </div>
            {ee.techElements?.length > 0 && (
              <div>
                <p className="text-white/30 text-xs uppercase tracking-[0.15em] mb-3">Tech Elements</p>
                <div className="flex flex-wrap gap-2">
                  {ee.techElements.map((t, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/8 text-cyan-300 text-xs">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </CvSection>
        )}

        {/* ── VISUAL DIRECTION ── */}
        {vd && (vd.palette?.length > 0 || vd.overallAesthetic) && (
          <CvSection title="Visual Direction">
            {vd.overallAesthetic && (
              <p className="text-white/65 leading-relaxed">{vd.overallAesthetic}</p>
            )}
            {vd.palette && vd.palette.length > 0 && (
              <div>
                <p className="text-white/30 text-xs uppercase tracking-[0.15em] mb-4">Colour Palette</p>
                <div className="flex flex-wrap gap-4">
                  {vd.palette.map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className="w-14 h-14 rounded-xl border border-white/10 shadow-xl"
                        style={{ backgroundColor: s.hex }}
                      />
                      <div>
                        <p className="text-white text-sm font-medium">{s.name}</p>
                        <p className="text-white/30 text-xs font-mono">{s.hex}</p>
                        <p className="text-white/40 text-xs italic mt-0.5">{s.usage}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {vd.lighting && (
              <p className="text-white/40 text-sm italic border-l-2 border-indigo-500/40 pl-4">{vd.lighting}</p>
            )}
          </CvSection>
        )}

        {/* ── STAGE & DECOR ── */}
        {(sd || dp) && (
          <CvSection title="Stage & Décor">
            {sd?.signature && (
              <div className="rounded-xl border border-indigo-500/15 bg-indigo-500/5 p-5">
                <p className="text-indigo-400 text-xs uppercase tracking-wider mb-1.5">Signature Installation</p>
                <p className="text-white font-semibold">{sd.signature}</p>
                {sd.entryExperience && (
                  <p className="text-white/50 text-sm mt-2 italic">Entry: {sd.entryExperience}</p>
                )}
              </div>
            )}
            {dp?.zones && dp.zones.length > 0 && (
              <div>
                <p className="text-white/30 text-xs uppercase tracking-[0.15em] mb-3">Zone Plan</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {dp.zones.map((z, i) => (
                    <div key={i} className="rounded-xl border border-white/6 bg-white/3 p-4">
                      <p className="text-indigo-300 text-xs font-semibold uppercase tracking-wide mb-1.5">{z.name}</p>
                      <p className="text-white/55 text-xs leading-relaxed">{z.concept}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {dp?.hero && (
              <p className="text-white/50 text-sm italic border-l-2 border-white/10 pl-4">Hero: {dp.hero}</p>
            )}
          </CvSection>
        )}

        {/* ── INVESTMENT BREAKDOWN ── */}
        {budget.length > 0 && (
          <CvSection title="Investment Breakdown">
            {/* Stacked bar */}
            <div className="h-3 rounded-full overflow-hidden flex">
              {budget.map((line, i) => (
                <div
                  key={i}
                  style={{ width: `${line.percentage}%`, backgroundColor: CV_COLORS[i % CV_COLORS.length] }}
                  title={`${line.category}: ${line.percentage}%`}
                />
              ))}
            </div>

            {/* Category list */}
            <div className="grid gap-2.5 sm:grid-cols-2">
              {budget.map((line, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl border border-white/6 bg-white/3">
                  <div
                    className="w-3 h-3 rounded-full shrink-0 mt-1"
                    style={{ backgroundColor: CV_COLORS[i % CV_COLORS.length] }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold">{line.category}</p>
                    <p className="text-white/35 text-xs mt-0.5 leading-relaxed">{line.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-white font-bold text-sm">{formatINR(line.amount)}</p>
                    <p className="text-white/30 text-xs">{line.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between px-5 py-4 rounded-xl bg-indigo-500/8 border border-indigo-500/20">
              <span className="text-white/60 font-medium text-sm uppercase tracking-wider">Total Investment</span>
              <span className="text-3xl font-black text-indigo-400">{formatINR(proposal.budget)}</span>
            </div>
          </CvSection>
        )}

        {/* ── TIMELINE ── */}
        {timeline.length > 0 && (
          <CvSection title="Execution Timeline">
            <div className="space-y-4">
              {timeline.map((phase, i) => (
                <div key={i} className="flex gap-5">
                  <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                      phase.milestone
                        ? "border-indigo-500 bg-indigo-500/15 text-indigo-400"
                        : "border-white/15 bg-white/3 text-white/30"
                    }`}>
                      {i + 1}
                    </div>
                    {i < timeline.length - 1 && (
                      <div className={`w-px flex-1 min-h-[24px] ${phase.milestone ? "bg-indigo-500/30" : "bg-white/8"}`} />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="text-white font-semibold text-sm">{phase.phase}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-white/35">{phase.daysOut}</span>
                      {phase.milestone && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 font-semibold">Milestone</span>
                      )}
                    </div>
                    <ul className="space-y-1">
                      {phase.tasks.map((task, j) => (
                        <li key={j} className="flex items-start gap-2 text-white/45 text-xs">
                          <span className="text-white/20 mt-0.5 shrink-0">▸</span>
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </CvSection>
        )}

        {/* ── FOOTER ── */}
        <div className="border-t border-white/6 pt-10 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            {branding?.logo_url ? (
              <img
                src={branding.logo_url}
                alt="Logo"
                className="w-8 h-8 object-contain rounded-lg"
                style={{ background: "rgba(255,255,255,0.06)" }}
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-black">K</div>
            )}
            <div>
              <p className="text-white/50 text-xs font-semibold">
                {branding?.company_name || "Kunjara"}
              </p>
              <p className="text-white/25 text-xs">
                {[branding?.phone_number, branding?.address].filter(Boolean).join(" · ") || "Event Intelligence Platform"}
              </p>
            </div>
          </div>
          <p className="text-white/15 text-xs uppercase tracking-widest">Confidential</p>
        </div>

      </div>
    </div>
  );
}

// ── Shared inner helpers ───────────────────────────────────────────────────────
function TabSection({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p className="eyebrow" style={{ marginBottom: 6 }}>{eyebrow}</p>
      <h4 className="t-heading">{title}</h4>
    </div>
  );
}

// ── Experience Tab ─────────────────────────────────────────────────────────────
function ExperienceTab({ proposal, update }: { proposal: ProposalData; update: (f: keyof ProposalData, v: any) => void }) {
  const idea = proposal.selectedIdea;
  const ec   = proposal.eventConcept;

  return (
    <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Selected concept hero */}
      {idea && (
        <div>
          <TabSection eyebrow="Selected Concept" title={idea.title} />
          <div
            style={{
              borderRadius: 14,
              border: "1px solid rgba(99,102,241,0.25)",
              background: "rgba(99,102,241,0.05)",
              overflow: "hidden",
            }}
          >
            {/* Score row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px",
                borderBottom: "1px solid rgba(99,102,241,0.12)",
              }}
            >
              <p className="t-body" style={{ maxWidth: 560 }}>{idea.concept}</p>
              <div style={{ textAlign: "right", paddingLeft: 24, flexShrink: 0 }}>
                <p style={{ fontSize: 42, fontWeight: 800, color: "#a5b4fc", lineHeight: 1, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
                  {idea.score.overall.toFixed(1)}
                </p>
                <p className="eyebrow" style={{ marginTop: 4 }}>Overall</p>
              </div>
            </div>
            {/* Score grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", borderBottom: "1px solid rgba(99,102,241,0.12)" }}>
              {[
                { label: "Uniqueness",  v: idea.score.uniqueness },
                { label: "Engagement",  v: idea.score.engagement },
                { label: "Budget Fit",  v: idea.score.budgetFit  },
              ].map(({ label, v }, idx) => (
                <div
                  key={label}
                  style={{
                    padding: "16px 20px",
                    borderRight: idx < 2 ? "1px solid rgba(99,102,241,0.12)" : "none",
                  }}
                >
                  <p style={{ fontSize: 24, fontWeight: 700, color: "#ededf0", fontVariantNumeric: "tabular-nums", lineHeight: 1, marginBottom: 4 }}>{v}<span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-3)" }}>/10</span></p>
                  <p className="eyebrow">{label}</p>
                </div>
              ))}
            </div>
            {/* Wow factor */}
            <div style={{ padding: "16px 24px" }}>
              <p className="eyebrow" style={{ marginBottom: 6 }}>Wow Factor</p>
              <p className="t-body">{idea.wowFactor}</p>
            </div>
          </div>
        </div>
      )}

      {/* Storyline & theme */}
      {ec && (
        <div>
          <TabSection eyebrow="Event Narrative" title="Storyline & Theme" />
          <div
            style={{
              borderRadius: 14,
              border: "1px solid var(--border)",
              background: "var(--bg-surface)",
              overflow: "hidden",
            }}
          >
            {/* Theme + tagline row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div style={{ padding: "18px 22px", borderRight: "1px solid var(--border)" }}>
                <p className="eyebrow" style={{ marginBottom: 8 }}>Theme</p>
                <EditableText
                  value={ec.theme}
                  onChange={(v) => update("eventConcept", { ...ec, theme: v })}
                  className="t-title"
                  placeholder="Event theme..."
                />
              </div>
              <div style={{ padding: "18px 22px" }}>
                <p className="eyebrow" style={{ marginBottom: 8 }}>Tagline</p>
                <EditableText
                  value={ec.tagline}
                  onChange={(v) => update("eventConcept", { ...ec, tagline: v })}
                  style={{ fontSize: 15, fontStyle: "italic", color: "#a5b4fc" }}
                  placeholder="Tagline..."
                />
              </div>
            </div>
            {/* Storyline */}
            <div style={{ padding: "20px 22px" }}>
              <p className="eyebrow" style={{ marginBottom: 8 }}>Narrative</p>
              <EditableTextarea
                value={ec.storyline}
                onChange={(v) => update("eventConcept", { ...ec, storyline: v })}
                className="t-body"
                placeholder="Describe the experience narrative..."
              />
            </div>
          </div>

          {/* Emotional journey */}
          {ec.emotionalJourney?.length > 0 && (
            <div style={{ marginTop: 28 }}>
              <p className="eyebrow" style={{ marginBottom: 14 }}>Emotional Journey</p>
              <div style={{ display: "flex", gap: 0, position: "relative" }}>
                {/* connector line */}
                <div
                  style={{
                    position: "absolute",
                    top: 18,
                    left: 18,
                    right: 18,
                    height: 1,
                    background: "linear-gradient(90deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))",
                  }}
                />
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${ec.emotionalJourney.length}, 1fr)`, gap: 12, width: "100%", position: "relative" }}>
                  {ec.emotionalJourney.map((beat, i) => (
                    <div
                      key={i}
                      style={{
                        borderRadius: 12,
                        border: "1px solid var(--border)",
                        background: "var(--bg-card)",
                        padding: "16px 14px",
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: "rgba(99,102,241,0.15)",
                          border: "1px solid rgba(99,102,241,0.3)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: 10,
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#a5b4fc",
                        }}
                      >
                        {i + 1}
                      </div>
                      <EditableText
                        value={beat}
                        onChange={(v) => {
                          const next = [...ec.emotionalJourney];
                          next[i] = v;
                          update("eventConcept", { ...ec, emotionalJourney: next });
                        }}
                        className="t-body"
                        style={{ fontSize: 12.5 }}
                        placeholder="Emotional beat..."
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Visual Tab ─────────────────────────────────────────────────────────────────
function VisualTab({
  proposal, update, onGenerateImage, onUploadImage, generatingImage,
}: {
  proposal: ProposalData;
  update: (f: keyof ProposalData, v: any) => void;
  onGenerateImage: () => void;
  onUploadImage: (file: File) => void;
  generatingImage: boolean;
}) {
  const vd = proposal.visualDirection;
  const fileRef = useRef<HTMLInputElement>(null);
  if (!vd) return <div style={{ padding: 28 }} className="t-caption">No visual direction data.</div>;

  function pickFile() {
    fileRef.current?.click();
  }
  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) onUploadImage(f);
    e.target.value = "";
  }

  const generateBtnStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "8px 14px",
    borderRadius: 9,
    border: "1px solid rgba(139,92,246,0.3)",
    background: "rgba(139,92,246,0.1)",
    color: "#c4b5fd",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    flexShrink: 0,
  };
  const uploadBtnStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "8px 14px",
    borderRadius: 9,
    border: "1px solid var(--border)",
    background: "var(--bg-surface)",
    color: "var(--text-1)",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    flexShrink: 0,
  };

  return (
    <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: 36 }}>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={onFileChange}
        style={{ display: "none" }}
      />

      {/* Generated image */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
          <TabSection eyebrow="Visual Identity" title="Event Visual" />
          {!vd.generatedImageUrl && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {IMAGE_GEN_ENABLED ? (
                vd.dallePrompt && (
                  <button
                    onClick={onGenerateImage}
                    disabled={generatingImage}
                    style={{ ...generateBtnStyle, opacity: generatingImage ? 0.5 : 1 }}
                  >
                    {generatingImage ? (
                      <>
                        <span className="w-3 h-3 rounded-full border-2 border-violet-400/30 border-t-violet-400 animate-spin" />
                        Generating…
                      </>
                    ) : (
                      <>✦ Generate Image</>
                    )}
                  </button>
                )
              ) : (
                <button
                  disabled
                  title="Imagen 3 image generation — coming soon"
                  style={{ ...generateBtnStyle, opacity: 0.5, cursor: "not-allowed" }}
                >
                  ✦ Generate Image · soon
                </button>
              )}
              <button onClick={pickFile} style={uploadBtnStyle}>
                ⤴ Upload your own
              </button>
            </div>
          )}
        </div>
        {vd.generatedImageUrl ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid var(--border)" }}>
              <img src={vd.generatedImageUrl} alt="Event visual" className="w-full object-cover" />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <p className="t-caption" style={{ display: "flex", alignItems: "center", gap: 6, fontStyle: "italic", margin: 0 }}>
                <span style={{ color: "rgba(245,158,11,0.7)" }}>⚠</span>
                AI-generated image URLs expire after ~1 hour. Download and re-upload if sharing externally.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={pickFile} style={uploadBtnStyle}>⤴ Replace</button>
                <button
                  onClick={() => update("visualDirection", { ...vd, generatedImageUrl: undefined })}
                  style={{ ...uploadBtnStyle, color: "var(--text-2)" }}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              borderRadius: 14,
              border: "1px dashed var(--border-mid)",
              background: "var(--bg-surface)",
              padding: "48px 24px",
              textAlign: "center",
            }}
          >
            <p className="t-caption">
              Upload your own image or design — AI generation coming soon.
            </p>
          </div>
        )}
      </div>

      {/* Colour palette */}
      {vd.palette?.length > 0 && (
        <div>
          <TabSection eyebrow="Design System" title="Colour Palette" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {vd.palette.map((swatch: ColorSwatch, i: number) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 18px",
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--bg-surface)",
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                    backgroundColor: swatch.hex,
                    flexShrink: 0,
                  }}
                />
                <div>
                  <p className="t-title" style={{ marginBottom: 2 }}>{swatch.name}</p>
                  <p className="t-caption" style={{ fontFamily: "var(--font-mono)", marginBottom: 2 }}>{swatch.hex}</p>
                  <p className="t-caption" style={{ fontStyle: "italic" }}>{swatch.usage}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aesthetic & lighting */}
      {(vd.overallAesthetic || vd.lighting) && (
        <div>
          <TabSection eyebrow="Atmosphere" title="Aesthetic & Lighting" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {vd.overallAesthetic && (
              <div style={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg-surface)", padding: "18px 20px" }}>
                <p className="eyebrow" style={{ marginBottom: 10 }}>Overall Aesthetic</p>
                <EditableTextarea
                  value={vd.overallAesthetic}
                  onChange={(v) => update("visualDirection", { ...vd, overallAesthetic: v })}
                  className="t-body"
                  placeholder="Describe the aesthetic..."
                />
              </div>
            )}
            {vd.lighting && (
              <div style={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg-surface)", padding: "18px 20px" }}>
                <p className="eyebrow" style={{ marginBottom: 10 }}>Lighting Direction</p>
                <EditableTextarea
                  value={vd.lighting}
                  onChange={(v) => update("visualDirection", { ...vd, lighting: v })}
                  className="t-body"
                  placeholder="Describe lighting..."
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Stage & Decor Tab ──────────────────────────────────────────────────────────
function StageTab({ proposal, update }: { proposal: ProposalData; update: (f: keyof ProposalData, v: any) => void }) {
  const sd = proposal.stageDesign;
  const dp = proposal.decorPlan;

  return (
    <div className="p-6 space-y-6">
      {sd && (
        <div>
          <h4 className="text-[var(--text-1)] font-semibold text-sm mb-3">Stage Design</h4>
          <div className="space-y-3">
            <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] p-4 grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[var(--text-3)] mb-1.5">Layout</p>
                <EditableText
                  value={sd.layout}
                  onChange={(v) => update("stageDesign", { ...sd, layout: v })}
                  className="text-[var(--text-1)] text-sm"
                  placeholder="Stage layout..."
                />
              </div>
              <div>
                <p className="text-xs text-[var(--text-3)] mb-1.5">Entry Experience</p>
                <EditableText
                  value={sd.entryExperience}
                  onChange={(v) => update("stageDesign", { ...sd, entryExperience: v })}
                  className="text-[var(--text-1)] text-sm"
                  placeholder="Entry experience..."
                />
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-[var(--text-3)] mb-1.5">Signature Element</p>
                <EditableText
                  value={sd.signature}
                  onChange={(v) => update("stageDesign", { ...sd, signature: v })}
                  className="text-[var(--text-1)] text-sm"
                  placeholder="Signature element..."
                />
              </div>
            </div>
            {sd.focalPoints?.length > 0 && (
              <div>
                <p className="text-xs text-[var(--text-3)] mb-2">Focal Points</p>
                <div className="flex flex-wrap gap-2">
                  {sd.focalPoints.map((fp: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs">{fp}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {dp && (
        <div>
          <h4 className="text-[var(--text-1)] font-semibold text-sm mb-3">Décor Plan</h4>
          <div className="space-y-3">
            <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] p-4">
              <p className="text-xs text-[var(--text-3)] mb-1.5">Hero Décor Element</p>
              <EditableText
                value={dp.hero}
                onChange={(v) => update("decorPlan", { ...dp, hero: v })}
                className="text-[var(--text-1)] text-sm font-medium"
                placeholder="Hero element..."
              />
            </div>
            {dp.zones?.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-3">
                {dp.zones.map((zone: { name: string; concept: string }, i: number) => (
                  <div key={i} className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] p-3">
                    <p className="text-xs text-indigo-400 font-semibold mb-1">{zone.name}</p>
                    <p className="text-[var(--text-2)] text-xs leading-relaxed">{zone.concept}</p>
                  </div>
                ))}
              </div>
            )}
            {dp.sustainabilityNotes && (
              <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3">
                <p className="text-xs text-emerald-400 mb-1">Sustainability Notes</p>
                <p className="text-[var(--text-2)] text-xs">{dp.sustainabilityNotes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Activations Tab ────────────────────────────────────────────────────────────
function ActivationsTab({ proposal, update }: { proposal: ProposalData; update: (f: keyof ProposalData, v: any) => void }) {
  const ee = proposal.experienceElements;
  if (!ee) return <div className="p-6 text-[var(--text-3)] text-sm">No activations data.</div>;

  const ACTIVATION_COLORS: Record<string, string> = {
    PASSIVE:     "bg-slate-500/15 text-slate-300 border-slate-500/20",
    ACTIVE:      "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
    SOCIAL:      "bg-violet-500/15 text-violet-300 border-violet-500/20",
    COMPETITIVE: "bg-orange-500/15 text-orange-300 border-orange-500/20",
  };

  return (
    <div className="p-6 space-y-6">
      {/* Activations */}
      {ee.activations?.length > 0 && (
        <div>
          <h4 className="text-[var(--text-1)] font-semibold text-sm mb-3">Experience Activations</h4>
          <div className="grid sm:grid-cols-2 gap-3">
            {ee.activations.map((act: ExperienceActivation, i: number) => (
              <div key={i} className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[var(--text-1)] font-semibold text-sm">{act.name}</p>
                  <span className={`rounded-full border px-2 py-0.5 text-xs shrink-0 ${ACTIVATION_COLORS[act.engagementType] ?? "bg-white/8 text-white/60 border-white/15"}`}>
                    {act.engagementType.toLowerCase()}
                  </span>
                </div>
                <p className="text-[var(--text-3)] text-xs leading-relaxed">{act.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guest journey */}
      {ee.guestJourney?.length > 0 && (
        <div>
          <h4 className="text-[var(--text-1)] font-semibold text-sm mb-3">Guest Journey</h4>
          <div className="relative">
            <div className="absolute left-3 top-3 bottom-3 w-px bg-[var(--border)]" />
            <div className="space-y-3 pl-8">
              {ee.guestJourney.map((step: string, i: number) => (
                <div key={i} className="relative">
                  <div className="absolute -left-5 top-1.5 w-2 h-2 rounded-full bg-indigo-500" />
                  <p className="text-[var(--text-2)] text-sm leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tech elements */}
      {ee.techElements?.length > 0 && (
        <div>
          <h4 className="text-[var(--text-1)] font-semibold text-sm mb-3">Tech Elements</h4>
          <div className="flex flex-wrap gap-2">
            {ee.techElements.map((t: string, i: number) => (
              <span key={i} className="px-3 py-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 text-xs">{t}</span>
            ))}
          </div>
        </div>
      )}

      {/* Surprise elements */}
      {ee.surpriseElements?.length > 0 && (
        <div>
          <h4 className="text-[var(--text-1)] font-semibold text-sm mb-3">Surprise Elements</h4>
          <div className="space-y-2">
            {ee.surpriseElements.map((s: string, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <span className="text-amber-400 text-sm shrink-0">✦</span>
                <p className="text-[var(--text-2)] text-sm">{s}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Existing tabs (unchanged) ──────────────────────────────────────────────────
function ConceptTab({ proposal, update }: { proposal: ProposalData; update: (f: keyof ProposalData, v: any) => void }) {
  const c = proposal.concept;
  // Experience Generator proposals don't populate `concept` — redirect to Experience tab
  if (!c) {
    const ec = proposal.eventConcept;
    return (
      <div className="p-6 space-y-4">
        <div className="rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/20 p-6 space-y-3">
          {ec?.tagline && <p className="text-indigo-400 text-lg font-semibold italic text-center">{ec.tagline}</p>}
          {ec?.storyline && <p className="text-[var(--text-2)] text-sm leading-relaxed">{ec.storyline}</p>}
          {ec?.theme && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10">
              <span className="text-indigo-400 text-xs font-medium">Theme:</span>
              <span className="text-[var(--text-1)] text-xs">{ec.theme}</span>
            </div>
          )}
        </div>
        <p className="text-center text-xs text-[var(--text-3)]">
          Full concept details are in the <strong className="text-indigo-400">Experience</strong> and <strong className="text-indigo-400">Visual</strong> tabs.
        </p>
      </div>
    );
  }
  function updateConcept(field: string, value: any) { update("concept", { ...c, [field]: value }); }
  return (
    <div className="p-6 space-y-6">
      <div className="rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/20 p-6 text-center space-y-3">
        <EditableText value={c.tagline} onChange={(v) => updateConcept("tagline", v)} className="text-indigo-400 text-lg font-semibold italic" placeholder="Tagline..." />
        <EditableTextarea value={c.description} onChange={(v) => updateConcept("description", v)} className="text-[var(--text-2)] text-sm leading-relaxed max-w-2xl mx-auto" placeholder="Event description..." />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10">
          <span className="text-indigo-400 text-xs font-medium">Theme:</span>
          <EditableText value={c.theme} onChange={(v) => updateConcept("theme", v)} className="text-[var(--text-1)] text-xs" placeholder="Theme..." />
        </div>
      </div>
      <div>
        <h4 className="text-[var(--text-1)] font-semibold text-sm mb-3">Event Highlights</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {c.highlights.map((h, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)]">
              <span className="text-indigo-400 font-bold text-xs mt-0.5 shrink-0">0{i + 1}</span>
              <EditableText value={h} onChange={(v) => { const next = [...c.highlights]; next[i] = v; updateConcept("highlights", next); }} className="text-[var(--text-1)] text-sm flex-1" placeholder="Highlight..." />
            </div>
          ))}
        </div>
        <button onClick={() => updateConcept("highlights", [...c.highlights, "New highlight"])} className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">+ Add highlight</button>
      </div>
    </div>
  );
}

function BudgetTab({ proposal, update }: { proposal: ProposalData; update: (f: keyof ProposalData, v: any) => void }) {
  const lines = proposal.budgetBreakdown ?? [];
  const total = lines.reduce((s, l) => s + l.amount, 0);
  const mismatch = lines.length > 0 && Math.abs(total - proposal.budget) > 1;
  function updateLine(i: number, field: keyof BudgetLine, value: any) { const next = [...lines]; next[i] = { ...next[i], [field]: value }; update("budgetBreakdown", next); }

  // Drag a slider → redistribute the delta proportionally across other lines,
  // then re-sync each line's amount from proposal.budget so totals stay clean.
  function setSliderPct(i: number, raw: number) {
    const newPct = Math.max(0, Math.min(100, Math.round(raw)));
    const oldPct = lines[i].percentage;
    if (newPct === oldPct) return;
    const delta = newPct - oldPct;
    const others = lines.map((l, j) => (j === i ? 0 : l.percentage));
    const otherTotal = others.reduce((s, p) => s + p, 0);
    const next = lines.map((l, j) => {
      let p = l.percentage;
      if (j === i) p = newPct;
      else if (otherTotal > 0) p = Math.max(0, l.percentage - (l.percentage / otherTotal) * delta);
      else if (delta < 0) p = (-delta) / Math.max(1, lines.length - 1);
      const pct = Math.round(p * 10) / 10;
      return { ...l, percentage: pct, amount: Math.round((proposal.budget * pct) / 100) };
    });
    update("budgetBreakdown", next);
  }
  const COLORS = ["bg-indigo-500","bg-purple-500","bg-emerald-500","bg-amber-500","bg-rose-500","bg-cyan-500","bg-orange-500","bg-teal-500"];
  return (
    <div className="p-6 space-y-6">
      {mismatch && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-amber-500/8 border border-amber-500/25 text-amber-400 text-xs">
          <span className="shrink-0 mt-0.5">⚠</span>
          <span>
            Line items sum to <strong>{formatINR(total)}</strong> but proposal budget is <strong>{formatINR(proposal.budget)}</strong>.
            Difference: {formatINR(Math.abs(total - proposal.budget))}.
          </span>
        </div>
      )}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-[var(--text-3)]"><span>Budget allocation</span><span className={mismatch ? "text-amber-400 font-semibold" : ""}>{formatINR(total)} allocated</span></div>
        <div className="h-3 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] overflow-hidden flex">
          {lines.map((l, i) => (<div key={i} className={`${COLORS[i%COLORS.length]} h-full transition-all`} style={{ width: `${l.percentage}%` }} title={`${l.category}: ${l.percentage}%`} />))}
        </div>
        <div className="flex flex-wrap gap-3">
          {lines.map((l, i) => (<div key={i} className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full ${COLORS[i%COLORS.length]}`} /><span className="text-[var(--text-3)] text-xs">{l.category}</span></div>))}
        </div>
      </div>
      <div className="space-y-2">
        {lines.map((l, i) => (
          <div key={i} className="grid grid-cols-12 gap-3 items-center p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] group hover:border-indigo-500/30 transition-colors">
            <div className={`w-3 h-3 rounded-full ${COLORS[i%COLORS.length]} col-span-1 shrink-0`} />
            <div className="col-span-4">
              <EditableText value={l.category} onChange={(v) => updateLine(i,"category",v)} className="text-[var(--text-1)] text-sm font-medium" placeholder="Category..." />
              <EditableText value={l.description} onChange={(v) => updateLine(i,"description",v)} className="text-[var(--text-3)] text-xs mt-0.5" placeholder="Description..." />
            </div>
            <div className="col-span-3 text-right"><EditableNumber value={l.amount} onChange={(v) => updateLine(i,"amount",v)} className="text-[var(--text-1)] text-sm font-semibold" prefix="₹" /></div>
            <div className="col-span-3">
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={Math.round(l.percentage)}
                  onChange={(e) => setSliderPct(i, Number(e.target.value))}
                  className="flex-1 h-1.5 accent-indigo-500 cursor-pointer"
                  title={`${l.category}: ${l.percentage}% · ${formatINR(l.amount)}`}
                />
                <span className="text-[var(--text-3)] text-xs w-10 text-right tabular-nums">{Math.round(l.percentage)}%</span>
              </div>
            </div>
            <button onClick={() => update("budgetBreakdown", lines.filter((_,j)=>j!==i))} className="col-span-1 text-[var(--text-3)] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-xs">✕</button>
          </div>
        ))}
      </div>
      <button onClick={() => update("budgetBreakdown",[...lines,{category:"New Item",amount:0,percentage:0,description:""}])} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">+ Add budget line</button>
    </div>
  );
}

function TimelineTab({ proposal, update }: { proposal: ProposalData; update: (f: keyof ProposalData, v: any) => void }) {
  const phases = proposal.timeline ?? [];
  function updatePhase(i: number, field: keyof TimelinePhase, value: any) { const next = [...phases]; next[i] = { ...next[i], [field]: value }; update("timeline", next); }
  return (
    <div className="p-6">
      <div className="relative">
        <div className="absolute left-5 top-6 bottom-6 w-px bg-[var(--border)]" />
        <div className="space-y-0">
          {phases.map((phase, i) => (
            <div key={i} className="relative flex gap-5 pb-8 last:pb-0 group">
              <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 ${phase.milestone?"bg-indigo-500 border-indigo-500 text-white":"bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-3)]"}`}><span className="text-xs font-bold">{i+1}</span></div>
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-3 mb-2">
                  <EditableText value={phase.phase} onChange={(v) => updatePhase(i,"phase",v)} className="text-[var(--text-1)] font-semibold text-sm" placeholder="Phase name..." />
                  <EditableText value={phase.daysOut} onChange={(v) => updatePhase(i,"daysOut",v)} className="text-indigo-400 text-xs border border-indigo-500/30 px-2 py-0.5 rounded-full bg-indigo-500/10" placeholder="Timing..." />
                  <label className="flex items-center gap-1 text-[var(--text-3)] text-xs ml-auto opacity-0 group-hover:opacity-100 transition-opacity"><input type="checkbox" checked={phase.milestone} onChange={(e) => updatePhase(i,"milestone",e.target.checked)} className="accent-indigo-500" />Milestone</label>
                </div>
                <ul className="space-y-1">
                  {phase.tasks.map((task, j) => (
                    <li key={j} className="flex items-start gap-2 group/task">
                      <span className="text-[var(--text-3)] text-xs mt-0.5">▸</span>
                      <EditableText value={task} onChange={(v) => { const next=[...phase.tasks]; next[j]=v; updatePhase(i,"tasks",next); }} className="text-[var(--text-2)] text-sm flex-1" placeholder="Task..." />
                      <button onClick={() => updatePhase(i,"tasks",phase.tasks.filter((_,k)=>k!==j))} className="text-[var(--text-3)] hover:text-red-400 text-xs opacity-0 group-hover/task:opacity-100 transition-opacity">✕</button>
                    </li>
                  ))}
                </ul>
                <button onClick={() => updatePhase(i,"tasks",[...phase.tasks,"New task"])} className="mt-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">+ Add task</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button onClick={() => update("timeline",[...phases,{phase:"New Phase",daysOut:"TBD",tasks:["Task 1"],milestone:false}])} className="mt-4 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">+ Add phase</button>
    </div>
  );
}

function VendorsTab({ proposal, update }: { proposal: ProposalData; update: (f: keyof ProposalData, v: any) => void }) {
  const vendors = proposal.vendors ?? [];
  function updateVendor(i: number, field: keyof ProposalVendor, value: any) { const next=[...vendors]; next[i]={...next[i],[field]:value}; update("vendors",next); }
  return (
    <div className="p-6 space-y-3">
      {vendors.map((v, i) => (
        <div key={i} className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-4 group hover:border-indigo-500/30 transition-colors">
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-400 text-sm font-bold shrink-0">{v.category[0]}</div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <EditableText value={v.category} onChange={(val) => updateVendor(i,"category",val)} className="text-[var(--text-1)] font-semibold text-sm" placeholder="Category..." />
                <EditableNumber value={v.estimatedCost} onChange={(val) => updateVendor(i,"estimatedCost",val)} className="text-emerald-400 text-sm font-semibold shrink-0" prefix="₹" />
              </div>
              <EditableText value={v.role} onChange={(val) => updateVendor(i,"role",val)} className="text-[var(--text-2)] text-xs" placeholder="Role..." />
              <EditableText value={v.notes} onChange={(val) => updateVendor(i,"notes",val)} className="text-[var(--text-3)] text-xs italic" placeholder="Notes..." />
            </div>
            <button onClick={() => update("vendors",vendors.filter((_,j)=>j!==i))} className="text-[var(--text-3)] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-xs">✕</button>
          </div>
        </div>
      ))}
      <button onClick={() => update("vendors",[...vendors,{category:"New Vendor",role:"",estimatedCost:0,notes:""}])} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">+ Add vendor</button>
    </div>
  );
}

function RisksTab({ proposal, update }: { proposal: ProposalData; update: (f: keyof ProposalData, v: any) => void }) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h4 className="text-[var(--text-1)] font-semibold text-sm mb-3 flex items-center gap-2"><span className="text-amber-400">⚠</span> Risk Flags</h4>
        <div className="space-y-2">
          {(proposal.riskFlags??[]).map((risk,i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 group">
              <span className="text-amber-400 text-xs mt-0.5 shrink-0">!</span>
              <EditableText value={risk} onChange={(v) => { const next=[...(proposal.riskFlags??[])]; next[i]=v; update("riskFlags",next); }} className="text-[var(--text-2)] text-sm flex-1" placeholder="Risk..." />
              <button onClick={() => update("riskFlags",(proposal.riskFlags??[]).filter((_,j)=>j!==i))} className="text-[var(--text-3)] hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
            </div>
          ))}
          <button onClick={() => update("riskFlags",[...(proposal.riskFlags??[]),"New risk flag"])} className="text-xs text-amber-400 hover:text-amber-300 transition-colors">+ Add risk</button>
        </div>
      </div>
      <div>
        <h4 className="text-[var(--text-1)] font-semibold text-sm mb-3 flex items-center gap-2"><span className="text-emerald-400">✦</span> Pro Tips</h4>
        <div className="space-y-2">
          {(proposal.tips??[]).map((tip,i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 group">
              <span className="text-emerald-400 text-xs mt-0.5 shrink-0">✓</span>
              <EditableText value={tip} onChange={(v) => { const next=[...(proposal.tips??[])]; next[i]=v; update("tips",next); }} className="text-[var(--text-2)] text-sm flex-1" placeholder="Tip..." />
              <button onClick={() => update("tips",(proposal.tips??[]).filter((_,j)=>j!==i))} className="text-[var(--text-3)] hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
            </div>
          ))}
          <button onClick={() => update("tips",[...(proposal.tips??[]),"New tip"])} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">+ Add tip</button>
        </div>
      </div>
    </div>
  );
}

// ── Reusable primitives ────────────────────────────────────────────────────────
function EditableText({ value, onChange, className, placeholder, style }: {
  value: string; onChange: (v: string) => void; className?: string; placeholder?: string; style?: React.CSSProperties;
}) {
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={style}
      className={`bg-transparent border-b border-transparent hover:border-[var(--border)] focus:border-indigo-500/60 outline-none transition-colors w-full ${className}`} />
  );
}
function EditableTextarea({ value, onChange, className, placeholder }: {
  value: string; onChange: (v: string) => void; className?: string; placeholder?: string;
}) {
  return (
    <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3}
      className={`bg-transparent border border-transparent hover:border-[var(--border)] focus:border-indigo-500/60 outline-none transition-colors w-full resize-none rounded-lg px-1 ${className}`} />
  );
}
function EditableNumber({ value, onChange, className, prefix, suffix }: {
  value: number; onChange: (v: number) => void; className?: string; prefix?: string; suffix?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {prefix && <span className="text-[0.7em]">{prefix}</span>}
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="bg-transparent border-b border-transparent hover:border-[var(--border)] focus:border-indigo-500/60 outline-none transition-colors w-24 text-right" />
      {suffix && <span>{suffix}</span>}
    </span>
  );
}

// ── Compliance Tab ──────────────────────────────────────────────────────────────
const STATUS_CYCLE: ComplianceStatus[] = ["NOT_STARTED", "IN_PROGRESS", "SUBMITTED", "APPROVED"];

function ComplianceTab({
  proposal, update,
}: {
  proposal: ProposalData;
  update: (f: keyof ProposalData, v: any) => void;
}) {
  const items = proposal.compliance ?? [];
  const score = items.length ? calcScore(items) : 0;

  function regenerate() {
    if (items.length && !confirm("Replace existing checklist with a fresh one from the event type? Statuses will be reset.")) return;
    update("compliance", generateChecklist(proposal.eventType, proposal.eventDate ?? null));
  }

  function cycleStatus(id: string) {
    update("compliance", items.map((it) => {
      if (it.id !== id) return it;
      const idx = STATUS_CYCLE.indexOf(it.status);
      const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
      return { ...it, status: next };
    }));
  }

  if (items.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 text-xl mb-3">⚖</div>
        <h4 className="text-[var(--text-1)] font-semibold text-sm mb-1">No compliance checklist yet</h4>
        <p className="text-[var(--text-3)] text-xs mb-5 max-w-md mx-auto">
          Generate the required permits, NOCs and licences for a <strong>{proposal.eventType || "this event"}</strong>
          {proposal.eventDate ? <> happening on <strong>{new Date(proposal.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong></> : null}.
        </p>
        <button
          onClick={regenerate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold transition-colors"
        >
          ⚡ Generate checklist
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[var(--text-3)] text-[11px] uppercase tracking-wide font-medium mb-1">Compliance score</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[var(--text-1)] tabular-nums">{score}%</span>
            <span className="text-[var(--text-3)] text-xs">{items.length} permit{items.length === 1 ? "" : "s"}</span>
          </div>
        </div>
        <button
          onClick={regenerate}
          className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text-1)] hover:border-indigo-500/30 transition-colors"
        >
          Regenerate
        </button>
      </div>

      <div className="h-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] overflow-hidden">
        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${score}%` }} />
      </div>

      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
        {items.map((item, idx) => {
          const cfg = STATUS_CONFIG[item.status];
          const dl = deadlineState(item);
          const dlLabel = item.deadline
            ? new Date(item.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
            : "—";
          const dlColor = dl === "overdue" ? "text-red-400"
            : dl === "urgent" ? "text-amber-400"
            : dl === "upcoming" ? "text-indigo-400"
            : "text-[var(--text-3)]";
          return (
            <div
              key={item.id}
              className={`flex items-center gap-3 px-4 py-3 ${idx > 0 ? "border-t border-[var(--border)]" : ""} hover:bg-[var(--bg-surface)] transition-colors`}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                item.priority === "CRITICAL" ? "bg-red-500"
                : item.priority === "HIGH" ? "bg-amber-500"
                : item.priority === "MEDIUM" ? "bg-indigo-500"
                : "bg-gray-500"
              }`} />
              <div className="flex-1 min-w-0">
                <div className="text-[var(--text-1)] text-sm font-medium truncate">{item.name}</div>
                <div className="text-[var(--text-3)] text-xs truncate">{item.authority} · {item.fee}</div>
              </div>
              <div className={`text-xs tabular-nums ${dlColor} shrink-0 w-16 text-right`}>{dlLabel}</div>
              <button
                onClick={() => cycleStatus(item.id)}
                title="Click to cycle status"
                className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors shrink-0 ${cfg.bg} ${cfg.color}`}
              >
                {cfg.icon} {cfg.label}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-[var(--text-3)] text-[11px] text-center">
        Click any status to cycle: Not Started → In Progress → Submitted → Approved. Saves with the proposal.
      </p>
    </div>
  );
}

// ── Payments Tab ───────────────────────────────────────────────────────────────
function PaymentsTab({ proposal }: { proposal: ProposalData }) {
  const [items,    setItems]    = useState<ProposalPayment[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [showForm, setShowForm] = useState(false);

  // form state
  const [amount,        setAmount]        = useState<number>(proposal.budget || 0);
  const [description,   setDescription]   = useState("Advance · 50% of total");
  const [dueDate,       setDueDate]       = useState("");
  const [method,        setMethod]        = useState<PaymentMethod>("UPI");
  const [paymentTarget, setPaymentTarget] = useState("");
  const [creating,      setCreating]      = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`/api/proposals/${proposal.id}/payments`);
      if (!r.ok) throw new Error("Could not load payments.");
      setItems(await r.json());
      setError("");
    } catch (e: any) {
      setError(e.message ?? "Could not load payments.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [proposal.id]);

  async function createRequest() {
    if (!amount || amount <= 0 || !paymentTarget.trim()) return;
    setCreating(true);
    try {
      const r = await fetch(`/api/proposals/${proposal.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount, description, method,
          paymentTarget: paymentTarget.trim(),
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? "Could not create.");
      setShowForm(false);
      setDescription("Balance");
      setPaymentTarget((prev) => prev); // keep last UPI/bank for convenience
      await load();
    } catch (e: any) {
      alert(e.message ?? "Could not create payment request.");
    } finally {
      setCreating(false);
    }
  }

  async function patchStatus(p: ProposalPayment, status: PaymentStatus) {
    if (status === "CONFIRMED" && !confirm(`Confirm that you've received ${formatINR(p.amount)} in your account?`)) return;
    if (status === "CANCELLED" && !confirm("Cancel this payment request? The client will no longer see it.")) return;
    try {
      const r = await fetch(`/api/proposals/${proposal.id}/payments/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? "Update failed.");
      await load();
    } catch (e: any) {
      alert(e.message);
    }
  }

  const totals = items.reduce(
    (acc, p) => {
      if (p.status === "CONFIRMED") acc.received += p.amount;
      else if (p.status === "PAID") acc.verifying += p.amount;
      else if (p.status === "REQUESTED") acc.outstanding += p.amount;
      return acc;
    },
    { received: 0, verifying: 0, outstanding: 0 }
  );

  return (
    <div className="p-6 space-y-5">
      {/* Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat label="Received" value={formatINR(totals.received)} tone="emerald" />
        <Stat label="Verifying" value={formatINR(totals.verifying)} tone="indigo" />
        <Stat label="Outstanding" value={formatINR(totals.outstanding)} tone="amber" />
      </div>

      <div className="flex items-center justify-between">
        <h4 className="text-[var(--text-1)] font-semibold text-sm">Payment requests</h4>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-xs px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-semibold transition-colors"
        >
          {showForm ? "Close" : "+ Request payment"}
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Amount (₹)">
              <input
                type="number" min={1} value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-1)] text-sm outline-none focus:border-indigo-500/50"
              />
            </Field>
            <Field label="Due date (optional)">
              <input
                type="date" value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-1)] text-sm outline-none focus:border-indigo-500/50"
              />
            </Field>
          </div>
          <Field label="Description shown to client">
            <input
              type="text" value={description} maxLength={500}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Advance — 50% of total"
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-1)] text-sm outline-none focus:border-indigo-500/50"
            />
          </Field>
          <Field label="Payment method">
            <div className="flex gap-2">
              {(["UPI", "BANK"] as PaymentMethod[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    method === m
                      ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400"
                      : "border-[var(--border)] text-[var(--text-2)]"
                  }`}
                >
                  {m === "UPI" ? "UPI" : "Bank transfer"}
                </button>
              ))}
            </div>
          </Field>
          <Field label={method === "UPI" ? "Your UPI ID" : "Bank details (account, IFSC, name)"}>
            <textarea
              value={paymentTarget} maxLength={500} rows={method === "UPI" ? 1 : 3}
              onChange={(e) => setPaymentTarget(e.target.value)}
              placeholder={method === "UPI" ? "you@upi" : "Acc: 1234567890\nIFSC: HDFC0001234\nName: Your Studio Pvt Ltd"}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-1)] text-sm outline-none focus:border-indigo-500/50 resize-y"
            />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
            <button
              onClick={createRequest}
              disabled={creating || !amount || !paymentTarget.trim()}
              className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold disabled:opacity-40 transition-colors"
            >
              {creating ? "Creating…" : "Create request"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-red-400 text-xs">{error}</p>}

      {loading ? (
        <p className="text-[var(--text-3)] text-xs">Loading…</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] p-10 text-center">
          <p className="text-[var(--text-2)] text-sm">No payment requests yet.</p>
          <p className="text-[var(--text-3)] text-xs mt-1">After the client approves, request an advance to start recording payments.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((p) => {
            const cfg = PAYMENT_STATUS_STYLES[p.status];
            return (
              <div key={p.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--text-1)] font-semibold text-sm">{formatINR(p.amount)}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                    </div>
                    {p.description && <p className="text-[var(--text-2)] text-xs mt-1">{p.description}</p>}
                    <p className="text-[var(--text-3)] text-xs mt-1">
                      {p.method === "UPI" ? "UPI" : "Bank"} · {p.paymentTarget.split("\n")[0]}
                      {p.dueDate && <> · due {new Date(p.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</>}
                    </p>
                    {p.status === "PAID" && p.payerReference && (
                      <div className="mt-3 p-3 rounded-lg bg-indigo-500/8 border border-indigo-500/20">
                        <p className="text-indigo-300 text-xs font-semibold">Client says they've paid</p>
                        <p className="text-[var(--text-2)] text-xs mt-1">
                          <strong>{p.payerName}</strong> · UTR: <span className="font-mono">{p.payerReference}</span>
                        </p>
                        {p.payerNote && <p className="text-[var(--text-3)] text-xs italic mt-1">"{p.payerNote}"</p>}
                        {p.submittedAt && <p className="text-[var(--text-3)] text-[11px] mt-1">{new Date(p.submittedAt).toLocaleString("en-IN")}</p>}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {p.status === "REQUESTED" && (
                      <button
                        onClick={() => patchStatus(p, "CANCELLED")}
                        className="text-[var(--text-3)] hover:text-red-400 text-xs transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    {p.status === "PAID" && (
                      <button
                        onClick={() => patchStatus(p, "CONFIRMED")}
                        className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-semibold transition-colors"
                      >
                        ✓ Confirm received
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "emerald" | "indigo" | "amber" }) {
  const map = {
    emerald: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
    indigo:  "border-indigo-500/20  bg-indigo-500/5  text-indigo-400",
    amber:   "border-amber-500/20   bg-amber-500/5   text-amber-400",
  };
  return (
    <div className={`rounded-xl border p-3 ${map[tone]}`}>
      <p className="text-[11px] uppercase tracking-wide font-medium opacity-80">{label}</p>
      <p className="text-lg font-bold mt-0.5 tabular-nums text-[var(--text-1)]">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[var(--text-3)] text-[11px] uppercase tracking-wide font-medium">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
