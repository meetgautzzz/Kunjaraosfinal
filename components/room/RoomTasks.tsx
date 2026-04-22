"use client";

import { useState } from "react";
import { TASK_STATUS_STYLES, PRIORITY_STYLES } from "@/lib/room";
import type { EventRoom, RoomTask } from "@/lib/room";

type Props = { room: EventRoom; readOnly?: boolean; onChange?: (tasks: RoomTask[]) => void };

const STATUS_CYCLE: Record<string, RoomTask["status"]> = {
  PENDING: "IN_PROGRESS", IN_PROGRESS: "DONE", DONE: "PENDING",
};
const STATUS_ICONS: Record<string, string> = {
  PENDING: "○", IN_PROGRESS: "◐", DONE: "●",
};

export default function RoomTasks({ room, readOnly, onChange }: Props) {
  const [tasks, setTasks] = useState<RoomTask[]>(room.tasks);
  const [saved, setSaved] = useState(false);
  const [filter, setFilter] = useState<string>("ALL");

  const done    = tasks.filter((t) => t.status === "DONE").length;
  const progress= tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;

  function updateTask(id: string, patch: Partial<RoomTask>) {
    const next = tasks.map((t) => t.id === id ? { ...t, ...patch } : t);
    setTasks(next); onChange?.(next);
  }

  function addTask() {
    const task: RoomTask = {
      id: crypto.randomUUID(), title: "", description: null, assignedTo: null,
      dueDate: null, status: "PENDING", priority: "MEDIUM", completedAt: null,
    };
    const next = [...tasks, task];
    setTasks(next); onChange?.(next);
  }

  function removeTask(id: string) {
    const next = tasks.filter((t) => t.id !== id);
    setTasks(next); onChange?.(next);
  }

  function handleSave() {
    setSaved(true); setTimeout(() => setSaved(false), 2000);
    onChange?.(tasks);
  }

  const filtered = filter === "ALL" ? tasks : tasks.filter((t) => t.status === filter);

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 flex items-center gap-4">
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-2)] font-medium">Task Progress</span>
            <span className="text-[var(--text-1)] font-bold">{done}/{tasks.length} done</span>
          </div>
          <div className="h-2 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }} />
          </div>
        </div>
        <span className={`text-2xl font-black tabular-nums ${progress === 100 ? "text-emerald-400" : "text-[var(--text-1)]"}`}>
          {progress}%
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1">
          {["ALL","PENDING","IN_PROGRESS","DONE"].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                filter === s
                  ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400"
                  : "border-[var(--border)] text-[var(--text-3)] hover:text-[var(--text-1)]"
              }`}>
              {s === "ALL" ? "All" : s === "IN_PROGRESS" ? "In Progress" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            <button onClick={addTask}
              className="px-3 py-1.5 rounded-lg border border-dashed border-[var(--border)] text-[var(--text-3)] hover:border-indigo-500/40 hover:text-indigo-400 text-xs transition-colors">
              + Add Task
            </button>
            <button onClick={handleSave}
              className="px-3 py-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-xs font-medium hover:bg-indigo-500/25 transition-colors">
              {saved ? "✓ Saved" : "Save"}
            </button>
          </div>
        )}
      </div>

      {/* Task list */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] divide-y divide-[var(--border)]">
        {filtered.length === 0 && (
          <div className="py-10 text-center text-[var(--text-3)] text-sm">
            {filter === "ALL" ? "No tasks yet." : `No ${filter.toLowerCase().replace("_", " ")} tasks.`}
          </div>
        )}
        {filtered.map((task) => (
          <TaskRow key={task.id} task={task} readOnly={readOnly}
            onChange={(patch) => updateTask(task.id, patch)}
            onRemove={() => removeTask(task.id)}
            onCycleStatus={() => updateTask(task.id, { status: STATUS_CYCLE[task.status] })}
          />
        ))}
      </div>
    </div>
  );
}

function TaskRow({ task, readOnly, onChange, onRemove, onCycleStatus }: {
  task: RoomTask; readOnly?: boolean;
  onChange: (p: Partial<RoomTask>) => void;
  onRemove: () => void;
  onCycleStatus: () => void;
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors group ${task.status === "DONE" ? "opacity-60" : ""}`}>
      {/* Status toggle */}
      <button onClick={!readOnly ? onCycleStatus : undefined}
        disabled={readOnly}
        title={readOnly ? task.status : "Click to cycle status"}
        className={`text-lg w-6 shrink-0 transition-colors ${
          task.status === "DONE" ? "text-emerald-400" :
          task.status === "IN_PROGRESS" ? "text-indigo-400" : "text-[var(--text-3)]"
        } ${!readOnly ? "hover:scale-110 cursor-pointer" : ""}`}>
        {STATUS_ICONS[task.status]}
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        {readOnly ? (
          <p className={`text-sm text-[var(--text-1)] ${task.status === "DONE" ? "line-through text-[var(--text-3)]" : ""}`}>
            {task.title || "—"}
          </p>
        ) : (
          <input value={task.title} onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Task name..."
            className={`w-full text-sm bg-transparent outline-none border-b border-transparent hover:border-[var(--border)] focus:border-indigo-500/60 transition-colors ${
              task.status === "DONE" ? "line-through text-[var(--text-3)]" : "text-[var(--text-1)]"
            }`} />
        )}
        {task.assignedTo && (
          <p className="text-[var(--text-3)] text-xs mt-0.5">→ {task.assignedTo}</p>
        )}
      </div>

      {/* Assigned to */}
      {!readOnly && (
        <input value={task.assignedTo ?? ""}
          onChange={(e) => onChange({ assignedTo: e.target.value || null })}
          placeholder="Assignee"
          className="w-24 text-xs text-[var(--text-2)] bg-transparent border-b border-transparent hover:border-[var(--border)] focus:border-indigo-500/60 outline-none transition-colors" />
      )}

      {/* Due date */}
      {task.dueDate && (
        <span className={`text-xs shrink-0 tabular-nums ${
          new Date(task.dueDate) < new Date() && task.status !== "DONE"
            ? "text-red-400" : "text-[var(--text-3)]"
        }`}>
          {new Date(task.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
        </span>
      )}
      {!readOnly && (
        <input type="date" value={task.dueDate ? task.dueDate.slice(0, 10) : ""}
          onChange={(e) => onChange({ dueDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
          className="text-xs text-[var(--text-3)] bg-transparent border-b border-transparent hover:border-[var(--border)] focus:border-indigo-500/60 outline-none transition-colors w-32" />
      )}

      {/* Priority */}
      {!readOnly ? (
        <select value={task.priority}
          onChange={(e) => onChange({ priority: e.target.value as any })}
          className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg px-1.5 py-0.5 text-xs text-[var(--text-2)] outline-none focus:border-indigo-500/60 cursor-pointer shrink-0">
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
      ) : (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${PRIORITY_STYLES[task.priority]}`}>
          {task.priority}
        </span>
      )}

      {/* Status badge */}
      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium shrink-0 ${TASK_STATUS_STYLES[task.status]}`}>
        {task.status === "IN_PROGRESS" ? "In Progress" : task.status.charAt(0) + task.status.slice(1).toLowerCase()}
      </span>

      {!readOnly && (
        <button onClick={onRemove}
          className="text-[var(--text-3)] hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-all shrink-0">✕</button>
      )}
    </div>
  );
}
