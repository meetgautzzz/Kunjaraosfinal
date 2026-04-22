"use client";

import { useState } from "react";
import type { RunOfShowInput, RunOfShowOutput, RosEntry, RosCategory } from "@/lib/ai-tools";

const EVENT_TYPES = ["Corporate Gala", "Conference", "Product Launch", "Wedding", "Concert", "Awards Night", "Team Retreat", "Exhibition"];

const CAT_CONFIG: Record<RosCategory, { label: string; color: string; dot: string }> = {
  SETUP:   { label: "Setup",   color: "text-[var(--text-3)]", dot: "bg-gray-500"    },
  GUEST:   { label: "Guest",   color: "text-indigo-400",      dot: "bg-indigo-500"  },
  PROGRAM: { label: "Program", color: "text-amber-400",       dot: "bg-amber-500"   },
  BREAK:   { label: "Break",   color: "text-cyan-400",        dot: "bg-cyan-500"    },
  CLOSE:   { label: "Close",   color: "text-purple-400",      dot: "bg-purple-500"  },
};

// ── Form ───────────────────────────────────────────────────────────────────────

type FormProps = { onGenerate: (input: RunOfShowInput) => void };

export function RunOfShowForm({ onGenerate }: FormProps) {
  const [form, setForm] = useState<RunOfShowInput>({
    eventType: "", eventName: "", eventDate: "", startTime: "18:00", endTime: "23:00",
    venue: "", guestCount: 0, requirements: "",
  });

  function set<K extends keyof RunOfShowInput>(k: K, v: RunOfShowInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const valid = form.eventType && form.startTime && form.venue;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-3">
        <p className="text-[var(--text-1)] text-sm font-semibold">Event Type</p>
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.map((t) => (
            <button key={t} type="button" onClick={() => set("eventType", t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${form.eventType === t ? "bg-amber-500/20 border-amber-500/40 text-amber-400" : "border-[var(--border)] text-[var(--text-2)] hover:border-amber-500/30"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4">
        <p className="text-[var(--text-1)] text-sm font-semibold">Event Details</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[var(--text-3)] text-xs mb-1 block">Event Name</label>
            <input value={form.eventName} onChange={(e) => set("eventName", e.target.value)} placeholder="e.g. Gala Night 2025"
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-amber-500/60" />
          </div>
          <div>
            <label className="text-[var(--text-3)] text-xs mb-1 block">Venue *</label>
            <input value={form.venue} onChange={(e) => set("venue", e.target.value)} placeholder="e.g. Grand Hyatt, Mumbai"
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-amber-500/60" />
          </div>
          <div>
            <label className="text-[var(--text-3)] text-xs mb-1 block">Event Date</label>
            <input type="date" value={form.eventDate} onChange={(e) => set("eventDate", e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-1)] focus:outline-none focus:border-amber-500/60"
              style={{ colorScheme: "dark" }} />
          </div>
          <div>
            <label className="text-[var(--text-3)] text-xs mb-1 block">Guests</label>
            <input type="number" value={form.guestCount || ""} onChange={(e) => set("guestCount", Number(e.target.value))} placeholder="e.g. 300"
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-amber-500/60" />
          </div>
          <div>
            <label className="text-[var(--text-3)] text-xs mb-1 block">Start Time *</label>
            <input type="time" value={form.startTime} onChange={(e) => set("startTime", e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-1)] focus:outline-none focus:border-amber-500/60"
              style={{ colorScheme: "dark" }} />
          </div>
          <div>
            <label className="text-[var(--text-3)] text-xs mb-1 block">End Time</label>
            <input type="time" value={form.endTime} onChange={(e) => set("endTime", e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-1)] focus:outline-none focus:border-amber-500/60"
              style={{ colorScheme: "dark" }} />
          </div>
        </div>
        <div>
          <label className="text-[var(--text-3)] text-xs mb-1 block">Special requirements</label>
          <textarea value={form.requirements} onChange={(e) => set("requirements", e.target.value)} rows={2}
            placeholder="e.g. Awards ceremony at 9pm, live band for 45 min, gourmet dinner..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-amber-500/60 resize-none" />
        </div>
      </div>

      <button onClick={() => onGenerate(form)} disabled={!valid}
        className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors">
        Generate Run-of-Show with AI
      </button>
    </div>
  );
}

// ── Output ─────────────────────────────────────────────────────────────────────

function rosId() { return `ros_${Math.random().toString(36).slice(2, 8)}`; }

type OutputProps = { output: RunOfShowOutput; onChange: (o: RunOfShowOutput) => void };

export function RunOfShowOutput({ output, onChange }: OutputProps) {
  function updateEntry(id: string, field: keyof RosEntry, value: RosEntry[keyof RosEntry]) {
    onChange({ ...output, entries: output.entries.map((e) => e.id === id ? { ...e, [field]: value } : e) });
  }
  function deleteEntry(id: string) {
    onChange({ ...output, entries: output.entries.filter((e) => e.id !== id) });
  }
  function addEntry() {
    const last = output.entries[output.entries.length - 1];
    const newTime = last ? addMins(last.time, last.duration) : "09:00";
    onChange({ ...output, entries: [...output.entries, { id: rosId(), time: newTime, duration: 15, item: "New item", owner: "", notes: "", category: "PROGRAM" as RosCategory }] });
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-4 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[150px]">
          <EditIn value={output.eventName} onChange={(v) => onChange({ ...output, eventName: v })} className="text-[var(--text-1)] font-bold text-base" placeholder="Event name..." />
        </div>
        <div className="flex gap-4 text-xs text-[var(--text-3)]">
          {output.date && <span>📅 {new Date(output.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>}
          <span>📍 {output.venue}</span>
          <span>🕐 {output.entries.length} cues</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {(Object.keys(CAT_CONFIG) as RosCategory[]).map((c) => (
          <div key={c} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${CAT_CONFIG[c].dot}`} />
            <span className="text-[var(--text-3)] text-xs">{CAT_CONFIG[c].label}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-[var(--bg-surface)] border-b border-[var(--border)] text-[11px] text-[var(--text-3)] uppercase tracking-wide font-medium">
          <div className="col-span-1">Time</div>
          <div className="col-span-1">Dur</div>
          <div className="col-span-4">Item</div>
          <div className="col-span-2">Owner</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2">Notes</div>
        </div>

        {output.entries.map((entry) => {
          const cc = CAT_CONFIG[entry.category];
          return (
            <div key={entry.id} className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-[var(--border)] last:border-0 items-start group hover:bg-[var(--bg-hover)] transition-colors">
              <div className="col-span-1">
                <input type="time" value={entry.time} onChange={(e) => updateEntry(entry.id, "time", e.target.value)}
                  className="text-[var(--text-1)] text-xs font-mono bg-transparent border-b border-transparent hover:border-[var(--border)] focus:border-amber-500/50 outline-none w-full"
                  style={{ colorScheme: "dark" }} />
              </div>
              <div className="col-span-1 flex items-center gap-1">
                <input type="number" value={entry.duration} onChange={(e) => updateEntry(entry.id, "duration", Number(e.target.value))}
                  className="text-xs text-[var(--text-3)] bg-transparent border-b border-transparent hover:border-[var(--border)] focus:border-amber-500/50 outline-none w-8 text-right" />
                <span className="text-[var(--text-3)] text-[10px]">m</span>
              </div>
              <div className="col-span-4">
                <EditIn value={entry.item} onChange={(v) => updateEntry(entry.id, "item", v)} className={`text-sm font-medium ${cc.color}`} />
              </div>
              <div className="col-span-2">
                <EditIn value={entry.owner} onChange={(v) => updateEntry(entry.id, "owner", v)} className="text-[var(--text-3)] text-xs" placeholder="Owner..." />
              </div>
              <div className="col-span-2">
                <select value={entry.category} onChange={(e) => updateEntry(entry.id, "category", e.target.value as RosCategory)}
                  className={`text-xs bg-transparent border-b border-transparent hover:border-[var(--border)] outline-none cursor-pointer ${cc.color}`}>
                  {(Object.keys(CAT_CONFIG) as RosCategory[]).map((c) => (
                    <option key={c} value={c} className="bg-[#1c2029] text-[var(--text-1)]">{CAT_CONFIG[c].label}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-1">
                <EditIn value={entry.notes} onChange={(v) => updateEntry(entry.id, "notes", v)} className="text-[var(--text-3)] text-xs" placeholder="Notes..." />
              </div>
              <button onClick={() => deleteEntry(entry.id)}
                className="col-span-1 text-[var(--text-3)] hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity text-right">✕</button>
            </div>
          );
        })}
      </div>
      <button onClick={addEntry} className="text-xs text-amber-400 hover:text-amber-300 transition-colors">+ Add cue</button>

      {/* Notes */}
      <div className="space-y-2">
        <p className="text-[var(--text-3)] text-xs uppercase tracking-wide font-medium">Production Notes</p>
        {output.notes.map((n, i) => (
          <div key={i} className="flex items-start gap-2 group">
            <span className="text-amber-400 text-xs mt-0.5">→</span>
            <EditIn value={n} onChange={(v) => { const next = [...output.notes]; next[i] = v; onChange({ ...output, notes: next }); }}
              className="text-[var(--text-2)] text-xs flex-1" />
            <button onClick={() => onChange({ ...output, notes: output.notes.filter((_, j) => j !== i) })}
              className="text-[var(--text-3)] hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
          </div>
        ))}
        <button onClick={() => onChange({ ...output, notes: [...output.notes, ""] })} className="text-xs text-amber-400 hover:text-amber-300 transition-colors">+ Add note</button>
      </div>
    </div>
  );
}

function addMins(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const total  = h * 60 + m + mins;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function EditIn({ value, onChange, className, placeholder }: { value: string; onChange: (v: string) => void; className?: string; placeholder?: string }) {
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className={`bg-transparent border-b border-transparent hover:border-[var(--border)] focus:border-amber-500/50 outline-none w-full transition-colors ${className}`} />
  );
}
