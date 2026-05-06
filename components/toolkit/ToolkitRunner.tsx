"use client";

import { useState, useEffect, memo } from "react";
import dynamic from "next/dynamic";
import type {
  AiToolType, HistoryEntry,
  BudgetInput, BudgetOutput,
  RunOfShowInput, RunOfShowOutput,
  SocialInput, SocialOutput,
  PresentationInput, PresentationOutput,
} from "@/lib/ai-tools";
import {
  TOOL_META,
  mockBudget, mockRunOfShow, mockSocial, mockPresentation,
  loadHistory, saveToHistory, deleteFromHistory,
} from "@/lib/ai-tools";

const BudgetForm        = dynamic(() => import("@/components/ai/BudgetTool").then((m) => ({ default: m.BudgetForm })));
const BudgetOutputView  = dynamic(() => import("@/components/ai/BudgetTool").then((m) => ({ default: m.BudgetOutput })));
const RunOfShowForm     = dynamic(() => import("@/components/ai/RunOfShowTool").then((m) => ({ default: m.RunOfShowForm })));
const RunOfShowOutputView = dynamic(() => import("@/components/ai/RunOfShowTool").then((m) => ({ default: m.RunOfShowOutput })));
const SocialForm        = dynamic(() => import("@/components/ai/SocialTool").then((m) => ({ default: m.SocialForm })));
const SocialOutputView  = dynamic(() => import("@/components/ai/SocialTool").then((m) => ({ default: m.SocialOutput })));
const PresentationForm  = dynamic(() => import("@/components/ai/PresentationTool").then((m) => ({ default: m.PresentationForm })));
const PresOutputView    = dynamic(() => import("@/components/ai/PresentationTool").then((m) => ({ default: m.PresentationOutput })));

type View = "form" | "generating" | "output";

const COLOR_CLASSES: Record<string, { icon: string; ring: string }> = {
  emerald: { icon: "bg-emerald-500/15 text-emerald-400", ring: "ring-emerald-500/30" },
  amber:   { icon: "bg-amber-500/15 text-amber-400",     ring: "ring-amber-500/30"   },
  pink:    { icon: "bg-pink-500/15 text-pink-400",       ring: "ring-pink-500/30"    },
  indigo:  { icon: "bg-indigo-500/15 text-indigo-400",   ring: "ring-indigo-500/30"  },
};

const GENERATING_STEPS: Record<AiToolType, string[]> = {
  "budget":       ["Analysing event type & scale", "Calculating budget allocation", "Adding GST breakdown", "Generating notes & tips"],
  "run-of-show":  ["Parsing event timeline", "Building cue sequence", "Assigning ownership", "Adding production notes"],
  "social":       ["Analysing platforms & tone", "Writing platform captions", "Generating hashtag sets", "Optimising for reach"],
  "presentation": ["Structuring slide deck", "Writing slide content", "Adding speaker notes", "Final review"],
};

