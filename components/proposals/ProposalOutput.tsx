"use client";

import React, { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import type {
  ProposalData, BudgetLine, TimelinePhase, ProposalVendor,
  ExperienceActivation, ColorSwatch, ProposalVersionSnapshot,
} from "@/lib/proposals";
import { formatINR, MAX_REGENERATIONS, type GeneratedVisual } from "@/lib/proposals";
import { useCredits } from "@/components/credits/useCredits";
import {
  generateChecklist, calcScore, deadlineState, STATUS_CONFIG,
  type ComplianceItem, type ComplianceStatus,
} from "@/lib/compliance";
import { useBranding } from "@/lib/branding";
import FloorPlanBuilder, { CELL as FP_CELL, GW as FP_GW, GH as FP_GH, KINDS as FP_KINDS } from "@/components/toolkit/FloorPlanBuilder";
import type { FpElement } from "@/components/toolkit/FloorPlanBuilder";
import SectionApprovalBadge from "@/components/proposals/SectionApprovalBadge";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip } from "recharts";

const BUDGET_COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#f97316", "#eab308",
];

type Tab = "concept" | "design-layout" | "experience" | "budget" | "timeline" | "vendors" | "risks" | "compliance";


type Props = {
  proposal:         ProposalData;
  onChange:         (p: ProposalData) => void;
  onBack:           () => void;
  onSave:           () => void;
  hideVendorToggle?: boolean;
};

