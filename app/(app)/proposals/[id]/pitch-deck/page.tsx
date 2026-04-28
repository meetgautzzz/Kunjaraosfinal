"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { ProposalData, PitchSlide, PitchDeck } from "@/lib/proposals";
import { useCredits } from "@/components/credits/useCredits";
import {
  PITCH_DECK_TONES,
  DEFAULT_SLIDE_COUNT,
  MIN_SLIDE_COUNT,
  MAX_SLIDE_COUNT,
} from "@/lib/pitchDeckPrompt";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PitchDeckPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const credits = useCredits();

  const [proposal,    setProposal]    = useState<ProposalData | null>(null);
  const [deck,        setDeck]        = useState<PitchDeck | null>(null);
  const [slides,      setSlides]      = useState<PitchSlide[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [generating,  setGenerating]  = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [exporting,   setExporting]   = useState(false);
  const [error,       setError]       = useState("");
  const [saveMsg,     setSaveMsg]     = useState("");

  // Config form state
  const [tone,       setTone]       = useState<string>(PITCH_DECK_TONES[0]);
  const [slideCount, setSlideCount] = useState(DEFAULT_SLIDE_COUNT);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.proposals.get(id) as Promise<ProposalData>,
      api.proposals.pitchDeck.get(id) as Promise<{ pitchDeck: PitchDeck | null }>,
    ]).then(([p, d]) => {
      setProposal({ ...p, budget: Number(p.budget) });
      if (d.pitchDeck) {
        setDeck(d.pitchDeck);
        setSlides(d.pitchDeck.slides);
        setTone(d.pitchDeck.tone ?? PITCH_DECK_TONES[0]);
        setSlideCount(d.pitchDeck.slideCount ?? DEFAULT_SLIDE_COUNT);
      }
    }).catch((err) => setError(err.message ?? "Failed to load proposal"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleGenerate() {
    if (!id || generating) return;
    setError("");
    setGenerating(true);
    try {
      const res = await api.proposals.pitchDeck.generate(id, { tone, slideCount }) as any;
      const pd: PitchDeck = res.data?.pitchDeck ?? res.pitchDeck;
      setDeck(pd);
      setSlides(pd.slides);
      if (typeof res.credits_remaining === "number") credits.setRemaining(res.credits_remaining);
    } catch (err: any) {
      if (err.message?.includes("LIMIT_REACHED")) { credits.openBuyModal(); credits.refresh(); return; }
      setError(err.message ?? "Generation failed.");
    } finally {
      setGenerating(false);
      setShowConfig(false);
    }
  }

  async function handleSave() {
    if (!id || saving || slides.length === 0) return;
    setSaving(true);
    setSaveMsg("");
    try {
      await api.proposals.pitchDeck.save(id, { slides, tone, slideCount: slides.length });
      setSaveMsg("Saved");
      setTimeout(() => setSaveMsg(""), 2000);
    } catch (err: any) {
      setError(err.message ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    if (!id || exporting || slides.length === 0) return;
    setExporting(true);
    setError("");
    try {
      const supabase = (await import("@/lib/supabase/client")).createClient();
      let token = "";
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        token = data.session?.access_token ?? "";
      }

      const res = await fetch(`/api/proposals/${id}/pitch-deck/export`, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          slides,
          proposalTitle: proposal?.title,
          clientName:    proposal?.client?.companyName ?? proposal?.client?.name,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Export failed (${res.status})`);
      }

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      const title = (proposal?.title ?? "pitch-deck").replace(/[^a-z0-9 _-]/gi, "").trim();
      a.href     = url;
      a.download = `${title.replace(/\s+/g, "-").toLowerCase()}-pitch-deck.pptx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message ?? "Export failed.");
    } finally {
      setExporting(false);
    }
  }

  function updateSlide(index: number, patch: Partial<PitchSlide>) {
    setSlides((prev) => prev.map((s, i) => i === index ? { ...s, ...patch } : s));
  }

  function updateBullet(slideIdx: number, bulletIdx: number, value: string) {
    setSlides((prev) => prev.map((s, i) => {
      if (i !== slideIdx) return s;
      const bullets = s.bullets.map((b, bi) => bi === bulletIdx ? value : b);
      return { ...s, bullets };
    }));
  }

  function addBullet(slideIdx: number) {
    setSlides((prev) => prev.map((s, i) =>
      i === slideIdx ? { ...s, bullets: [...s.bullets, ""] } : s
    ));
  }

  function removeBullet(slideIdx: number, bulletIdx: number) {
    setSlides((prev) => prev.map((s, i) => {
      if (i !== slideIdx || s.bullets.length <= 1) return s;
      return { ...s, bullets: s.bullets.filter((_, bi) => bi !== bulletIdx) };
    }));
  }

  function moveSlide(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= slides.length) return;
    setSlides((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function removeSlide(index: number) {
    if (slides.length <= 1) return;
    setSlides((prev) => prev.filter((_, i) => i !== index));
  }

  function addSlide() {
    setSlides((prev) => [
      ...prev,
      { title: "New Slide", bullets: ["Add your key point here"], speaker_notes: "" },
    ]);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center animate-pulse" style={{ minHeight: "50vh" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(99,102,241,0.2)" }} />
      </div>
    );
  }

  if (error && !proposal) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: "50vh", gap: 16 }}>
        <p style={{ color: "#f87171" }}>{error}</p>
        <button onClick={() => router.back()} className="btn-ghost">← Back</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", paddingBottom: 64 }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        style={{ marginBottom: 28, paddingBottom: 20, borderBottom: "1px solid var(--border)" }}
      >
        <div>
          <button onClick={() => router.back()} className="btn-ghost" style={{ marginBottom: 10, fontSize: 13 }}>
            ← Back to proposal
          </button>
          <h2 className="t-heading">Pitch Deck</h2>
          {proposal && (
            <p className="t-body" style={{ marginTop: 4 }}>
              {proposal.title} · {slides.length} slides
              {deck && <span style={{ color: "var(--text-3)", marginLeft: 8 }}>v{deck.version}</span>}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {slides.length > 0 && (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-ghost"
              >
                {saving ? "Saving…" : saveMsg || "Save edits"}
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "9px 18px",
                  borderRadius: 10,
                  border: "1px solid rgba(99,102,241,0.35)",
                  background: "rgba(99,102,241,0.1)",
                  color: "#a5b4fc",
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: exporting ? "not-allowed" : "pointer",
                  opacity: exporting ? 0.6 : 1,
                }}
              >
                {exporting ? "Exporting…" : "⬇ Download .pptx"}
              </button>
            </>
          )}
          <button
            onClick={() => setShowConfig((v) => !v)}
            className="btn-primary"
            style={{ padding: "9px 18px", fontSize: 13.5 }}
          >
            {slides.length > 0 ? "↺ Regenerate" : "✦ Generate Deck"}
          </button>
        </div>
      </div>

      {/* ── Error banner ──────────────────────────────────────────────────── */}
      {error && (
        <div
          style={{
            marginBottom: 20,
            padding: "11px 16px",
            borderRadius: 10,
            background: "var(--red-dim)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#fca5a5",
            fontSize: 13,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{error}</span>
          <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "rgba(252,165,165,0.5)", cursor: "pointer" }}>✕</button>
        </div>
      )}

      {/* ── Config / Generate panel ────────────────────────────────────────── */}
      {(showConfig || slides.length === 0) && (
        <div
          style={{
            marginBottom: 28,
            padding: "24px 28px",
            borderRadius: 14,
            border: "1px solid rgba(99,102,241,0.2)",
            background: "rgba(99,102,241,0.04)",
          }}
        >
          <p className="field-label" style={{ marginBottom: 16 }}>Configure your pitch deck</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div>
              <label className="field-label">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="input"
              >
                {PITCH_DECK_TONES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Number of slides ({MIN_SLIDE_COUNT}–{MAX_SLIDE_COUNT})</label>
              <input
                type="number"
                value={slideCount}
                onChange={(e) => setSlideCount(Math.min(MAX_SLIDE_COUNT, Math.max(MIN_SLIDE_COUNT, Number(e.target.value))))}
                min={MIN_SLIDE_COUNT}
                max={MAX_SLIDE_COUNT}
                className="input"
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="btn-primary"
              style={{ padding: "10px 22px" }}
            >
              {generating ? (
                <>
                  <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Generating slides…
                </>
              ) : (
                <>✦ {slides.length > 0 ? "Regenerate" : "Generate"} {slideCount} Slides</>
              )}
            </button>
            {slides.length > 0 && (
              <button onClick={() => setShowConfig(false)} className="btn-ghost">Cancel</button>
            )}
          </div>
          <p className="t-caption" style={{ marginTop: 10 }}>
            Costs 1 credit · Takes ~30 seconds · Uses only this proposal's content
          </p>
        </div>
      )}

      {/* ── Empty state ────────────────────────────────────────────────────── */}
      {slides.length === 0 && !generating && !showConfig && (
        <div
          className="flex flex-col items-center justify-center"
          style={{ minHeight: "40vh", gap: 16, opacity: 0.8 }}
        >
          <div style={{ fontSize: 40 }}>🎯</div>
          <p className="t-heading" style={{ fontSize: 20 }}>No deck yet</p>
          <p className="t-body text-center" style={{ maxWidth: 360 }}>
            Generate a pitch deck from this proposal to get a client-ready
            presentation you can edit and export as PowerPoint.
          </p>
          <button onClick={() => setShowConfig(true)} className="btn-primary" style={{ padding: "10px 22px" }}>
            ✦ Create Pitch Deck
          </button>
        </div>
      )}

      {/* ── Slide editor ──────────────────────────────────────────────────── */}
      {slides.length > 0 && (
        <>
          {/* Isolation notice */}
          <div
            style={{
              marginBottom: 20,
              padding: "9px 14px",
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
            Uses ONLY content from this proposal. Click any field to edit before exporting.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {slides.map((slide, idx) => (
              <SlideCard
                key={idx}
                slide={slide}
                index={idx}
                total={slides.length}
                onChange={(patch) => updateSlide(idx, patch)}
                onBulletChange={(bi, val) => updateBullet(idx, bi, val)}
                onAddBullet={() => addBullet(idx)}
                onRemoveBullet={(bi) => removeBullet(idx, bi)}
                onMoveUp={() => moveSlide(idx, -1)}
                onMoveDown={() => moveSlide(idx, 1)}
                onRemove={() => removeSlide(idx)}
              />
            ))}
          </div>

          {/* Add slide + global actions */}
          <div className="flex items-center justify-between flex-wrap gap-3" style={{ marginTop: 20 }}>
            <button
              onClick={addSlide}
              disabled={slides.length >= MAX_SLIDE_COUNT}
              className="btn-ghost"
              style={{ fontSize: 13 }}
            >
              + Add slide
            </button>
            <div className="flex items-center gap-2">
              <button onClick={handleSave} disabled={saving} className="btn-ghost">
                {saving ? "Saving…" : saveMsg || "Save"}
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "9px 20px",
                  borderRadius: 10,
                  border: "1px solid rgba(99,102,241,0.35)",
                  background: "rgba(99,102,241,0.1)",
                  color: "#a5b4fc",
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: exporting ? "not-allowed" : "pointer",
                  opacity: exporting ? 0.6 : 1,
                }}
              >
                {exporting ? "Exporting…" : "⬇ Download .pptx"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── SlideCard ─────────────────────────────────────────────────────────────────

function SlideCard({
  slide, index, total, onChange, onBulletChange, onAddBullet,
  onRemoveBullet, onMoveUp, onMoveDown, onRemove,
}: {
  slide:           PitchSlide;
  index:           number;
  total:           number;
  onChange:        (p: Partial<PitchSlide>) => void;
  onBulletChange:  (bi: number, val: string) => void;
  onAddBullet:     () => void;
  onRemoveBullet:  (bi: number) => void;
  onMoveUp:        () => void;
  onMoveDown:      () => void;
  onRemove:        () => void;
}) {
  const [notesOpen, setNotesOpen] = useState(false);

  return (
    <div
      style={{
        borderRadius: 14,
        border: "1px solid var(--border)",
        background: "var(--bg-card)",
        overflow: "hidden",
      }}
    >
      {/* Slide header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-surface)",
        }}
      >
        <span
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: "rgba(99,102,241,0.15)",
            border: "1px solid rgba(99,102,241,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
            color: "#a5b4fc",
            flexShrink: 0,
          }}
        >
          {index + 1}
        </span>

        <input
          value={slide.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Slide title"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            fontSize: 15,
            fontWeight: 600,
            color: "var(--text-1)",
          }}
        />

        <div className="flex items-center gap-1" style={{ flexShrink: 0 }}>
          <IconBtn onClick={onMoveUp} disabled={index === 0} title="Move up">↑</IconBtn>
          <IconBtn onClick={onMoveDown} disabled={index === total - 1} title="Move down">↓</IconBtn>
          <button
            onClick={() => setNotesOpen((v) => !v)}
            title="Speaker notes"
            style={{
              padding: "4px 8px",
              borderRadius: 6,
              border: notesOpen ? "1px solid rgba(99,102,241,0.35)" : "1px solid var(--border)",
              background: notesOpen ? "rgba(99,102,241,0.08)" : "transparent",
              color: notesOpen ? "#a5b4fc" : "var(--text-3)",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Notes
          </button>
          <IconBtn onClick={onRemove} disabled={total <= 1} title="Remove slide" danger>✕</IconBtn>
        </div>
      </div>

      {/* Bullets */}
      <div style={{ padding: "14px 16px 0" }}>
        <p className="t-caption" style={{ marginBottom: 8 }}>Bullet points</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {slide.bullets.map((bullet, bi) => (
            <div key={bi} className="flex items-center gap-2">
              <span style={{ color: "#a5b4fc", fontSize: 13, flexShrink: 0 }}>▸</span>
              <input
                value={bullet}
                onChange={(e) => onBulletChange(bi, e.target.value)}
                placeholder={`Bullet ${bi + 1}`}
                style={{
                  flex: 1,
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 7,
                  padding: "7px 10px",
                  fontSize: 13.5,
                  color: "var(--text-1)",
                  outline: "none",
                }}
                maxLength={300}
              />
              <IconBtn onClick={() => onRemoveBullet(bi)} disabled={slide.bullets.length <= 1} title="Remove bullet" danger>−</IconBtn>
            </div>
          ))}
        </div>
        {slide.bullets.length < 10 && (
          <button
            onClick={onAddBullet}
            className="t-caption"
            style={{
              marginTop: 8,
              color: "#a5b4fc",
              background: "none",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            + Add bullet
          </button>
        )}
      </div>

      {/* Speaker notes (collapsible) */}
      {notesOpen && (
        <div style={{ padding: "12px 16px 0" }}>
          <p className="t-caption" style={{ marginBottom: 6 }}>Speaker notes</p>
          <textarea
            value={slide.speaker_notes}
            onChange={(e) => onChange({ speaker_notes: e.target.value })}
            placeholder="What you'll say on this slide — conversational, confident, client-focused…"
            rows={4}
            maxLength={3000}
            style={{
              width: "100%",
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "9px 12px",
              fontSize: 13,
              color: "var(--text-1)",
              resize: "vertical",
              lineHeight: 1.6,
              outline: "none",
            }}
          />
        </div>
      )}

      {/* Image prompt (if AI provided one) */}
      {slide.image_prompt && (
        <div style={{ padding: "10px 16px 0" }}>
          <p className="t-caption" style={{ marginBottom: 4 }}>Visual prompt (for future image generation)</p>
          <p style={{ fontSize: 12, color: "var(--text-3)", fontStyle: "italic", lineHeight: 1.5 }}>
            {slide.image_prompt}
          </p>
        </div>
      )}

      <div style={{ height: 14 }} />
    </div>
  );
}

function IconBtn({
  onClick, disabled, title, danger, children,
}: {
  onClick:   () => void;
  disabled?: boolean;
  title?:    string;
  danger?:   boolean;
  children:  React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        width: 26,
        height: 26,
        borderRadius: 6,
        border: "1px solid var(--border)",
        background: "transparent",
        color: danger ? (disabled ? "var(--text-3)" : "#f87171") : "var(--text-2)",
        fontSize: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}
