"use client";

import { useState } from "react";
import type { EventRoom, TimelinePhase } from "@/lib/room";

type Props = { room: EventRoom; readOnly?: boolean; onChange?: (phases: TimelinePhase[]) => void };

export default function RoomTimeline({ room, readOnly, onChange }: Props) {
  const [phases, setPhases] = useState<TimelinePhase[]>(room.timelineData ?? []);
  const [saved,  setSaved]  = useState(false);

  if (!phases.length) return (
    <Empty readOnly={readOnly} onAdd={() => {
      const next = [...phases, { phase: "New Phase", daysOut: "TBD", tasks: ["Task 1"], milestone: false }];
      setPhases(next); onChange?.(next);
    }} />
  );

  function update(i: number, patch: Partial<TimelinePhase>) {
    const next = phases.map((p, idx) => idx === i ? { ...p, ...patch } : p);
    setPhases(next); onChange?.(next);
  }

  function updateTask(pi: number, ti: number, val: string) {
    const next = phases.map((p, idx) => {
      if (idx !== pi) return p;
      const tasks = p.tasks.map((t, j) => j === ti ? val : t);
      return { ...p, tasks };
    });
    setPhases(next); onChange?.(next);
  }

  function addTask(pi: number) {
    const next = phases.map((p, idx) => idx === pi ? { ...p, tasks: [...p.tasks, "New task"] } : p);
    setPhases(next); onChange?.(next);
  }

  function removeTask(pi: number, ti: number) {
    const next = phases.map((p, idx) => idx === pi ? { ...p, tasks: p.tasks.filter((_, j) => j !== ti) } : p);
    setPhases(next); onChange?.(next);
  }

  function addPhase() {
    const next = [...phases, { phase: "New Phase", daysOut: "TBD", tasks: ["Task 1"], milestone: false }];
    setPhases(next); onChange?.(next);
  }

  function removePhase(i: number) {
    const next = phases.filter((_, idx) => idx !== i);
    setPhases(next); onChange?.(next);
  }

  function handleSave() {
    setSaved(true); setTimeout(() => setSaved(false), 2000);
    onChange?.(phases);
  }

  return (
    <div className="space-y-2">
      {!readOnly && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-[var(--text-3)] text-xs">{phases.length} phases · Click any field to edit</p>
          <button onClick={handleSave}
            className="px-3 py-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/25 text-xs font-medium transition-colors">
            {saved ? "✓ Saved" : "Save Timeline"}
          </button>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-5 top-5 bottom-5 w-px bg-[var(--border)]" />
        <div className="space-y-0">
          {phases.map((phase, i) => (
            <div key={i} className="relative flex gap-4 pb-8 last:pb-0 group">
              {/* Node */}
              <div className={`relative z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 ${
                phase.milestone
                  ? "bg-indigo-500 border-indigo-500 text-white"
                  : "bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-3)]"
              }`}>
                <span className="text-xs font-bold">{i + 1}</span>
              </div>

              {/* Content */}
              <div className="flex-1 pt-1.5 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {readOnly ? (
                    <span className="text-[var(--text-1)] font-semibold text-sm">{phase.phase}</span>
                  ) : (
                    <input value={phase.phase} onChange={(e) => update(i, { phase: e.target.value })}
                      className="text-[var(--text-1)] font-semibold text-sm bg-transparent border-b border-transparent hover:border-[var(--border)] focus:border-indigo-500/60 outline-none transition-colors" />
                  )}
                  {readOnly ? (
                    <span className="text-indigo-400 text-xs border border-indigo-500/30 px-2 py-0.5 rounded-full bg-indigo-500/10">{phase.daysOut}</span>
                  ) : (
                    <input value={phase.daysOut} onChange={(e) => update(i, { daysOut: e.target.value })}
                      className="text-indigo-400 text-xs border border-indigo-500/30 px-2 py-0.5 rounded-full bg-indigo-500/10 outline-none hover:border-indigo-500/60 focus:border-indigo-500 transition-colors" />
                  )}
                  {!readOnly && (
                    <label className="flex items-center gap-1 text-[var(--text-3)] text-xs ml-auto cursor-pointer select-none">
                      <input type="checkbox" checked={phase.milestone} onChange={(e) => update(i, { milestone: e.target.checked })} className="accent-indigo-500" />
                      Milestone
                    </label>
                  )}
                  {!readOnly && (
                    <button onClick={() => removePhase(i)}
                      className="text-[var(--text-3)] hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-all ml-1">✕</button>
                  )}
                </div>

                {/* Tasks */}
                <ul className="space-y-1">
                  {phase.tasks.map((task, j) => (
                    <li key={j} className="flex items-start gap-2 group/task">
                      <span className="text-[var(--text-3)] text-xs mt-1 shrink-0">▸</span>
                      {readOnly ? (
                        <span className="text-[var(--text-2)] text-sm">{task}</span>
                      ) : (
                        <>
                          <input value={task} onChange={(e) => updateTask(i, j, e.target.value)}
                            className="flex-1 text-[var(--text-2)] text-sm bg-transparent border-b border-transparent hover:border-[var(--border)] focus:border-indigo-500/40 outline-none transition-colors" />
                          <button onClick={() => removeTask(i, j)}
                            className="text-[var(--text-3)] hover:text-red-400 text-xs opacity-0 group-hover/task:opacity-100 transition-all">✕</button>
                        </>
                      )}
                    </li>
                  ))}
                </ul>

                {!readOnly && (
                  <button onClick={() => addTask(i)}
                    className="mt-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                    + Add task
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {!readOnly && (
        <button onClick={addPhase}
          className="w-full mt-2 py-2.5 rounded-lg border border-dashed border-[var(--border)] text-[var(--text-3)] hover:border-indigo-500/40 hover:text-indigo-400 text-xs transition-colors">
          + Add Phase
        </button>
      )}
    </div>
  );
}

function Empty({ readOnly, onAdd }: { readOnly?: boolean; onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center text-xl mb-3">⏱</div>
      <p className="text-[var(--text-3)] text-sm mb-3">No timeline added yet.</p>
      {!readOnly && (
        <button onClick={onAdd}
          className="px-4 py-2 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-xs font-medium hover:bg-indigo-500/25 transition-colors">
          + Add First Phase
        </button>
      )}
    </div>
  );
}