const ToolkitRunner = memo(function ToolkitRunner({ tool }: { tool: AiToolType }) {
  const [view,      setView]     = useState<View>("form");
  const [generStep, setGenerStep] = useState(0);
  const [output,    setOutput]   = useState<unknown>(null);
  const [input,     setInput]    = useState<unknown>(null);
  const [history,   setHistory]  = useState<HistoryEntry[]>([]);
  const [savedId,   setSavedId]  = useState<string | null>(null);

  const meta = TOOL_META[tool];
  const cc   = COLOR_CLASSES[meta.color];

  function clearToolHistory() {
    const remaining = loadHistory().filter((h) => h.tool !== tool);
    localStorage.setItem("kunjara_ai_history", JSON.stringify(remaining));
    setHistory([]);
  }

  useEffect(() => {
    setHistory(loadHistory().filter((h) => h.tool === tool));
  }, [tool]);

  async function handleGenerate(inp: unknown) {
    setInput(inp);
    setView("generating");
    setGenerStep(0);

    for (let i = 0; i < 4; i++) {
      await new Promise((r) => setTimeout(r, 500 + Math.random() * 400));
      setGenerStep(i + 1);
    }
    await new Promise((r) => setTimeout(r, 300));

    let result: unknown;
    if (tool === "budget")        result = mockBudget(inp as BudgetInput);
    else if (tool === "run-of-show") result = mockRunOfShow(inp as RunOfShowInput);
    else if (tool === "social")   result = mockSocial(inp as SocialInput);
    else                          result = mockPresentation(inp as PresentationInput);

    setOutput(result);
    setView("output");
  }

  function handleSave() {
    if (!output) return;
    let title = meta.label;
    if (tool === "budget")        title = (output as BudgetOutput).title;
    else if (tool === "run-of-show") title = (output as RunOfShowOutput).eventName || meta.label;
    else if (tool === "social")   title = `${(input as SocialInput)?.eventName || "Social"} Captions`;
    else                          title = (output as PresentationOutput).title;

    const entry = saveToHistory({ tool, title, input, output });
    setHistory(loadHistory().filter((h) => h.tool === tool));
    setSavedId(entry.id);
    setTimeout(() => setSavedId(null), 2500);
  }

  function loadFromHistory(entry: HistoryEntry) {
    setInput(entry.input);
    setOutput(entry.output);
    setView("output");
  }

  // ── Generating ─────────────────────────────────────────────────────────────
  if (view === "generating") {
    const steps = GENERATING_STEPS[tool];
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-ping" />
          <div className="absolute inset-0 rounded-full border-2 border-indigo-500/40 animate-pulse" />
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${cc.icon}`}>
            {meta.icon}
          </div>
        </div>
        <div className="text-center">
          <p className="text-[var(--text-1)] font-semibold text-lg">Generating {meta.label}...</p>
          <p className="text-[var(--text-2)] text-sm mt-1">AI is building your output</p>
        </div>
        <div className="flex flex-col gap-2.5 w-72">
          {steps.map((label, i) => (
            <div key={label} className="flex items-center gap-3 text-sm">
              <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i < generStep ? "bg-indigo-400" : "bg-[var(--border)]"}`} />
              <span className={i < generStep ? "text-[var(--text-2)]" : "text-[var(--text-3)]"}>{label}</span>
              {i < generStep && <span className="text-emerald-400 text-xs ml-auto">✓</span>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Output ──────────────────────────────────────────────────────────────────
  if (view === "output" && output) {
    return (
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button onClick={() => setView("form")} className="text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors text-sm">← Edit Inputs</button>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${cc.icon}`}>{meta.icon}</div>
            <h2 className="text-lg font-bold text-[var(--text-1)]">{meta.label}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleGenerate(input)}
              className="px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text-1)] text-sm transition-colors"
            >
              ↺ Regenerate
            </button>
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${savedId ? "bg-emerald-500 text-white" : "bg-indigo-500 hover:bg-indigo-600 text-white"}`}
            >
              {savedId ? "✓ Saved!" : "Save to History"}
            </button>
          </div>
        </div>

        {tool === "budget" && (
          <BudgetOutputView output={output as BudgetOutput} onChange={(o) => setOutput(o)} />
        )}
        {tool === "run-of-show" && (
          <RunOfShowOutputView output={output as RunOfShowOutput} onChange={(o) => setOutput(o)} />
        )}
        {tool === "social" && (
          <SocialOutputView output={output as SocialOutput} onChange={(o) => setOutput(o)} />
        )}
        {tool === "presentation" && (
          <PresOutputView output={output as PresentationOutput} onChange={(o) => setOutput(o)} />
        )}

        {/* History for this tool */}
        {history.length > 0 && (
          <div className="pt-6 border-t border-[var(--border)]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[var(--text-1)] font-semibold text-sm">Previous Generations</h3>
              <button
                onClick={clearToolHistory}
                className="text-xs text-[var(--text-3)] hover:text-red-400 transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] divide-y divide-[var(--border)]">
              {history.slice(0, 8).map((entry) => (
                <div key={entry.id} className="flex items-center gap-4 px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors group">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 ${cc.icon}`}>
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--text-1)] text-sm font-medium truncate">{entry.title}</p>
                    <p className="text-[var(--text-3)] text-xs">{new Date(entry.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <button
                    onClick={() => loadFromHistory(entry)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity font-medium shrink-0"
                  >
                    Open →
                  </button>
                  <button
                    onClick={() => setHistory(deleteFromHistory(entry.id).filter((h) => h.tool === tool))}
                    className="text-[var(--text-3)] hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  >✕</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl ${cc.icon}`}>{meta.icon}</div>
        <div>
          <h2 className="text-xl font-bold text-[var(--text-1)]">{meta.label}</h2>
          <p className="text-[var(--text-3)] text-xs">{meta.description}</p>
        </div>
      </div>

      {tool === "budget"       && <BudgetForm   onGenerate={handleGenerate as (i: BudgetInput)       => void} />}
      {tool === "run-of-show"  && <RunOfShowForm onGenerate={handleGenerate as (i: RunOfShowInput)    => void} />}
      {tool === "social"       && <SocialForm   onGenerate={handleGenerate as (i: SocialInput)       => void} />}
      {tool === "presentation" && <PresentationForm onGenerate={handleGenerate as (i: PresentationInput) => void} />}

      {/* History panel — shown below form so returning users can reload */}
      {history.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[var(--text-1)] font-semibold text-sm">Previous Generations</h3>
            <button
              onClick={clearToolHistory}
              className="text-xs text-[var(--text-3)] hover:text-red-400 transition-colors"
            >
              Clear all
            </button>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] divide-y divide-[var(--border)]">
            {history.slice(0, 8).map((entry) => (
              <div key={entry.id} className="flex items-center gap-4 px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors group">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 ${cc.icon}`}>
                  {meta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[var(--text-1)] text-sm font-medium truncate">{entry.title}</p>
                  <p className="text-[var(--text-3)] text-xs">{new Date(entry.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <button
                  onClick={() => loadFromHistory(entry)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity font-medium shrink-0"
                >
                  Open →
                </button>
                <button
                  onClick={() => setHistory(deleteFromHistory(entry.id).filter((h) => h.tool === tool))}
                  className="text-[var(--text-3)] hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default ToolkitRunner;
