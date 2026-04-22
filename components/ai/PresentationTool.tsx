"use client";

import { useState } from "react";
import type { PresentationInput, PresentationOutput, PresentationSlide, SlideType } from "@/lib/ai-tools";

const SLIDE_TYPES: SlideType[] = ["TITLE", "AGENDA", "CONTENT", "DATA", "QUOTE", "CLOSING"];
const SLIDE_TYPE_CONFIG: Record<SlideType, { label: string; color: string; bg: string }> = {
  TITLE:   { label: "Title",   color: "text-indigo-400",  bg: "bg-indigo-500/15 border-indigo-500/20"  },
  AGENDA:  { label: "Agenda",  color: "text-purple-400",  bg: "bg-purple-500/15 border-purple-500/20"  },
  CONTENT: { label: "Content", color: "text-[var(--text-2)]", bg: "bg-[var(--bg-surface)] border-[var(--border)]" },
  DATA:    { label: "Data",    color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/20"},
  QUOTE:   { label: "Quote",   color: "text-amber-400",   bg: "bg-amber-500/15 border-amber-500/20"   },
  CLOSING: { label: "Closing", color: "text-rose-400",    bg: "bg-rose-500/15 border-rose-500/20"     },
};

const TONES = ["Professional", "Inspiring", "Persuasive", "Informative", "Bold"];

// ── Form ───────────────────────────────────────────────────────────────────────

type FormProps = { onGenerate: (input: PresentationInput) => void };

export function PresentationForm({ onGenerate }: FormProps) {
  const [form, setForm] = useState<PresentationInput>({
    topic: "", eventType: "", audience: "", slideCount: 10, tone: "Professional", requirements: "",
  });

  function set<K extends keyof PresentationInput>(k: K, v: PresentationInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const valid = form.topic && form.audience;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4">
        <p className="text-[var(--text-1)] text-sm font-semibold">Presentation Details</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-[var(--text-3)] text-xs mb-1 block">Presentation Topic *</label>
            <input value={form.topic} onChange={(e) => set("topic", e.target.value)} placeholder="e.g. Celestial Gala Night 2025 — Event Proposal"
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-indigo-500/60" />
          </div>
          <div>
            <label className="text-[var(--text-3)] text-xs mb-1 block">Event / Context Type</label>
            <input value={form.eventType} onChange={(e) => set("eventType", e.target.value)} placeholder="e.g. Corporate Gala"
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-indigo-500/60" />
          </div>
          <div>
            <label className="text-[var(--text-3)] text-xs mb-1 block">Audience *</label>
            <input value={form.audience} onChange={(e) => set("audience", e.target.value)} placeholder="e.g. Board of Directors, CMO"
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-indigo-500/60" />
          </div>
          <div>
            <label className="text-[var(--text-3)] text-xs mb-1 block">Number of Slides: {form.slideCount}</label>
            <input type="range" min={5} max={20} step={1} value={form.slideCount} onChange={(e) => set("slideCount", Number(e.target.value))}
              className="w-full accent-indigo-500" />
            <div className="flex justify-between text-[var(--text-3)] text-[11px]"><span>5</span><span>20</span></div>
          </div>
          <div>
            <label className="text-[var(--text-3)] text-xs mb-1 block">Tone</label>
            <div className="flex flex-wrap gap-1.5">
              {TONES.map((t) => (
                <button key={t} type="button" onClick={() => set("tone", t)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${form.tone === t ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400" : "border-[var(--border)] text-[var(--text-2)] hover:border-indigo-500/30"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <label className="text-[var(--text-3)] text-xs mb-1 block">Additional Requirements</label>
          <textarea value={form.requirements} onChange={(e) => set("requirements", e.target.value)} rows={2}
            placeholder="e.g. Include ROI slide, testimonial section, budget breakdown..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-indigo-500/60 resize-none" />
        </div>
      </div>

      <button onClick={() => onGenerate(form)} disabled={!valid}
        className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors">
        Generate Presentation with AI
      </button>
    </div>
  );
}

// ── Output ─────────────────────────────────────────────────────────────────────

type OutputProps = { output: PresentationOutput; onChange: (o: PresentationOutput) => void };

export function PresentationOutput({ output, onChange }: OutputProps) {
  const [selectedSlide, setSelectedSlide] = useState(0);
  const slide = output.slides[selectedSlide];

  function updateSlide(i: number, field: keyof PresentationSlide, value: PresentationSlide[keyof PresentationSlide]) {
    const next = [...output.slides];
    (next[i] as any)[field] = value;
    onChange({ ...output, slides: next.map((s, j) => ({ ...s, slideNumber: j + 1 })) });
  }

  function addBullet(slideIdx: number) {
    const s = output.slides[slideIdx];
    updateSlide(slideIdx, "bulletPoints", [...s.bulletPoints, "New point"]);
  }

  function updateBullet(slideIdx: number, bIdx: number, value: string) {
    const bullets = [...output.slides[slideIdx].bulletPoints];
    bullets[bIdx] = value;
    updateSlide(slideIdx, "bulletPoints", bullets);
  }

  function removeBullet(slideIdx: number, bIdx: number) {
    updateSlide(slideIdx, "bulletPoints", output.slides[slideIdx].bulletPoints.filter((_, i) => i !== bIdx));
  }

  function addSlide() {
    const id = `ps_${Math.random().toString(36).slice(2, 8)}`;
    const newSlides = [...output.slides, { id, slideNumber: output.slides.length + 1, type: "CONTENT" as SlideType, title: "New Slide", bulletPoints: ["Bullet point 1"], speakerNotes: "" }];
    onChange({ ...output, slides: newSlides.map((s, i) => ({ ...s, slideNumber: i + 1 })) });
    setSelectedSlide(newSlides.length - 1);
  }

  function deleteSlide(i: number) {
    const next = output.slides.filter((_, j) => j !== i).map((s, j) => ({ ...s, slideNumber: j + 1 }));
    onChange({ ...output, slides: next });
    setSelectedSlide(Math.min(selectedSlide, next.length - 1));
  }

  if (!slide) return null;
  const tc = SLIDE_TYPE_CONFIG[slide.type];

  return (
    <div className="space-y-5">
      {/* Deck meta */}
      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-5 py-4">
        <input value={output.title} onChange={(e) => onChange({ ...output, title: e.target.value })}
          className="text-[var(--text-1)] font-bold text-base bg-transparent border-b border-transparent hover:border-[var(--border)] focus:border-indigo-500/50 outline-none w-full" />
        <input value={output.subtitle} onChange={(e) => onChange({ ...output, subtitle: e.target.value })}
          className="text-[var(--text-3)] text-xs mt-1 bg-transparent border-b border-transparent hover:border-[var(--border)] focus:border-indigo-500/50 outline-none w-full" />
      </div>

      <div className="flex gap-4">
        {/* Slide list */}
        <div className="w-48 shrink-0 space-y-1 max-h-[540px] overflow-y-auto">
          {output.slides.map((s, i) => {
            const stc = SLIDE_TYPE_CONFIG[s.type];
            return (
              <button key={s.id} onClick={() => setSelectedSlide(i)}
                className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors group relative ${i === selectedSlide ? "bg-indigo-500/15 border-indigo-500/40" : "border-[var(--border)] hover:bg-[var(--bg-hover)]"}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold w-4 shrink-0 ${i === selectedSlide ? "text-indigo-400" : "text-[var(--text-3)]"}`}>{s.slideNumber}</span>
                  <span className={`text-[11px] px-1.5 py-0.5 rounded border ${stc.bg} ${stc.color} font-medium shrink-0`}>{stc.label}</span>
                </div>
                <p className={`text-xs mt-1 truncate ${i === selectedSlide ? "text-[var(--text-1)]" : "text-[var(--text-2)]"}`}>{s.title}</p>
                <button onClick={(e) => { e.stopPropagation(); deleteSlide(i); }}
                  className="absolute right-2 top-2 text-[var(--text-3)] hover:text-red-400 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
              </button>
            );
          })}
          <button onClick={addSlide} className="w-full text-xs text-indigo-400 hover:text-indigo-300 py-2 text-center border border-dashed border-indigo-500/20 rounded-lg transition-colors hover:border-indigo-500/40">
            + Add slide
          </button>
        </div>

        {/* Slide editor */}
        <div className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-3)] text-sm font-medium">Slide {slide.slideNumber}</span>
              <select value={slide.type} onChange={(e) => updateSlide(selectedSlide, "type", e.target.value as SlideType)}
                className={`text-xs font-medium px-2 py-1 rounded-lg border cursor-pointer outline-none bg-transparent ${tc.bg} ${tc.color}`}>
                {SLIDE_TYPES.map((t) => <option key={t} value={t} className="bg-[#1c2029] text-[var(--text-1)]">{SLIDE_TYPE_CONFIG[t].label}</option>)}
              </select>
            </div>
          </div>

          <input value={slide.title} onChange={(e) => updateSlide(selectedSlide, "title", e.target.value)}
            className="text-[var(--text-1)] font-bold text-lg bg-transparent border-b-2 border-transparent hover:border-[var(--border)] focus:border-indigo-500/60 outline-none w-full pb-1" />

          <div>
            <p className="text-[var(--text-3)] text-[11px] uppercase tracking-wide font-medium mb-2">Content</p>
            <div className="space-y-1.5">
              {slide.bulletPoints.map((b, bi) => (
                <div key={bi} className="flex items-start gap-2 group/b">
                  <span className="text-indigo-400 text-xs mt-1 shrink-0">▸</span>
                  <input value={b} onChange={(e) => updateBullet(selectedSlide, bi, e.target.value)}
                    className="flex-1 text-[var(--text-1)] text-sm bg-transparent border-b border-transparent hover:border-[var(--border)] focus:border-indigo-500/50 outline-none" />
                  <button onClick={() => removeBullet(selectedSlide, bi)}
                    className="text-[var(--text-3)] hover:text-red-400 text-xs opacity-0 group-hover/b:opacity-100 transition-opacity">✕</button>
                </div>
              ))}
            </div>
            <button onClick={() => addBullet(selectedSlide)} className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">+ Add point</button>
          </div>

          <div>
            <p className="text-[var(--text-3)] text-[11px] uppercase tracking-wide font-medium mb-1.5">Speaker Notes</p>
            <textarea value={slide.speakerNotes} onChange={(e) => updateSlide(selectedSlide, "speakerNotes", e.target.value)}
              rows={3} placeholder="Notes for the presenter..."
              className="w-full bg-[var(--bg-surface)] border border-[var(--border)] focus:border-indigo-500/40 rounded-lg px-3 py-2 text-xs text-[var(--text-2)] outline-none resize-none placeholder:text-[var(--text-3)]" />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
        <p className="text-[var(--text-3)] text-xs uppercase tracking-wide font-medium">Presentation Tips</p>
        {output.notes.map((n, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-indigo-400 text-xs mt-0.5">→</span>
            <p className="text-[var(--text-2)] text-xs">{n}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