export default function ProposalOutput({ proposal, onChange, onBack, onSave, hideVendorToggle = false }: Props) {
  const hasExperience = !!(proposal.eventConcept || proposal.selectedIdea);
  const hasVisual     = !!proposal.visualDirection;
  const hasStage      = !!(proposal.stageDesign || proposal.decorPlan);
  const hasActivations= !!proposal.experienceElements;

  const [tab,                  setTab]                  = useState<Tab>(hasExperience ? "experience" : "concept");
  const [saved,                setSaved]                = useState(false);
  const [saveError,       setSaveError]       = useState("");
  const [editMode,        setEditMode]        = useState(false);
  const [showTplModal,    setShowTplModal]    = useState(false);
  const [templateName,    setTemplateName]    = useState(proposal.concept?.title ?? proposal.title);
  const [savingTemplate,  setSavingTemplate]  = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imageGenError,   setImageGenError]   = useState("");
  const [exportingPDF,    setExportingPDF]    = useState(false);
  const [pdfError,        setPdfError]        = useState("");
  const [exportOpen,      setExportOpen]      = useState(false);
  const [versionsOpen,    setVersionsOpen]    = useState(false);
  const [regenerating,    setRegenerating]    = useState(false);
  const [regenError,      setRegenError]      = useState("");
  const [duplicating,          setDuplicating]          = useState(false);
  const [lockLoading,          setLockLoading]          = useState(false);
  const [generatingMoodBoard,  setGeneratingMoodBoard]  = useState(false);
  const [moodBoardGenerated,   setMoodBoardGenerated]   = useState(false);

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

  async function handleExportPDF() {
    setExportOpen(false);
    if (exportingPDF) return;
    setPdfError("");
    setExportingPDF(true);
    try {
      const res = await fetch(`/api/proposals/${proposal.id}/pdf`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? "PDF generation failed.");
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${(proposal.concept?.title ?? proposal.title ?? "proposal")
        .replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 60)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setPdfError(e.message ?? "Could not generate PDF.");
    } finally {
      setExportingPDF(false);
    }
  }

  const canEdit = !proposal.isLocked;

  function update(field: keyof ProposalData, value: any) {
    if (!editMode || !canEdit) return;
    onChange({ ...proposal, [field]: value });
  }

  // Update title — works for both classic (concept.title) and Experience Generator (title only)
  function updateTitle(value: string) {
    if (!editMode || !canEdit) return;
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
        floorPlan:         proposal.floorPlan,
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

  async function handleGenerateMoodBoard() {
    if (generatingMoodBoard) return;
    setGeneratingMoodBoard(true);
    setMoodBoardGenerated(false);
    try {
      const res = await fetch("/api/proposals/generate-mood-board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId: proposal.id,
          concept:    proposal.concept?.description,
          theme:      proposal.concept?.theme,
          colors:     proposal.visualDirection?.palette,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMoodBoardGenerated(true);
        setTimeout(() => { setMoodBoardGenerated(false); setGeneratingMoodBoard(false); }, 2500);
        onSave();
      } else {
        alert("Failed to generate mood board");
        setGeneratingMoodBoard(false);
      }
    } catch (err) {
      console.error("Mood board error:", err);
      alert("Error generating mood board");
      setGeneratingMoodBoard(false);
    }
  }

  async function handleGenerateImage() {
    if (generatingImage) return;
    setImageGenError("");
    setGeneratingImage(true);

    const prompt = proposal.visualDirection?.dallePrompt || undefined;

    async function attempt() {
      return await api.proposals.generateImage({
        proposalId: proposal.id,
        ...(prompt ? { prompt } : {}),
      }) as { imageUrl: string };
    }

    try {
      let result: { imageUrl: string };
      try {
        result = await attempt();
      } catch {
        // Retry once on transient failure
        result = await attempt();
      }
      onChange({ ...proposal, visualDirection: { ...proposal.visualDirection!, generatedImageUrl: result.imageUrl } as any });
    } catch (err: any) {
      setImageGenError(err.message ?? "Image generation failed. Try again.");
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
      onChange({ ...proposal, visualDirection: { ...proposal.visualDirection!, generatedImageUrl: dataUrl } as any });
    };
    reader.onerror = () => alert("Failed to read image. Try again.");
    reader.readAsDataURL(file);
  }

  // ── Build tab list ─────────────────────────────────────────────────────────
  const hasVendors = !!(proposal.vendors?.length);
  const hasRisks   = !!(proposal.riskFlags?.length || proposal.tips?.length);

  const ALL_TABS: { id: Tab; label: string; icon: string; show: boolean }[] = [
    { id: "concept",       label: "Concept",           icon: "✦",  show: true },
    { id: "design-layout", label: "Design & Layout",   icon: "🎭", show: true },
    { id: "experience",    label: "Experience",        icon: "✨", show: hasExperience },
    { id: "budget",        label: "Budget",            icon: "₹",  show: !!(proposal.budgetBreakdown?.length) },
    { id: "timeline",      label: "Timeline",          icon: "⏱", show: !!(proposal.timeline?.length) },
    { id: "vendors",       label: "Vendors",           icon: "🏪", show: hasVendors || !hasExperience },
    { id: "risks",         label: "Risks & Tips",      icon: "⚠", show: hasRisks || !hasExperience },
    { id: "compliance",    label: "Compliance",        icon: "⚖", show: !!proposal.eventType },
  ];
  const TABS = ALL_TABS.filter((t) => t.show);

  return (
    <div style={{ maxWidth: "80rem", margin: "0 auto" }}>
    <div style={{ paddingBottom: 48, display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>

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
              readOnly={!editMode || !canEdit}
              style={{
                fontSize: 22, fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.15,
                color: "var(--text-1)", background: "transparent",
                borderBottom: "1px solid transparent", outline: "none",
                width: "100%", transition: "border-color 0.15s", paddingBottom: 2,
                cursor: (!editMode || !canEdit) ? "default" : "text",
              }}
              onMouseEnter={(e) => { if (editMode && canEdit) (e.target as HTMLElement).style.borderBottomColor = "var(--border)"; }}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.borderBottomColor = "transparent")}
              onFocus={(e) => { if (editMode && canEdit) (e.target as HTMLElement).style.borderBottomColor = "rgba(99,102,241,0.45)"; }}
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

          {/* ── Action bar (two groups) ───────────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginTop: 2 }}>

            {/* LEFT: Back + Save + Edit toggle */}
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={onBack} className="btn-ghost">← Back</button>

              <button
                onClick={handleSave}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 14px", borderRadius: 9, fontSize: 13, fontWeight: 600,
                  cursor: "pointer", transition: "all 0.15s",
                  ...(saved
                    ? { background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.28)", color: "#4ade80" }
                    : { background: "var(--accent)", border: "1px solid transparent", color: "#fff", boxShadow: "var(--shadow-accent)" }
                  ),
                }}
              >
                {saved ? "✓ Saved" : "Save Proposal"}
              </button>

              {proposal.isLocked ? (
                <button
                  onClick={handleToggleLock}
                  disabled={lockLoading}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "8px 12px", borderRadius: 9, fontSize: 13, fontWeight: 600,
                    border: "1px solid rgba(245,158,11,0.35)", background: "rgba(245,158,11,0.08)",
                    color: "#fbbf24", cursor: lockLoading ? "not-allowed" : "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {lockLoading ? "…" : "🔒 Unlock to Edit"}
                </button>
              ) : (
                <button
                  onClick={() => setEditMode((v) => !v)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "8px 12px", borderRadius: 9, fontSize: 13, fontWeight: 600,
                    border: editMode ? "1px solid rgba(99,102,241,0.4)" : "1px solid var(--border)",
                    background: editMode ? "rgba(99,102,241,0.12)" : "var(--bg-surface)",
                    color: editMode ? "#a5b4fc" : "var(--text-2)",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  {editMode ? "✓ Done Editing" : "✎ Edit"}
                </button>
              )}
            </div>

            {/* RIGHT: Version + Regenerate + secondary actions */}
            <div className="flex items-center gap-2 flex-wrap justify-end">

            {/* Version chip + dropdown */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setVersionsOpen((v) => !v)}
                title={versions.length ? `Switch between ${versions.length + 1} versions` : "Only one version so far"}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 12px", borderRadius: 9, border: "1px solid var(--border)",
                  background: "var(--bg-surface)", color: "var(--text-2)", fontSize: 13, fontWeight: 600,
                  cursor: versions.length ? "pointer" : "default", opacity: versions.length ? 1 : 0.6,
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
              title={proposal.isLocked ? "Unlock this proposal" : "Lock this version to prevent changes"}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "8px 12px", borderRadius: 9, fontSize: 13, fontWeight: 600,
                border: proposal.isLocked ? "1px solid rgba(245,158,11,0.35)" : "1px solid var(--border)",
                background: proposal.isLocked ? "rgba(245,158,11,0.08)" : "transparent",
                color: proposal.isLocked ? "#fbbf24" : "var(--text-3)",
                cursor: lockLoading ? "not-allowed" : "pointer", transition: "all 0.15s",
              }}
            >
              {lockLoading ? "…" : proposal.isLocked ? "🔒 Locked" : "🔒 Lock"}
            </button>
            <button
              onClick={handleGenerateMoodBoard}
              disabled={generatingMoodBoard || !proposal.concept}
              title={generatingMoodBoard ? "Generating mood board…" : "Generate AI mood board images"}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 13px", borderRadius: 9, fontSize: 13, fontWeight: 600,
                border: moodBoardGenerated ? "1px solid rgba(34,197,94,0.4)" : "1px solid rgba(168,85,247,0.3)",
                background: moodBoardGenerated ? "rgba(34,197,94,0.12)" : generatingMoodBoard ? "rgba(168,85,247,0.18)" : "rgba(168,85,247,0.08)",
                color: moodBoardGenerated ? "#4ade80" : "#d8b4fe",
                cursor: generatingMoodBoard ? "not-allowed" : "pointer",
                transition: "all 0.15s", opacity: proposal.concept ? 1 : 0.5, whiteSpace: "nowrap",
              }}
            >
              {generatingMoodBoard ? (
                <><span className="w-3 h-3 rounded-full border-2 border-purple-300/30 border-t-purple-400 animate-spin" />Generating…</>
              ) : moodBoardGenerated ? (
                <>✓ Mood Board Ready</>
              ) : (
                <>🎨 Mood Board</>
              )}
            </button>
            <button
              onClick={() => { window.location.href = `/toolkit/event-visual?from=${proposal.id}`; }}
              title="Generate a photorealistic 3D render from this proposal"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 13px", borderRadius: 9, fontSize: 13, fontWeight: 600,
                border: "1px solid rgba(139,92,246,0.3)",
                background: "rgba(139,92,246,0.08)",
                color: "#a78bfa",
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              🎬 3D Visual
            </button>
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setExportOpen((v) => !v)}
                disabled={exportingPDF}
                className="btn-ghost"
                aria-expanded={exportOpen}
                title={exportingPDF ? "Generating PDF…" : undefined}
              >
                {exportingPDF
                  ? <><span className="inline-block w-3 h-3 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin mr-1.5" />PDF…</>
                  : "Export ▾"}
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
                    <button onClick={handleExportPDF} disabled={exportingPDF} className="export-row">
                      <span>{exportingPDF ? "⏳" : "📄"}</span>
                      <div style={{ flex: 1, textAlign: "left" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>
                          {exportingPDF ? "Generating PDF…" : "Download as PDF"}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                          {exportingPDF ? "This may take up to 30 seconds" : "Full multi-page · includes floor plan"}
                        </div>
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
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 13px", borderRadius: 9, fontSize: 13, fontWeight: 600,
                border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.07)",
                color: "#fbbf24", cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
              }}
            >
              🎯 Pitch Deck
            </button>

            </div>{/* end right group */}
          </div>{/* end action bar */}
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

      {/* PDF error */}
      {pdfError && (
        <div
          className="flex items-center justify-between gap-4"
          style={{ padding: "11px 16px", borderRadius: 10, background: "var(--red-dim)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5", fontSize: 13.5 }}
        >
          <span>PDF: {pdfError}</span>
          <button onClick={() => setPdfError("")} style={{ color: "rgba(252,165,165,0.5)", fontSize: 11, background: "none", border: "none", cursor: "pointer" }}>✕</button>
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

      {/* Edit mode notice */}
      {!proposal.isLocked && !editMode && (
        <div
          style={{
            padding: "9px 16px", borderRadius: 10,
            background: "var(--bg-card)", border: "1px solid var(--border)",
            color: "var(--text-3)", fontSize: 12.5,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          }}
        >
          <span>View mode — no changes will be saved.</span>
          <button
            onClick={() => setEditMode(true)}
            style={{ fontSize: 12, color: "var(--text-2)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}
          >
            Edit
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
              style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              <span>{t.icon}</span>
              {t.label}
              <SectionApprovalBadge sectionApprovals={{}} section={t.id} />
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
        {tab === "concept"        && <ConceptTab     proposal={proposal} update={update} />}
        {tab === "design-layout"  && (
          <DesignLayoutTab
            proposal={proposal}
            update={update}
            onChange={onChange}
            onGenerateImage={handleGenerateImage}
            onUploadImage={handleUploadImage}
            generatingImage={generatingImage}
            imageGenError={imageGenError}
            editMode={editMode}
            canEdit={canEdit}
            onSwitchToEdit={() => setEditMode(true)}
          />
        )}
        {tab === "experience"     && <ExperienceTab  proposal={proposal} update={update} />}
        {tab === "budget"         && <BudgetTab      proposal={proposal} update={update} />}
        {tab === "timeline"       && <TimelineTab    proposal={proposal} update={update} />}
        {tab === "vendors"        && <VendorsTab     proposal={proposal} update={update} hideToggle={hideVendorToggle} />}
        {tab === "risks"          && <RisksTab       proposal={proposal} update={update} />}
        {tab === "compliance"     && <ComplianceTab  proposal={proposal} update={update} onDirectChange={onChange} />}
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
    </div>{/* end inner content column */}
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
  const GOLD = "#D4A85F";

  return (
    <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Selected concept hero */}
      {idea && (
        <div>
          <TabSection eyebrow="Selected Concept" title={idea.title} />
          <div style={{ borderRadius: 16, border: `1px solid ${GOLD}30`, background: `linear-gradient(135deg, ${GOLD}08, rgba(139,92,246,0.04))`, overflow: "hidden" }}>
            {/* Concept + score */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 26px", borderBottom: `1px solid ${GOLD}18`, gap: 20 }}>
              <p className="t-body" style={{ maxWidth: 560, lineHeight: 1.65 }}>{idea.concept}</p>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ fontSize: 48, fontWeight: 900, color: GOLD, lineHeight: 1, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em" }}>
                  {idea.score.overall.toFixed(1)}
                </p>
                <p className="eyebrow" style={{ marginTop: 4, color: "var(--text-3)" }}>Overall Score</p>
              </div>
            </div>
            {/* Score grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", borderBottom: `1px solid ${GOLD}18` }}>
              {[
                { label: "Uniqueness",  v: idea.score.uniqueness  },
                { label: "Engagement",  v: idea.score.engagement  },
                { label: "Budget Fit",  v: idea.score.budgetFit   },
              ].map(({ label, v }, idx) => (
                <div key={label} style={{ padding: "16px 20px", borderRight: idx < 2 ? `1px solid ${GOLD}18` : "none" }}>
                  <p style={{ fontSize: 26, fontWeight: 800, color: "var(--text-1)", fontVariantNumeric: "tabular-nums", lineHeight: 1, marginBottom: 4 }}>
                    {v}<span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-3)" }}>/10</span>
                  </p>
                  <p className="eyebrow">{label}</p>
                </div>
              ))}
            </div>
            {/* Wow factor */}
            <div style={{ padding: "16px 26px", display: "flex", alignItems: "flex-start", gap: 12 }}>
              <span style={{ fontSize: 16, color: GOLD, flexShrink: 0, marginTop: 1 }}>★</span>
              <div>
                <p className="eyebrow" style={{ marginBottom: 5, color: GOLD, opacity: 0.8 }}>Wow Factor</p>
                <p className="t-body">{idea.wowFactor}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Storyline & theme */}
      {ec && (
        <div>
          <TabSection eyebrow="Event Narrative" title="Storyline & Theme" />
          <div style={{ borderRadius: 16, border: `1px solid ${GOLD}28`, background: "var(--bg-surface)", overflow: "hidden" }}>
            {/* Theme + tagline row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: `1px solid ${GOLD}18` }}>
              <div style={{ padding: "20px 24px", borderRight: `1px solid ${GOLD}18` }}>
                <p className="eyebrow" style={{ marginBottom: 8, color: GOLD, opacity: 0.75 }}>Theme</p>
                <EditableText
                  value={ec.theme}
                  onChange={(v) => update("eventConcept", { ...ec, theme: v })}
                  className="t-title"
                  placeholder="Event theme..."
                />
              </div>
              <div style={{ padding: "20px 24px" }}>
                <p className="eyebrow" style={{ marginBottom: 8, color: GOLD, opacity: 0.75 }}>Tagline</p>
                <EditableText
                  value={ec.tagline}
                  onChange={(v) => update("eventConcept", { ...ec, tagline: v })}
                  style={{ fontSize: 15, fontStyle: "italic", color: "var(--text-2)", lineHeight: 1.6 }}
                  placeholder="Tagline..."
                />
              </div>
            </div>
            {/* Storyline */}
            <div style={{ padding: "22px 24px", background: `linear-gradient(135deg, ${GOLD}05, transparent)` }}>
              <p className="eyebrow" style={{ marginBottom: 10, color: GOLD, opacity: 0.75 }}>Narrative</p>
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
              <p className="eyebrow" style={{ marginBottom: 16, color: GOLD, opacity: 0.8 }}>Emotional Journey</p>
              <div style={{ position: "relative" }}>
                {/* Gold connector line */}
                <div style={{
                  position: "absolute",
                  top: 20,
                  left: 20,
                  right: 20,
                  height: 1,
                  background: `linear-gradient(90deg, ${GOLD}40, ${GOLD}20)`,
                }} />
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${ec.emotionalJourney.length}, 1fr)`, gap: 10, position: "relative" }}>
                  {ec.emotionalJourney.map((beat, i) => (
                    <div key={i} style={{
                      borderRadius: 12,
                      border: `1px solid ${GOLD}20`,
                      background: `linear-gradient(160deg, ${GOLD}08, var(--bg-card))`,
                      padding: "16px 14px",
                    }}>
                      <div style={{
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        background: `${GOLD}18`,
                        border: `1.5px solid ${GOLD}50`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 10,
                        fontSize: 12,
                        fontWeight: 800,
                        color: GOLD,
                      }}>
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
  proposal, update, onGenerateImage, onUploadImage, generatingImage, imageGenError,
}: {
  proposal: ProposalData;
  update: (f: keyof ProposalData, v: any) => void;
  onGenerateImage: () => void;
  onUploadImage: (file: File) => void;
  generatingImage: boolean;
  imageGenError: string;
}) {
  const vd = proposal.visualDirection;
  const fileRef = useRef<HTMLInputElement>(null);
  if (!vd) return <div style={{ padding: 28 }} className="t-caption">No visual direction data.</div>;

  // Enable when there's a usable prompt (either stored or can be auto-built from event details)
  const hasEventDetails = !!(proposal.eventType || proposal.location);
  const canGenerateImage = !generatingImage && (
    (vd.dallePrompt?.length ?? 0) > 10 || hasEventDetails
  );

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

      {/* Error banner */}
      {imageGenError && (
        <div style={{
          padding: "10px 14px",
          borderRadius: 9,
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.25)",
          color: "#fca5a5",
          fontSize: 12,
        }}>
          ⚠ {imageGenError}
        </div>
      )}

      {/* Generated image */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
          <TabSection eyebrow="Visual Identity" title="Event Visual" />
          {!vd.generatedImageUrl && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={onGenerateImage}
                disabled={!canGenerateImage}
                title={canGenerateImage ? undefined : "Add event details to generate visuals"}
                style={{
                  ...generateBtnStyle,
                  opacity: canGenerateImage ? 1 : 0.45,
                  cursor: canGenerateImage ? "pointer" : "not-allowed",
                }}
              >
                {generatingImage ? (
                  <>
                    <span className="w-3 h-3 rounded-full border-2 border-violet-400/30 border-t-violet-400 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>✦ Generate Visual</>
                )}
              </button>
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
              Upload your own image or design — AI generation 
            </p>
          </div>
        )}
      </div>

      {/* Colour palette */}
      {vd.palette?.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <TabSection eyebrow="Design System" title="Colour Palette" />
          <div style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(52,211,153,0.25)", background: "rgba(52,211,153,0.05)", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 20 }} className="animate-bounce">✨</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#34d399" }}>Visual Identity Generated</p>
              <p style={{ fontSize: 12, color: "rgba(52,211,153,0.6)", marginTop: 2 }}>Color palette, mood, and design direction ready</p>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {vd.palette.map((swatch: ColorSwatch, i: number) => (
              <div
                key={i}
                className="animate-in fade-in zoom-in duration-300"
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 18px", borderRadius: 12,
                  border: "1px solid var(--border)", background: "var(--bg-surface)",
                  animationDelay: `${i * 80}ms`,
                }}
              >
                <div
                  style={{
                    width: 52, height: 52, borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                    backgroundColor: swatch.hex, flexShrink: 0,
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
  const GOLD = "#D4A85F";
  const ZONE_COLORS = [GOLD, "#a78bfa", "#34d399", "#60a5fa", "#f472b6", "#f59e0b"];

  return (
    <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 32 }}>
      {sd && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-3)" }}>Stage Design</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {([
              { label: "Layout",           value: sd.layout,          field: "layout",          span: false },
              { label: "Entry Experience", value: sd.entryExperience, field: "entryExperience",  span: false },
              { label: "Signature Element",value: sd.signature,       field: "signature",        span: true  },
            ] as { label: string; value: string; field: string; span: boolean }[]).map(({ label, value, field, span }) => (
              <div key={field} style={{ padding: "16px 18px", borderRadius: 12, background: "var(--bg-surface)", border: "1px solid var(--border)", gridColumn: span ? "1 / -1" : undefined }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>{label}</p>
                <EditableText value={value} onChange={(v) => update("stageDesign", { ...sd, [field]: v })}
                  className="text-[var(--text-1)] text-sm leading-relaxed" placeholder={`${label}...`} />
              </div>
            ))}
          </div>
          {sd.focalPoints?.length > 0 && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 10 }}>Focal Points</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {sd.focalPoints.map((fp: string, i: number) => (
                  <span key={i} style={{ padding: "6px 14px", borderRadius: 999, fontSize: 12, background: `${GOLD}12`, border: `1px solid ${GOLD}30`, color: GOLD }}>
                    {fp}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {dp && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-3)" }}>Décor Plan</p>

          {/* Hero element */}
          <div style={{ padding: "20px 22px", borderRadius: 14, background: `linear-gradient(135deg, ${GOLD}0e, ${GOLD}04)`, border: `1px solid ${GOLD}30` }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD, opacity: 0.8, marginBottom: 10 }}>Hero Element</p>
            <EditableText value={dp.hero} onChange={(v) => update("decorPlan", { ...dp, hero: v })}
              style={{ fontSize: 18, fontWeight: 600, color: "var(--text-1)", lineHeight: 1.4 }}
              placeholder="Hero décor element..." />
          </div>

          {/* Zones */}
          {dp.zones?.length > 0 && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 12 }}>Décor Zones</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {dp.zones.map((zone: { name: string; concept: string }, i: number) => (
                  <div key={i} style={{ padding: "16px 18px", borderRadius: 12, background: "var(--bg-surface)", borderLeft: `3px solid ${ZONE_COLORS[i % ZONE_COLORS.length]}`, border: `1px solid ${ZONE_COLORS[i % ZONE_COLORS.length]}25`, borderLeftWidth: 3 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: ZONE_COLORS[i % ZONE_COLORS.length], marginBottom: 6, letterSpacing: "0.04em" }}>{zone.name}</p>
                    <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>{zone.concept}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dp.sustainabilityNotes && (
            <div style={{ padding: "14px 18px", borderRadius: 10, background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.2)" }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#34d399", marginBottom: 6 }}>Sustainability</p>
              <p style={{ fontSize: 13, color: "var(--text-2)" }}>{dp.sustainabilityNotes}</p>
            </div>
          )}
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
  const GOLD = "#D4A85F";

  if (!c) {
    const ec = proposal.eventConcept;
    return (
      <div style={{ padding: "40px 32px", display: "flex", flexDirection: "column", gap: 24, alignItems: "center", textAlign: "center" }}>
        {ec?.tagline && (
          <p style={{ fontSize: 26, fontWeight: 300, fontStyle: "italic", color: GOLD, letterSpacing: "-0.01em", lineHeight: 1.3, maxWidth: 560 }}>
            "{ec.tagline}"
          </p>
        )}
        {ec?.storyline && (
          <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.7, maxWidth: 600 }}>{ec.storyline}</p>
        )}
        {ec?.theme && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 999, border: `1px solid ${GOLD}40`, background: `${GOLD}0d` }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: GOLD }}>Theme</span>
            <span style={{ fontSize: 13, color: "var(--text-1)" }}>{ec.theme}</span>
          </div>
        )}
        <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 8 }}>
          Full details are in the <strong style={{ color: GOLD }}>Experience</strong> and <strong style={{ color: GOLD }}>Visual</strong> tabs.
        </p>
      </div>
    );
  }

  function updateConcept(field: string, value: any) { update("concept", { ...c, [field]: value }); }

  return (
    <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Hero banner */}
      <div style={{
        borderRadius: 16,
        background: `linear-gradient(135deg, ${GOLD}0f 0%, rgba(139,92,246,0.06) 100%)`,
        border: `1px solid ${GOLD}33`,
        padding: "28px 28px",
        textAlign: "center",
      }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: GOLD, opacity: 0.7, marginBottom: 12 }}>Event Theme</p>
        <EditableText value={c.theme} onChange={(v) => updateConcept("theme", v)}
          style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.025em", color: "var(--text-1)", lineHeight: 1.15, display: "block", marginBottom: 14 }}
          placeholder="Theme..." />
        <div style={{ borderTop: `1px solid ${GOLD}20`, paddingTop: 14 }}>
          <EditableText value={c.tagline} onChange={(v) => updateConcept("tagline", v)}
            style={{ fontSize: 17, fontStyle: "italic", fontWeight: 300, color: GOLD, letterSpacing: "0.01em", display: "block" }}
            placeholder="Tagline..." />
        </div>
      </div>

      {/* Description */}
      <div style={{ padding: "18px 22px", borderRadius: 12, background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 10 }}>Concept</p>
        <EditableTextarea value={c.description} onChange={(v) => updateConcept("description", v)}
          className="text-[var(--text-2)] text-sm leading-relaxed" placeholder="Event concept description..." />
      </div>

      {/* Highlights */}
      {c.highlights?.length > 0 && (
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 14 }}>Highlights</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {c.highlights.map((h, i) => (
              <div key={i}
                style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 16px", borderRadius: 12, background: "var(--bg-surface)", border: "1px solid var(--border)", transition: "border-color 0.15s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${GOLD}40`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
              >
                <span style={{ minWidth: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: GOLD, background: `${GOLD}15`, border: `1px solid ${GOLD}30`, flexShrink: 0 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <EditableText value={h}
                  onChange={(v) => { const next = [...c.highlights]; next[i] = v; updateConcept("highlights", next); }}
                  className="text-[var(--text-1)] text-sm leading-relaxed flex-1" placeholder="Highlight..." />
              </div>
            ))}
          </div>
          <button onClick={() => updateConcept("highlights", [...c.highlights, "New highlight"])}
            style={{ marginTop: 10, fontSize: 12, color: GOLD, background: "none", border: "none", cursor: "pointer", opacity: 0.75 }}>
            + Add highlight
          </button>
        </div>
      )}

      {/* Visual Mood Board */}
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 14 }}>✨ Visual Mood Board</p>
        {proposal.mood_board_images && proposal.mood_board_images.length > 0 ? (
          <div className="rounded-xl overflow-hidden border border-[var(--border)] shadow-lg hover:border-indigo-500/50 transition-colors">
            <img
              src={proposal.mood_board_images[0]}
              alt="Visual mood board"
              className="w-full object-cover"
              style={{ aspectRatio: "16/9" }}
              loading="lazy"
            />
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--border)] overflow-hidden animate-pulse"
            style={{ aspectRatio: "16/9", background: `linear-gradient(135deg, ${BUDGET_COLORS[0]}18, ${BUDGET_COLORS[2]}0d)` }}>
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[var(--text-3)]">
              <span style={{ fontSize: 28 }}>🎨</span>
              <span style={{ fontSize: 12 }}>Generating mood board…</span>
            </div>
          </div>
        )}
      </div>

      {/* Color Palette from visual direction */}
      {proposal.visualDirection?.palette?.length && (
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 14 }}>🎨 Color Palette</p>
          <div className="grid grid-cols-3 gap-3">
            {proposal.visualDirection.palette.map((color, idx) => (
              <div key={idx} className="rounded-lg overflow-hidden border border-[var(--border)]">
                <div className="h-20 w-full" style={{ backgroundColor: color.hex }} />
                <div className="p-3 bg-[var(--bg-surface)]">
                  <p className="font-semibold text-sm text-[var(--text-1)]">{color.name}</p>
                  <p className="text-xs text-[var(--text-3)] mt-0.5 font-mono">{color.hex}</p>
                  {color.usage && <p className="text-xs text-[var(--text-3)] mt-1 leading-relaxed">{color.usage}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BudgetTab({ proposal, update }: { proposal: ProposalData; update: (f: keyof ProposalData, v: any) => void }) {
  const lines  = proposal.budgetBreakdown ?? [];
  const total  = lines.reduce((s, l) => s + l.amount, 0);
  const mismatch = lines.length > 0 && Math.abs(total - proposal.budget) > 1;
  const gst      = Math.round(total * 0.18);
  const GOLD  = "#D4A85F";
  const COLORS = [GOLD, "#a78bfa", "#34d399", "#f59e0b", "#60a5fa", "#f472b6", "#a3e635", "#22d3ee"];

  function updateLine(i: number, field: keyof BudgetLine, value: any) {
    const next = [...lines]; next[i] = { ...next[i], [field]: value }; update("budgetBreakdown", next);
  }
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

  // SVG donut chart
  const r = 68; const cx = 100; const cy = 100;
  const circ = 2 * Math.PI * r;
  let acc = 0;
  const segments = lines.map((l, i) => {
    const pct = total > 0 ? l.amount / total : 0;
    const seg = { pct, start: acc, color: COLORS[i % COLORS.length] };
    acc += pct;
    return seg;
  });

  return (
    <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 28 }}>
      {mismatch && (
        <div style={{ display: "flex", gap: 10, padding: "10px 14px", borderRadius: 10, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", color: "#fbbf24", fontSize: 12 }}>
          <span>⚠</span>
          <span>Line items sum to <strong>{formatINR(total)}</strong> but proposal budget is <strong>{formatINR(proposal.budget)}</strong>. Δ {formatINR(Math.abs(total - proposal.budget))}</span>
        </div>
      )}

      {/* Recharts donut + total card */}
      {lines.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 flex flex-col md:flex-row items-center gap-8">
          <PieChart width={240} height={240}>
            <Pie data={lines} cx={120} cy={120} innerRadius={72} outerRadius={108} paddingAngle={2} dataKey="amount">
              {lines.map((_, idx) => (
                <Cell key={idx} fill={BUDGET_COLORS[idx % BUDGET_COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip
              formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Amount"]}
              contentStyle={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
            />
          </PieChart>
          <div className="flex-1 text-center md:text-left">
            <p className="text-xs uppercase tracking-widest text-[var(--text-3)] mb-1">Total Budget</p>
            <p className="text-4xl font-bold text-indigo-400 tabular-nums">₹{total.toLocaleString("en-IN")}</p>
            <p className="text-xs text-[var(--text-3)] mt-2">excl. GST (18%)</p>
          </div>
        </div>
      )}

      {/* Chart + legend row */}
      <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 32, alignItems: "center" }}>
        {/* Donut */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <svg viewBox="0 0 200 200" style={{ width: 176, height: 176 }}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={24} />
            {segments.map((seg, i) => (
              <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                stroke={seg.color} strokeWidth={24}
                strokeDasharray={`${seg.pct * circ} ${circ}`}
                strokeDashoffset={-(seg.start * circ)}
                transform={`rotate(-90 ${cx} ${cy})`}
                style={{ transition: "stroke-dasharray 0.4s ease" }}
              />
            ))}
            <circle cx={cx} cy={cy} r={44} fill="#0c0b12" />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
            <p style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Total</p>
            <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.02em" }}>{formatINR(total)}</p>
          </div>
        </div>

        {/* Legend */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, minWidth: 200 }}>
          {lines.map((l, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS[i % COLORS.length], flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13, color: "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.category}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{formatINR(l.amount)}</span>
              <span style={{ fontSize: 11, color: "var(--text-3)", minWidth: 34, textAlign: "right" }}>{Math.round(l.percentage)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* GST summary bar */}
      <div style={{ borderRadius: 14, border: `1px solid ${GOLD}30`, background: `${GOLD}08`, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
          {[
            { label: "Subtotal", value: formatINR(total), accent: false },
            { label: "GST (18%)", value: formatINR(gst), accent: true },
            { label: "Grand Total", value: formatINR(total + gst), accent: false },
          ].map(({ label, value, accent }, i) => (
            <div key={label} style={{ padding: "18px 20px", textAlign: "center", borderLeft: i > 0 ? `1px solid ${GOLD}20` : "none" }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>{label}</p>
              <p style={{ fontSize: 19, fontWeight: 800, color: accent ? GOLD : "var(--text-1)", fontVariantNumeric: "tabular-nums" }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Line items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {lines.map((l, i) => (
          <div key={i}
            style={{ display: "grid", gridTemplateColumns: "12px 1fr auto 160px 20px", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 12, background: "var(--bg-surface)", border: "1px solid var(--border)", transition: "border-color 0.15s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${COLORS[i % COLORS.length]}40`; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
          >
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS[i % COLORS.length] }} />
            <div>
              <EditableText value={l.category} onChange={(v) => updateLine(i, "category", v)} className="text-[var(--text-1)] text-sm font-semibold" placeholder="Category..." />
              <EditableText value={l.description} onChange={(v) => updateLine(i, "description", v)} className="text-[var(--text-3)] text-xs mt-0.5" placeholder="Description..." />
            </div>
            <EditableNumber value={l.amount} onChange={(v) => updateLine(i, "amount", v)} className="text-[var(--text-1)] text-sm font-bold tabular-nums" prefix="₹" />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="range" min={0} max={100} step={1} value={Math.round(l.percentage)}
                onChange={(e) => setSliderPct(i, Number(e.target.value))}
                style={{ flex: 1, height: 3, accentColor: COLORS[i % COLORS.length], cursor: "pointer" }}
                title={`${l.category}: ${l.percentage}%`}
              />
              <span style={{ fontSize: 11, color: "var(--text-3)", minWidth: 30, textAlign: "right" }}>{Math.round(l.percentage)}%</span>
            </div>
            <button onClick={() => update("budgetBreakdown", lines.filter((_, j) => j !== i))}
              style={{ fontSize: 12, color: "var(--text-3)", background: "none", border: "none", cursor: "pointer", opacity: 0, transition: "opacity 0.15s" }}
              onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.opacity = "1"; el.style.color = "#f87171"; }}
              onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.opacity = "0"; el.style.color = "var(--text-3)"; }}>
              ✕
            </button>
          </div>
        ))}
      </div>
      <button onClick={() => update("budgetBreakdown", [...lines, { category: "New Item", amount: 0, percentage: 0, description: "" }])}
        style={{ fontSize: 12, color: GOLD, background: "none", border: "none", cursor: "pointer", opacity: 0.75, alignSelf: "flex-start" }}>
        + Add budget line
      </button>
    </div>
  );
}

function TimelineTab({ proposal, update }: { proposal: ProposalData; update: (f: keyof ProposalData, v: any) => void }) {
  const phases = proposal.timeline ?? [];
  const GOLD   = "#D4A85F";
  const PHASE_COLORS = [GOLD, "#a78bfa", "#34d399", "#60a5fa", "#f472b6", "#f59e0b", "#22d3ee", "#a3e635"];

  function updatePhase(i: number, field: keyof TimelinePhase, value: any) {
    const next = [...phases]; next[i] = { ...next[i], [field]: value }; update("timeline", next);
  }

  return (
    <div style={{ padding: "28px 32px" }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 24 }}>Project Timeline</p>
      <div className="relative">
        {phases.map((phase, i) => {
          const color = PHASE_COLORS[i % PHASE_COLORS.length];
          const isMilestone = phase.milestone;
          return (
            <div key={i} className="flex gap-5 pb-8 last:pb-0">
              {/* Dot + connector line */}
              <div className="flex flex-col items-center" style={{ flexShrink: 0 }}>
                <div style={{
                  width: isMilestone ? 18 : 14,
                  height: isMilestone ? 18 : 14,
                  borderRadius: "50%",
                  background: isMilestone ? color : "var(--bg-card)",
                  border: `2px solid ${color}`,
                  flexShrink: 0,
                  marginTop: 3,
                  boxShadow: isMilestone ? `0 0 10px ${color}50` : "none",
                }} />
                {i < phases.length - 1 && (
                  <div style={{ width: 2, flex: 1, background: `linear-gradient(to bottom, ${color}60, var(--border))`, marginTop: 4 }} />
                )}
              </div>

              {/* Card */}
              <div className="flex-1" style={{ paddingBottom: i < phases.length - 1 ? 0 : 0 }}>
                <div style={{
                  borderRadius: 14,
                  border: `1px solid ${isMilestone ? `${color}50` : "var(--border)"}`,
                  background: isMilestone ? `${color}08` : "var(--bg-surface)",
                  overflow: "hidden",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ flex: 1 }}>
                      <EditableText value={phase.phase} onChange={(v) => updatePhase(i, "phase", v)}
                        style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}
                        placeholder="Phase name..." />
                    </div>
                    <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: `${color}15`, border: `1px solid ${color}30`, color, whiteSpace: "nowrap" }}>
                      <EditableText value={phase.daysOut} onChange={(v) => updatePhase(i, "daysOut", v)}
                        style={{ color: "inherit", fontSize: "inherit", fontWeight: "inherit" }}
                        placeholder="T-30 days" />
                    </span>
                    {isMilestone && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: `${GOLD}15`, color: GOLD, fontWeight: 600 }}>📌 Milestone</span>}
                  </div>
                  <div style={{ padding: "10px 16px 12px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {phase.tasks.map((task, j) => (
                        <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                          <span style={{ color, fontSize: 8, marginTop: 5, flexShrink: 0 }}>✓</span>
                          <EditableText value={task}
                            onChange={(v) => { const next = [...phase.tasks]; next[j] = v; updatePhase(i, "tasks", next); }}
                            style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5, flex: 1 }}
                            placeholder="Task..." />
                          <button onClick={() => updatePhase(i, "tasks", phase.tasks.filter((_, k) => k !== j))}
                            style={{ fontSize: 11, color: "var(--text-3)", background: "none", border: "none", cursor: "pointer", opacity: 0, transition: "opacity 0.15s", flexShrink: 0 }}
                            onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.opacity = "1"; el.style.color = "#f87171"; }}
                            onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.opacity = "0"; el.style.color = "var(--text-3)"; }}>✕</button>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 8 }}>
                      <button onClick={() => updatePhase(i, "tasks", [...phase.tasks, "New task"])}
                        style={{ fontSize: 12, color, background: "none", border: "none", cursor: "pointer", opacity: 0.75 }}>+ Add task</button>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-3)", cursor: "pointer" }}>
                        <input type="checkbox" checked={phase.milestone} onChange={(e) => updatePhase(i, "milestone", e.target.checked)} style={{ accentColor: GOLD }} />
                        Milestone
                      </label>
                      <button onClick={() => update("timeline", phases.filter((_, k) => k !== i))}
                        style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-3)", background: "none", border: "none", cursor: "pointer" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#f87171"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-3)"; }}>Remove</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={() => update("timeline", [...phases, { phase: "New Phase", daysOut: "TBD", tasks: ["Task 1"], milestone: false }])}
        style={{ fontSize: 12, color: GOLD, background: "none", border: "none", cursor: "pointer", opacity: 0.75, marginTop: 8 }}>
        + Add phase
      </button>
    </div>
  );
}

function VendorsTab({ proposal, update, hideToggle = false }: {
  proposal:    ProposalData;
  update:      (f: keyof ProposalData, v: any) => void;
  hideToggle?: boolean;
}) {
  const vendors = proposal.vendors ?? [];
  const [viewMode, setViewMode] = useState<"client" | "planner">("client");
  function updateVendor(i: number, field: keyof ProposalVendor, value: any) {
    const next = [...vendors]; next[i] = { ...next[i], [field]: value }; update("vendors", next);
  }
  return (
    <div>
      {/* Header + toggle */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <h2 className="text-lg font-semibold text-[var(--text-1)]">📋 Vendors</h2>
        {!hideToggle && (
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("client")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                viewMode === "client"
                  ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/50"
                  : "bg-[var(--bg-surface)] text-[var(--text-3)] border border-[var(--border)] hover:border-indigo-500/50"
              }`}
            >
              👁️ Client View
            </button>
            <button
              onClick={() => setViewMode("planner")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                viewMode === "planner"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                  : "bg-[var(--bg-surface)] text-[var(--text-3)] border border-[var(--border)] hover:border-emerald-500/50"
              }`}
            >
              🔐 Planner View
            </button>
          </div>
        )}
      </div>

      <div className="p-6">
        {/* CLIENT VIEW — no contact info */}
        {viewMode === "client" && (
          <div className="space-y-3">
            {vendors.map((v, idx) => (
              <div key={idx} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-[var(--text-1)]">{v.name || v.category}</p>
                    {v.name && <p className="text-xs text-indigo-400 mt-0.5">{v.category}</p>}
                    <p className="text-sm text-[var(--text-2)] mt-1">{v.role}</p>
                    {v.notes && (
                      <p className="text-xs text-[var(--text-3)] mt-2 leading-relaxed italic">💡 {v.notes}</p>
                    )}
                  </div>
                  {!!v.estimatedCost && (
                    <div className="text-right ml-4">
                      <p className="font-bold text-emerald-400">₹{v.estimatedCost.toLocaleString()}</p>
                      <p className="text-xs text-[var(--text-3)] mt-1">Estimated</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PLANNER VIEW — editable + contact links */}
        {viewMode === "planner" && (
          <div className="space-y-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
            <div className="flex gap-2 mb-3 text-xs text-emerald-300">
              <span>🔐</span><span>Internal only — client cannot see this</span>
            </div>
            {vendors.map((v, i) => (
              <div key={i} className="rounded-lg border border-emerald-500/30 bg-[var(--bg-surface)] p-4 group">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 text-sm font-bold shrink-0">{v.category[0]}</div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {v.name && (
                          <EditableText value={v.name} onChange={(val) => updateVendor(i,"name",val)} className="text-[var(--text-1)] font-semibold text-sm" placeholder="Vendor name..." />
                        )}
                        <EditableText value={v.category} onChange={(val) => updateVendor(i,"category",val)} className={`${v.name ? "text-indigo-400 text-xs" : "text-[var(--text-1)] font-semibold text-sm"}`} placeholder="Category..." />
                      </div>
                      <EditableNumber value={v.estimatedCost} onChange={(val) => updateVendor(i,"estimatedCost",val)} className="text-emerald-400 text-sm font-semibold shrink-0" prefix="₹" />
                    </div>
                    <EditableText value={v.role} onChange={(val) => updateVendor(i,"role",val)} className="text-[var(--text-2)] text-xs" placeholder="Role..." />
                    <EditableText value={v.notes} onChange={(val) => updateVendor(i,"notes",val)} className="text-[var(--text-3)] text-xs italic" placeholder="Notes..." />
                    {(v.contact?.phone || v.contact?.email) && (
                      <div className="flex items-center gap-3 pt-1">
                        {v.contact?.phone && (
                          <a href={`tel:${v.contact.phone}`} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                            📞 {v.contact.phone}
                          </a>
                        )}
                        {v.contact?.email && (
                          <a href={`mailto:${v.contact.email}`} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                            ✉️ {v.contact.email}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  <button onClick={() => update("vendors",vendors.filter((_,j)=>j!==i))} className="text-[var(--text-3)] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-xs">✕</button>
                </div>
              </div>
            ))}
            <button onClick={() => update("vendors",[...vendors,{category:"New Vendor",role:"",estimatedCost:0,notes:""}])} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">+ Add vendor</button>
          </div>
        )}
      </div>
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
  proposal, update, onDirectChange,
}: {
  proposal: ProposalData;
  update: (f: keyof ProposalData, v: any) => void;
  onDirectChange: (p: ProposalData) => void;
}) {
  const items = proposal.compliance ?? [];
  const score = items.length ? calcScore(items) : 0;

  function regenerate() {
    if (items.length && !confirm("Replace existing checklist with a fresh one from the event type? Statuses will be reset.")) return;
    onDirectChange({ ...proposal, compliance: generateChecklist(proposal.eventType, proposal.eventDate ?? null) });
  }

  function cycleStatus(id: string) {
    onDirectChange({ ...proposal, compliance: items.map((it) => {
      if (it.id !== id) return it;
      const idx = STATUS_CYCLE.indexOf(it.status);
      const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
      return { ...it, status: next };
    }) });
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

// ── Floor Plan viewer (inline, fills container) ───────────────────────────────

function FloorPlanViewerInline({ elements }: { elements: FpElement[] }) {
  const maxX = Math.max(FP_GW, ...elements.map((el) => el.x + el.w)) + 2;
  const maxY = Math.max(FP_GH, ...elements.map((el) => el.y + el.h)) + 2;
  const vw   = maxX * FP_CELL;
  const vh   = maxY * FP_CELL;
  return (
    <svg
      viewBox={`0 0 ${vw} ${vh}`}
      width="100%" height="100%"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block" }}
    >
      <defs>
        <pattern id="fpvi-cell" width={FP_CELL} height={FP_CELL} patternUnits="userSpaceOnUse">
          <path d={`M ${FP_CELL} 0 L 0 0 0 ${FP_CELL}`} fill="none" stroke="#1e2028" strokeWidth="0.5" />
        </pattern>
        <pattern id="fpvi-major" width={FP_CELL * 5} height={FP_CELL * 5} patternUnits="userSpaceOnUse">
          <rect width={FP_CELL * 5} height={FP_CELL * 5} fill="url(#fpvi-cell)" />
          <path d={`M ${FP_CELL * 5} 0 L 0 0 0 ${FP_CELL * 5}`} fill="none" stroke="#252830" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="#0d0e11" />
      <rect width="100%" height="100%" fill="url(#fpvi-major)" />
      {elements.map((el) => {
        const cfg = FP_KINDS[el.kind];
        const px  = el.x * FP_CELL;
        const py  = el.y * FP_CELL;
        const pw  = el.w * FP_CELL;
        const ph  = el.h * FP_CELL;
        const cx  = px + pw / 2;
        const cy  = py + ph / 2;
        return (
          <g key={el.id} transform={`rotate(${el.rotation}, ${cx}, ${cy})`}>
            <rect
              x={px} y={py} width={pw} height={ph}
              rx={el.kind === "table" ? Math.min(pw, ph) / 2 : 4}
              fill={cfg.fill} stroke={`${cfg.stroke}88`} strokeWidth={1}
            />
            <text
              x={cx} y={cy} dy="0.4em" fill={cfg.stroke}
              fontSize={Math.max(7, Math.min(12, pw / 5))}
              textAnchor="middle" fontFamily="sans-serif" fontWeight="600"
              pointerEvents="none"
            >
              {el.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── DesignLayoutTab ───────────────────────────────────────────────────────────

type DesignSubTab = "visual" | "stage" | "decor" | "3d" | "floor";

function DesignLayoutTab({
  proposal, update, onChange,
  onGenerateImage, onUploadImage, generatingImage, imageGenError,
  editMode, canEdit, onSwitchToEdit,
}: {
  proposal: ProposalData;
  update: (f: keyof ProposalData, v: any) => void;
  onChange: (p: ProposalData) => void;
  onGenerateImage: () => void;
  onUploadImage: (file: File) => void;
  generatingImage: boolean;
  imageGenError: string;
  editMode: boolean;
  canEdit: boolean;
  onSwitchToEdit: () => void;
}) {
  const [sub, setSub] = React.useState<DesignSubTab>("visual");

  const SUB_TABS: { id: DesignSubTab; label: string }[] = [
    { id: "visual", label: "✨ Visual Identity" },
    { id: "stage",  label: "🎭 Stage Design"   },
    { id: "decor",  label: "🎨 Decor Zones"    },
    { id: "3d",     label: "🎬 3D Renders"     },
    { id: "floor",  label: "📐 Floor Plan"     },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* Sub-tab bar */}
      <div style={{
        display: "flex", gap: 2, padding: "12px 16px",
        borderBottom: "1px solid var(--border)", background: "var(--bg-surface)",
        overflowX: "auto",
      }}>
        {SUB_TABS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSub(s.id)}
            style={{
              padding: "7px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: sub === s.id ? "1px solid rgba(99,102,241,0.5)" : "1px solid transparent",
              background: sub === s.id ? "rgba(99,102,241,0.12)" : "transparent",
              color: sub === s.id ? "#a5b4fc" : "var(--text-3)",
              cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Sub-tab content — VisualTab has its own padding, others use 20px */}
      {sub === "visual" && (
        <VisualTab
          proposal={proposal}
          update={update}
          onGenerateImage={onGenerateImage}
          onUploadImage={onUploadImage}
          generatingImage={generatingImage}
          imageGenError={imageGenError}
        />
      )}
      {sub === "stage" && (
        <StageTab proposal={proposal} update={update} />
      )}
      {sub === "decor" && (
        <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
          {proposal.decorPlan?.hero && (
            <div style={{ borderRadius: 14, border: "2px solid rgba(99,102,241,0.4)", background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.08))", padding: "24px" }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>🎨 Design Statement</p>
              <EditableText value={proposal.decorPlan.hero}
                onChange={(v) => update("decorPlan", { ...proposal.decorPlan, hero: v })}
                style={{ fontSize: 20, fontWeight: 800, color: "var(--text-1)", lineHeight: 1.3 }}
                placeholder="Hero design statement..." />
            </div>
          )}
          {(proposal.decorPlan?.zones?.length ?? 0) > 0 ? (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 12 }}>Themed Zones</p>
              <div className="grid md:grid-cols-2 gap-4">
                {proposal.decorPlan!.zones.map((zone, idx) => (
                  <div key={idx} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 hover:border-indigo-500/50 transition-colors">
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(168,85,247,0.18))", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10, fontSize: 16 }}>🎭</div>
                    <EditableText value={zone.name}
                      onChange={(v) => { const next = [...proposal.decorPlan!.zones]; next[idx] = { ...next[idx], name: v }; update("decorPlan", { ...proposal.decorPlan, zones: next }); }}
                      style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", marginBottom: 6, display: "block" }}
                      placeholder="Zone name..." />
                    <EditableText value={zone.concept}
                      onChange={(v) => { const next = [...proposal.decorPlan!.zones]; next[idx] = { ...next[idx], concept: v }; update("decorPlan", { ...proposal.decorPlan, zones: next }); }}
                      style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.55 }}
                      placeholder="Zone concept..." />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: "var(--text-3)", textAlign: "center", padding: "32px 0" }}>No decor zones defined yet</p>
          )}
          {proposal.decorPlan?.sustainabilityNotes && (
            <div style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(52,211,153,0.25)", background: "rgba(52,211,153,0.05)" }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#34d399", marginBottom: 6 }}>♻ Sustainability</p>
              <EditableText value={proposal.decorPlan.sustainabilityNotes}
                onChange={(v) => update("decorPlan", { ...proposal.decorPlan, sustainabilityNotes: v })}
                style={{ fontSize: 13, color: "var(--text-2)" }}
                placeholder="Sustainability notes..." />
            </div>
          )}
        </div>
      )}
      {sub === "3d" && (
        <VisualsTab proposal={proposal} onChange={onChange} />
      )}
      {sub === "floor" && (
        <div style={{ padding: "20px" }}>
          {(editMode && canEdit) ? (
            <div style={{ height: 560 }}>
              <FloorPlanBuilder
                initialElements={proposal.floorPlan}
                onElementsChange={(els: FpElement[]) => update("floorPlan", els)}
              />
            </div>
          ) : proposal.floorPlan?.length ? (
            <>
              <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 12 }}>
                Floor plan · {proposal.floorPlan.length} element{proposal.floorPlan.length !== 1 ? "s" : ""}
                {" · "}
                <button onClick={onSwitchToEdit} style={{ color: "var(--text-2)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontSize: 12 }}>Edit</button>
              </p>
              <div style={{ height: 420, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)", background: "#0d0e11" }}>
                <FloorPlanViewerInline elements={proposal.floorPlan} />
              </div>
            </>
          ) : (
            <div style={{ padding: "48px 0", textAlign: "center" }}>
              <p style={{ fontSize: 14, color: "var(--text-3)", marginBottom: 12 }}>No floor plan yet.</p>
              {canEdit && (
                <button onClick={onSwitchToEdit} style={{ fontSize: 13, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                  Switch to edit mode to create one
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── VisualsTab ────────────────────────────────────────────────────────────────

function VisualsTab({
  proposal,
  onChange,
}: {
  proposal: ProposalData;
  onChange:  (p: ProposalData) => void;
}) {
  const [deleting, setDeleting] = React.useState<string | null>(null);

  const visuals: GeneratedVisual[] = proposal.generatedVisuals ?? [];

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await fetch(`/api/proposals/${proposal.id}/visuals?visualId=${id}`, { method: "DELETE" });
      onChange({ ...proposal, generatedVisuals: visuals.filter((v) => v.id !== id) });
    } finally {
      setDeleting(null);
    }
  }

  function handleDownload(v: GeneratedVisual) {
    const a = document.createElement("a");
    a.href = v.image;
    a.download = `${(v.brandName ?? "event").replace(/\s+/g, "-").toLowerCase()}-visual.png`;
    a.click();
  }

  return (
    <div style={{ padding: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>
            Generated 3D Visuals
          </p>
          <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
            {visuals.length > 0
              ? `${visuals.length} render${visuals.length !== 1 ? "s" : ""} saved to this proposal`
              : "No renders yet — generate one from the Toolkit"}
          </p>
        </div>
        <a
          href={`/toolkit/event-visual?from=${proposal.id}`}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 14px", borderRadius: 9, fontSize: 13, fontWeight: 600,
            background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)",
            color: "#a78bfa", textDecoration: "none", transition: "all 0.15s",
          }}
        >
          🎨 Generate New
        </a>
      </div>

      {visuals.length === 0 ? (
        <div style={{
          padding: "60px 0", textAlign: "center",
          border: "1px dashed var(--border)", borderRadius: 14,
          background: "var(--bg-card)",
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎨</div>
          <p style={{ fontSize: 14, color: "var(--text-2)", fontWeight: 600 }}>No visuals yet</p>
          <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4, marginBottom: 20 }}>
            Generate a photorealistic 3D render of this event
          </p>
          <a
            href={`/toolkit/event-visual?from=${proposal.id}`}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "10px 20px", borderRadius: 9, fontSize: 13, fontWeight: 600,
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              color: "#fff", textDecoration: "none",
            }}
          >
            Generate 3D Visual →
          </a>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24 }}>
          {visuals.map((v) => (
            <div
              key={v.id}
              style={{
                borderRadius: 16, border: "1px solid var(--border)",
                background: "var(--bg-card)", overflow: "hidden",
                boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
              }}
            >
              {/* Image */}
              <div style={{ position: "relative", background: "#0d0e11" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={v.image}
                  alt={`3D visual for ${v.brandName ?? proposal.title}`}
                  style={{ width: "100%", display: "block" }}
                />
              </div>

              {/* Meta */}
              <div style={{ padding: "12px 14px" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  {v.eventType && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                      background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)",
                      color: "#a78bfa", textTransform: "capitalize",
                    }}>{v.eventType}</span>
                  )}
                  {v.theme && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                      background: "var(--bg-surface)", border: "1px solid var(--border)",
                      color: "var(--text-3)", textTransform: "capitalize",
                    }}>{v.theme}</span>
                  )}
                  <span style={{ fontSize: 10, color: "var(--text-3)", marginLeft: "auto" }}>
                    {new Date(v.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => handleDownload(v)}
                    style={{
                      flex: 1, padding: "7px 0", borderRadius: 8, fontSize: 12, fontWeight: 600,
                      background: "var(--bg-surface)", border: "1px solid var(--border)",
                      color: "var(--text-2)", cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    ↓ Download
                  </button>
                  <button
                    onClick={() => handleDelete(v.id)}
                    disabled={deleting === v.id}
                    style={{
                      padding: "7px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                      background: "transparent",
                      border: "1px solid rgba(239,68,68,0.2)",
                      color: deleting === v.id ? "var(--text-3)" : "rgba(239,68,68,0.6)",
                      cursor: deleting === v.id ? "not-allowed" : "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {deleting === v.id ? "…" : "✕"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
