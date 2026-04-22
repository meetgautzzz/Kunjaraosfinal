"use client";

import { useState } from "react";
import type { SocialInput, SocialOutput, SocialCaption, SocialPlatform, SocialTone, CaptionType } from "@/lib/ai-tools";

const PLATFORMS: SocialPlatform[] = ["Instagram", "LinkedIn", "Twitter/X", "Facebook", "WhatsApp"];
const TONES: SocialTone[] = ["Professional", "Celebratory", "Exciting", "Informative"];

const PLATFORM_COLORS: Record<SocialPlatform, string> = {
  "Instagram": "bg-pink-500/20 border-pink-500/40 text-pink-400",
  "LinkedIn":  "bg-blue-500/20 border-blue-500/40 text-blue-400",
  "Twitter/X": "bg-sky-500/20 border-sky-500/40 text-sky-400",
  "Facebook":  "bg-indigo-500/20 border-indigo-500/40 text-indigo-400",
  "WhatsApp":  "bg-emerald-500/20 border-emerald-500/40 text-emerald-400",
};

const CAPTION_TYPES: CaptionType[] = ["Announcement", "Countdown", "Behind the Scenes", "Recap"];

// ── Form ───────────────────────────────────────────────────────────────────────

type FormProps = { onGenerate: (input: SocialInput) => void };

