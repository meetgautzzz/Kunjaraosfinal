"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { ProposalData } from "@/lib/proposals";

// ── Types ─────────────────────────────────────────────────────────────────────

type EventType = "booth" | "stage" | "concert" | "festival";
type Theme = "tropical" | "luxury" | "modern" | "gaming" | "futuristic" | "corporate" | "minimal" | "traditional";

interface FormState {
  eventType:    EventType;
  brandName:    string;
  dimensions:   string;
  theme:        Theme;
  features:     string[];
  budget:       string;
  audienceType: string;
}

const EVENT_TYPES: { value: EventType; label: string; desc: string; icon: string }[] = [
  { value: "booth",    label: "Exhibition Booth", desc: "Branded trade show / expo setup", icon: "🏪" },
  { value: "stage",    label: "Stage Design",     desc: "Concert or event stage",          icon: "🎪" },
  { value: "concert",  label: "Concert",          desc: "Live music environment",           icon: "🎵" },
  { value: "festival", label: "Festival",         desc: "Multi-zone outdoor experience",   icon: "🎡" },
];

const THEMES: { value: Theme; label: string }[] = [
  { value: "luxury",      label: "Luxury" },
  { value: "modern",      label: "Modern" },
  { value: "futuristic",  label: "Futuristic" },
  { value: "gaming",      label: "Gaming / Neon" },
  { value: "tropical",    label: "Tropical" },
  { value: "corporate",   label: "Corporate" },
  { value: "minimal",     label: "Minimal" },
  { value: "traditional", label: "Traditional" },
];

const FEATURE_OPTIONS = [
  "LED Panels",
  "Truss Lighting",
  "Branded Bar Counter",
  "Smoke / Haze Effects",
  "Moving Lights",
  "Projection Mapping",
  "VIP Lounge Area",
  "Photo Booth Zone",
  "Sponsor Banners",
  "Stage Risers",
  "Laser Lights",
  "Hanging Installations",
  "Interactive Screens",
  "Greenery / Floral",
  "Neon Signage",
  "Crowd Barriers",
];

const GENERATING_STEPS = [
  "Composing style and camera framing",
  "Building event type layout",
  "Applying theme and materials",
  "Rendering with Unreal Engine quality",
  "Final cinematic polish",
];

const DEFAULT_FORM: FormState = {
  eventType:    "booth",
  brandName:    "",
  dimensions:   "",
  theme:        "modern",
  features:     ["LED Panels", "Branded Bar Counter"],
  budget:       "",
  audienceType: "",
};

// ── Proposal → form mapping ───────────────────────────────────────────────────

function mapEventType(raw?: string): EventType {
  if (!raw) return "booth";
  const s = raw.toLowerCase();
  if (s.includes("stage") || s.includes("concert") && s.includes("stage")) return "stage";
  if (s.includes("concert") || s.includes("music") || s.includes("live")) return "concert";
  if (s.includes("festival") || s.includes("outdoor") || s.includes("multi")) return "festival";
  if (s.includes("booth") || s.includes("expo") || s.includes("trade") || s.includes("exhibition")) return "booth";
  return "booth";
}

const THEME_KEYWORDS: Record<Theme, string[]> = {
  luxury:      ["luxury", "premium", "opulent", "gold", "champagne", "royal", "elite"],
  modern:      ["modern", "contemporary", "clean", "minimal", "sleek"],
  futuristic:  ["futuristic", "sci-fi", "tech", "digital", "cyber", "holographic"],
  gaming:      ["gaming", "neon", "rgb", "esports", "game", "cyberpunk"],
  tropical:    ["tropical", "beach", "island", "nature", "green", "botanical"],
  corporate:   ["corporate", "business", "professional", "executive", "formal"],
  minimal:     ["minimal", "minimalist", "simple", "understated", "white"],
  traditional: ["traditional", "cultural", "ethnic", "classic", "heritage", "rustic"],
};

function mapTheme(raw?: string): Theme {
  if (!raw) return "modern";
  const s = raw.toLowerCase();
  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS) as [Theme, string[]][]) {
    if (keywords.some((k) => s.includes(k))) return theme;
  }
  return "modern";
}

function mapFeatures(proposal: ProposalData): string[] {
  const candidates: string[] = [];

  // Pull from activations
  const activations = proposal.experienceElements?.activations ?? [];
  for (const a of activations) {
    if (a.name) candidates.push(a.name.toLowerCase());
  }
  // Pull from budget categories
  const budget = proposal.budgetBreakdown ?? [];
  for (const b of budget) {
    if (b.category) candidates.push(b.category.toLowerCase());
  }

  const matched: string[] = [];
  for (const feature of FEATURE_OPTIONS) {
    const fl = feature.toLowerCase();
    if (candidates.some((c) => c.includes(fl.split(" ")[0]) || fl.includes(c.split(" ")[0]))) {
      matched.push(feature);
    }
  }
  return matched.length >= 1 ? matched.slice(0, 8) : DEFAULT_FORM.features;
}

function proposalToForm(proposal: ProposalData): FormState {
  const brandName =
    proposal.client?.name ??
    proposal.client?.companyName ??
    (proposal.concept as { title?: string } | undefined)?.title ??
    "";

  const themeRaw =
    (proposal.concept as { theme?: string } | undefined)?.theme ??
    (proposal.eventConcept as { theme?: string } | undefined)?.theme ??
    proposal.visualDirection?.overallAesthetic ??
    "";

  return {
    eventType:    mapEventType(proposal.eventType),
    brandName,
    dimensions:   "",
    theme:        mapTheme(themeRaw),
    features:     mapFeatures(proposal),
    budget:       proposal.budget ? String(proposal.budget) : "",
    audienceType: (proposal as Record<string, unknown>).audienceType as string ?? "",
  };
}

// ── Page inner (needs useSearchParams) ───────────────────────────────────────

function EventVisualPageInner() {
  const searchParams = useSearchParams();
  const fromId = searchParams.get("from");

  const [form,      setForm]      = useState<FormState>(DEFAULT_FORM);
  const [view,      setView]      = useState<"form" | "generating" | "result">("form");
  const [step,      setStep]      = useState(0);
  const [image,     setImage]     = useState<string | null>(null);
  const [prompt,    setPrompt]    = useState<string>("");
  const [error,     setError]     = useState<string>("");
  const [copyDone,   setCopyDone]   = useState(false);
  const [prefilling, setPrefilling] = useState(!!fromId);
  const [inserting,  setInserting]  = useState(false);
  const [inserted,   setInserted]   = useState(false);

  // Pre-fill from proposal when ?from= is present
  useEffect(() => {
    if (!fromId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/proposals/${fromId}`);
        if (!res.ok) throw new Error("Could not load proposal");
        const data = await res.json();
        const proposal: ProposalData = data.data ?? data;
        if (!cancelled) setForm(proposalToForm(proposal));
      } catch {
        // silently fall back to default form
      } finally {
        if (!cancelled) setPrefilling(false);
      }
    })();
    return () => { cancelled = true; };
  }, [fromId]);

  function toggleFeature(f: string) {
    setForm((prev) => ({
      ...prev,
      features: prev.features.includes(f)
        ? prev.features.filter((x) => x !== f)
        : [...prev.features, f],
    }));
  }

  async function handleGenerate() {
    if (!form.brandName.trim() || !form.dimensions.trim() || form.features.length === 0) return;
    setError("");
    setView("generating");
    setStep(0);

    const interval = setInterval(() => {
      setStep((s) => (s < GENERATING_STEPS.length - 1 ? s + 1 : s));
    }, 2800);

    try {
      const res = await fetch("/api/toolkit/event-visual", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      clearInterval(interval);

      if (!res.ok) throw new Error(data.error ?? "Generation failed.");

      setStep(GENERATING_STEPS.length);
      await new Promise((r) => setTimeout(r, 400));
      setImage(data.image);
      setPrompt(data.promptUsed ?? "");
      setView("result");
    } catch (e: unknown) {
      clearInterval(interval);
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setView("form");
    }
  }

  function handleDownload() {
    if (!image) return;
    const a = document.createElement("a");
    a.href = image;
    a.download = `${form.brandName.replace(/\s+/g, "-").toLowerCase()}-event-visual.png`;
    a.click();
  }

  function handleCopyPrompt() {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    });
  }

  async function handleInsertIntoProposal() {
    if (!image || !fromId || inserting) return;
    setInserting(true);
    try {
      const visual = {
        id:        crypto.randomUUID(),
        image,
        promptUsed: prompt,
        createdAt: new Date().toISOString(),
        eventType: form.eventType,
        theme:     form.theme,
        brandName: form.brandName,
      };
      const res = await fetch(`/api/proposals/${fromId}/visuals`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(visual),
      });
      if (!res.ok) throw new Error("Save failed");
      setInserted(true);
    } catch {
      // fail silently — user can download manually
    } finally {
      setInserting(false);
    }
  }

  // ── Generating ──────────────────────────────────────────────────────────────
  if (view === "generating") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 px-6">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-2 border-violet-500/20 animate-ping" />
          <div className="absolute inset-0 rounded-full border-2 border-violet-500/40 animate-pulse" />
          <div className="w-20 h-20 rounded-full bg-violet-500/10 flex items-center justify-center text-4xl">
            🎨
          </div>
        </div>
        <div className="text-center">
          <p className="text-[var(--text-1)] font-bold text-xl">Generating 3D Visual…</p>
          <p className="text-[var(--text-3)] text-sm mt-1">This takes 15–30 seconds</p>
        </div>
        <div className="flex flex-col gap-3 w-80">
          {GENERATING_STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-3 text-sm">
              <div className={`w-2 h-2 rounded-full shrink-0 transition-all duration-500 ${
                i < step ? "bg-violet-400" : i === step ? "bg-violet-400 animate-pulse" : "bg-[var(--border)]"
              }`} />
              <span className={i <= step ? "text-[var(--text-2)]" : "text-[var(--text-3)]"}>{label}</span>
              {i < step && <span className="text-emerald-400 text-xs ml-auto">✓</span>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Result ──────────────────────────────────────────────────────────────────
  if (view === "result" && image) {
    return (
      <div className="max-w-5xl mx-auto space-y-5 px-4 py-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView("form")}
              className="text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors text-sm"
            >
              ← Edit Inputs
            </button>
            <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center text-lg">🎨</div>
            <h2 className="text-lg font-bold text-[var(--text-1)]">3D Event Visual</h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              onClick={() => { setImage(null); handleGenerate(); }}
              className="px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text-1)] text-sm transition-colors"
            >
              ↺ Regenerate
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text-1)] text-sm transition-colors"
            >
              ↓ Download
            </button>
            {fromId && (
              <button
                onClick={inserted ? () => { window.location.href = `/proposals/${fromId}`; } : handleInsertIntoProposal}
                disabled={inserting}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 16px", borderRadius: 9, fontSize: 13, fontWeight: 600,
                  cursor: inserting ? "not-allowed" : "pointer",
                  transition: "all 0.15s",
                  ...(inserted
                    ? { background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#4ade80" }
                    : { background: "linear-gradient(135deg, #7c3aed, #6d28d9)", border: "1px solid transparent", color: "#fff" }
                  ),
                }}
              >
                {inserting ? (
                  <><span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />Saving…</>
                ) : inserted ? (
                  "✓ Saved → View in Proposal"
                ) : (
                  "Insert into Proposal"
                )}
              </button>
            )}
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden border border-[var(--border)] bg-[#0d0e11]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={`3D event visual for ${form.brandName}`}
            className="w-full object-cover"
            style={{ maxHeight: 580 }}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { label: "Type",  value: EVENT_TYPES.find((e) => e.value === form.eventType)?.label ?? form.eventType },
            { label: "Brand", value: form.brandName },
            { label: "Size",  value: form.dimensions },
            { label: "Theme", value: THEMES.find((t) => t.value === form.theme)?.label ?? form.theme },
          ].map(({ label, value }) => (
            <div key={label} style={{
              padding: "5px 12px", borderRadius: 20, fontSize: 12,
              background: "var(--bg-surface)", border: "1px solid var(--border)",
              color: "var(--text-2)",
            }}>
              <span style={{ color: "var(--text-3)", marginRight: 4 }}>{label}:</span>{value}
            </div>
          ))}
          {form.features.map((f) => (
            <div key={f} style={{
              padding: "5px 12px", borderRadius: 20, fontSize: 12,
              background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)",
              color: "#a78bfa",
            }}>{f}</div>
          ))}
        </div>

        {prompt && (
          <div style={{
            borderRadius: 12, border: "1px solid var(--border)",
            background: "var(--bg-card)", overflow: "hidden",
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 16px", borderBottom: "1px solid var(--border)",
              background: "var(--bg-surface)",
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)" }}>
                Prompt Used
              </span>
              <button
                onClick={handleCopyPrompt}
                style={{
                  fontSize: 11, padding: "3px 10px", borderRadius: 6, cursor: "pointer",
                  background: copyDone ? "rgba(16,185,129,0.12)" : "var(--bg-hover)",
                  border: copyDone ? "1px solid rgba(16,185,129,0.3)" : "1px solid var(--border)",
                  color: copyDone ? "#34d399" : "var(--text-2)",
                  transition: "all 0.15s",
                }}
              >
                {copyDone ? "✓ Copied" : "Copy"}
              </button>
            </div>
            <p style={{ padding: "12px 16px", fontSize: 11, color: "var(--text-3)", lineHeight: 1.7, fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
              {prompt}
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center text-2xl shrink-0">
          🎨
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-1)]">3D Event Visual Generator</h1>
          <p className="text-[var(--text-3)] text-xs">Photorealistic 3D renders of your event setup · Powered by GPT-Image-1</p>
        </div>
        {fromId && (
          <span style={{
            marginLeft: "auto", fontSize: 11, padding: "4px 10px", borderRadius: 20,
            background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)",
            color: "#a78bfa", fontWeight: 600,
          }}>
            {prefilling ? "Loading proposal…" : "From Proposal"}
          </span>
        )}
      </div>

      {error && (
        <div style={{
          padding: "12px 16px", borderRadius: 10, fontSize: 13,
          background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5",
        }}>
          {error}
        </div>
      )}

      {/* Event Type */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--text-3)] mb-3">
          Event Type
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {EVENT_TYPES.map((et) => (
            <button
              key={et.value}
              onClick={() => setForm((p) => ({ ...p, eventType: et.value }))}
              style={{
                padding: "12px 10px", borderRadius: 10, textAlign: "left", cursor: "pointer",
                border: form.eventType === et.value
                  ? "1px solid rgba(139,92,246,0.5)"
                  : "1px solid var(--border)",
                background: form.eventType === et.value
                  ? "rgba(139,92,246,0.08)"
                  : "var(--bg-card)",
                transition: "all 0.15s",
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 6 }}>{et.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-1)" }}>{et.label}</div>
              <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 2 }}>{et.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Brand + Dimensions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--text-3)] mb-2">
            Brand / Event Name *
          </label>
          <input
            className="input w-full"
            placeholder="e.g. Nike, TechFest 2026"
            value={form.brandName}
            onChange={(e) => setForm((p) => ({ ...p, brandName: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--text-3)] mb-2">
            Dimensions *
          </label>
          <input
            className="input w-full"
            placeholder="e.g. 20ft × 30ft, 10m × 15m"
            value={form.dimensions}
            onChange={(e) => setForm((p) => ({ ...p, dimensions: e.target.value }))}
          />
        </div>
      </div>

      {/* Theme */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--text-3)] mb-2">
          Theme
        </label>
        <div className="flex flex-wrap gap-2">
          {THEMES.map((t) => (
            <button
              key={t.value}
              onClick={() => setForm((p) => ({ ...p, theme: t.value }))}
              style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500,
                cursor: "pointer", transition: "all 0.15s",
                border: form.theme === t.value ? "1px solid rgba(139,92,246,0.5)" : "1px solid var(--border)",
                background: form.theme === t.value ? "rgba(139,92,246,0.1)" : "var(--bg-surface)",
                color: form.theme === t.value ? "#a78bfa" : "var(--text-2)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Features */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--text-3)] mb-2">
          Features <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>({form.features.length} selected)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {FEATURE_OPTIONS.map((f) => {
            const on = form.features.includes(f);
            return (
              <button
                key={f}
                onClick={() => toggleFeature(f)}
                style={{
                  padding: "5px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                  transition: "all 0.12s",
                  border: on ? "1px solid rgba(139,92,246,0.4)" : "1px solid var(--border)",
                  background: on ? "rgba(139,92,246,0.1)" : "var(--bg-surface)",
                  color: on ? "#a78bfa" : "var(--text-2)",
                }}
              >
                {on ? "✓ " : ""}{f}
              </button>
            );
          })}
        </div>
      </div>

      {/* Budget (optional) */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--text-3)] mb-2">
          Budget <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional — influences material quality)</span>
        </label>
        <input
          className="input w-full"
          placeholder="e.g. ₹5 Lakh, $10,000 USD, Premium"
          value={form.budget}
          onChange={(e) => setForm((p) => ({ ...p, budget: e.target.value }))}
        />
      </div>

      {/* Generate */}
      <button
        onClick={handleGenerate}
        disabled={prefilling || !form.brandName.trim() || !form.dimensions.trim() || form.features.length === 0}
        style={{
          width: "100%", padding: "14px", borderRadius: 12, fontSize: 15, fontWeight: 700,
          cursor: (prefilling || !form.brandName.trim() || !form.dimensions.trim() || form.features.length === 0) ? "not-allowed" : "pointer",
          opacity: (prefilling || !form.brandName.trim() || !form.dimensions.trim() || form.features.length === 0) ? 0.5 : 1,
          background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
          border: "none", color: "#fff", transition: "opacity 0.15s",
          letterSpacing: "0.01em",
        }}
      >
        {prefilling ? "Loading proposal…" : "Generate 3D Visual →"}
      </button>

      <p style={{ fontSize: 11, color: "var(--text-3)", textAlign: "center" }}>
        Each generation uses 1 AI credit · Takes 15–30 seconds · 1536×1024 resolution
      </p>
    </div>
  );
}

// ── Page (Suspense wrapper required for useSearchParams) ──────────────────────

export default function EventVisualPage() {
  return (
    <Suspense fallback={null}>
      <EventVisualPageInner />
    </Suspense>
  );
}