export function SocialForm({ onGenerate }: FormProps) {
  const [form, setForm] = useState<SocialInput>({
    eventName: "", eventType: "", eventDate: "", location: "",
    platforms: ["Instagram", "LinkedIn"], tones: ["Professional"], keyDetails: "",
  });

  function set<K extends keyof SocialInput>(k: K, v: SocialInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function togglePlatform(p: SocialPlatform) {
    set("platforms", form.platforms.includes(p) ? form.platforms.filter((x) => x !== p) : [...form.platforms, p]);
  }

  function toggleTone(t: SocialTone) {
    set("tones", form.tones.includes(t) ? form.tones.filter((x) => x !== t) : [...form.tones, t]);
  }

  const valid = form.eventName && form.platforms.length > 0;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4">
        <p className="text-[var(--text-1)] text-sm font-semibold">Event Info</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[var(--text-3)] text-xs mb-1 block">Event Name *</label>
            <input value={form.eventName} onChange={(e) => set("eventName", e.target.value)} placeholder="e.g. Gala Night 2025"
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-pink-500/60" />
          </div>
          <div>
            <label className="text-[var(--text-3)] text-xs mb-1 block">Event Type</label>
            <input value={form.eventType} onChange={(e) => set("eventType", e.target.value)} placeholder="e.g. Corporate Gala"
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-pink-500/60" />
          </div>
          <div>
            <label className="text-[var(--text-3)] text-xs mb-1 block">Event Date</label>
            <input type="date" value={form.eventDate} onChange={(e) => set("eventDate", e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-1)] focus:outline-none focus:border-pink-500/60"
              style={{ colorScheme: "dark" }} />
          </div>
          <div>
            <label className="text-[var(--text-3)] text-xs mb-1 block">Location</label>
            <input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Grand Hyatt, Mumbai"
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-pink-500/60" />
          </div>
        </div>
        <div>
          <label className="text-[var(--text-3)] text-xs mb-1 block">Key Details / Highlights</label>
          <textarea value={form.keyDetails} onChange={(e) => set("keyDetails", e.target.value)} rows={2}
            placeholder="e.g. Live band, 5-star dinner, award ceremony, sustainability theme..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-pink-500/60 resize-none" />
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-3">
        <p className="text-[var(--text-1)] text-sm font-semibold">Platforms *</p>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <button key={p} type="button" onClick={() => togglePlatform(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${form.platforms.includes(p) ? PLATFORM_COLORS[p] : "border-[var(--border)] text-[var(--text-2)] hover:border-pink-500/30"}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-3">
        <p className="text-[var(--text-1)] text-sm font-semibold">Tone</p>
        <div className="flex flex-wrap gap-2">
          {TONES.map((t) => (
            <button key={t} type="button" onClick={() => toggleTone(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${form.tones.includes(t) ? "bg-pink-500/20 border-pink-500/40 text-pink-400" : "border-[var(--border)] text-[var(--text-2)] hover:border-pink-500/30"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => onGenerate(form)} disabled={!valid}
        className="w-full py-3 rounded-xl bg-pink-500 hover:bg-pink-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors">
        Generate Captions with AI
      </button>
    </div>
  );
}

// ── Output ─────────────────────────────────────────────────────────────────────

type OutputProps = { output: SocialOutput; onChange: (o: SocialOutput) => void };

export function SocialOutput({ output, onChange }: OutputProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [filterPlatform, setFilterPlatform] = useState<SocialPlatform | "ALL">("ALL");

  function updateCaption(id: string, field: keyof SocialCaption, value: SocialCaption[keyof SocialCaption]) {
    onChange({ ...output, captions: output.captions.map((c) => c.id === id ? { ...c, [field]: value } : c) });
  }

  function copyCaption(caption: SocialCaption) {
    const text = `${caption.caption}\n\n${caption.hashtags.join(" ")}`;
    navigator.clipboard.writeText(text);
    setCopied(caption.id);
    setTimeout(() => setCopied(null), 2000);
  }

  function addCaption() {
    const id = `sc_${Math.random().toString(36).slice(2, 8)}`;
    onChange({ ...output, captions: [...output.captions, { id, platform: "Instagram", type: "Announcement", caption: "", hashtags: [], charCount: 0 }] });
  }

  const platforms = Array.from(new Set(output.captions.map((c) => c.platform)));
  const filtered = filterPlatform === "ALL" ? output.captions : output.captions.filter((c) => c.platform === filterPlatform);

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilterPlatform("ALL")}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${filterPlatform === "ALL" ? "bg-pink-500/20 border-pink-500/40 text-pink-400" : "border-[var(--border)] text-[var(--text-3)] hover:text-[var(--text-2)]"}`}>
          All ({output.captions.length})
        </button>
        {platforms.map((p) => (
          <button key={p} onClick={() => setFilterPlatform(p)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${filterPlatform === p ? PLATFORM_COLORS[p] : "border-[var(--border)] text-[var(--text-3)] hover:text-[var(--text-2)]"}`}>
            {p}
          </button>
        ))}
      </div>

      {/* Caption cards */}
      {filtered.map((caption) => (
        <div key={caption.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden group">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-surface)]">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${PLATFORM_COLORS[caption.platform]}`}>{caption.platform}</span>
              <select value={caption.type} onChange={(e) => updateCaption(caption.id, "type", e.target.value as CaptionType)}
                className="text-xs text-[var(--text-3)] bg-transparent border-b border-transparent hover:border-[var(--border)] outline-none cursor-pointer">
                {CAPTION_TYPES.map((t) => <option key={t} value={t} className="bg-[#1c2029] text-[var(--text-1)]">{t}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-3)] text-[11px]">{caption.caption.length} chars</span>
              <button onClick={() => copyCaption(caption)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${copied === caption.id ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "border-[var(--border)] text-[var(--text-3)] hover:text-[var(--text-1)]"}`}>
                {copied === caption.id ? "✓ Copied" : "Copy"}
              </button>
              <button onClick={() => onChange({ ...output, captions: output.captions.filter((c) => c.id !== caption.id) })}
                className="text-[var(--text-3)] hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <textarea
              value={caption.caption}
              onChange={(e) => updateCaption(caption.id, "caption", e.target.value)}
              rows={5}
              className="w-full bg-transparent text-[var(--text-1)] text-sm leading-relaxed resize-none outline-none border border-transparent hover:border-[var(--border)] focus:border-pink-500/40 rounded-lg px-2 py-1.5 transition-colors"
            />

            <div>
              <p className="text-[var(--text-3)] text-[11px] uppercase tracking-wide font-medium mb-1.5">Hashtags</p>
              <div className="flex flex-wrap gap-1.5">
                {caption.hashtags.map((h, i) => (
                  <span key={i} className="flex items-center gap-1 text-[11px] text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-full">
                    <input value={h} onChange={(e) => {
                      const next = [...caption.hashtags]; next[i] = e.target.value;
                      updateCaption(caption.id, "hashtags", next);
                    }} className="bg-transparent text-pink-400 outline-none w-auto" style={{ width: `${Math.max(h.length, 4)}ch` }} />
                    <button onClick={() => updateCaption(caption.id, "hashtags", caption.hashtags.filter((_, j) => j !== i))}
                      className="text-pink-400/50 hover:text-red-400 text-[10px] leading-none">✕</button>
                  </span>
                ))}
                <button onClick={() => updateCaption(caption.id, "hashtags", [...caption.hashtags, "#newtag"])}
                  className="text-[11px] text-[var(--text-3)] hover:text-pink-400 border border-dashed border-[var(--border)] px-2 py-0.5 rounded-full transition-colors">+</button>
              </div>
            </div>
          </div>
        </div>
      ))}

      <button onClick={addCaption} className="text-xs text-pink-400 hover:text-pink-300 transition-colors">+ Add caption</button>

      {/* Notes */}
      <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
        <p className="text-[var(--text-3)] text-xs uppercase tracking-wide font-medium">Best Practice Notes</p>
        {output.notes.map((n, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-pink-400 text-xs mt-0.5">→</span>
            <p className="text-[var(--text-2)] text-xs">{n}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
