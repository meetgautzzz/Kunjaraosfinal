"use client";

import { useState, useEffect } from "react";
import {
  AiToolType, HistoryEntry, TOOL_META,
  BudgetInput, BudgetOutput, mockBudget,
  RunOfShowInput, RunOfShowOutput, mockRunOfShow,
  SocialInput, SocialOutput, mockSocial,
  PresentationInput, PresentationOutput, mockPresentation,
  loadHistory, saveToHistory, deleteFromHistory,
} from "@/lib/ai-tools";
import { BudgetForm, BudgetOutput as BudgetOutputView }         from "@/components/ai/BudgetTool";
import { RunOfShowForm, RunOfShowOutput as RunOfShowOutputView } from "@/components/ai/RunOfShowTool";
import { SocialForm, SocialOutput as SocialOutputView }         from "@/components/ai/SocialTool";
import { PresentationForm, PresentationOutput as PresOutputView } from "@/components/ai/PresentationTool";

type View = "hub" | "form" | "generating" | "output";

const COLOR_CLASSES: Record<string, { icon: string; ring: string; card: string }> = {
  emerald: { icon: "bg-emerald-500/15 text-emerald-400", ring: "hover:border-emerald-500/40", card: "border-emerald-500/30 bg-emerald-500/5" },
  amber:   { icon: "bg-amber-500/15 text-amber-400",     ring: "hover:border-amber-500/40",   card: "border-amber-500/30 bg-amber-500/5"   },
  pink:    { icon: "bg-pink-500/15 text-pink-400",       ring: "hover:border-pink-500/40",    card: "border-pink-500/30 bg-pink-500/5"     },
  indigo:  { icon: "bg-indigo-500/15 text-indigo-400",   ring: "hover:border-indigo-500/40",  card: "border-indigo-500/30 bg-indigo-500/5" },
};

const GENERATING_STEPS: Record<AiToolType, string[]> = {
  "budget":       ["Analysing event type & scale", "Calculating budget allocation", "Adding GST breakdown", "Generating notes & tips"],
  "run-of-show":  ["Parsing event timeline", "Building cue sequence", "Assigning ownership", "Adding production notes"],
  "social":       ["Analysing platforms & tone", "Writing platform captions", "Generating hashtag sets", "Optimising for reach"],
  "presentation": ["Structuring slide deck", "Writing slide content", "Adding speaker notes", "Final review"],
};

export default function AIPage() {
  const [view,        setView]       = useState<View>("hub");
  const [activeTool,  setActiveTool] = useState<AiToolType | null>(null);
  const [generStep,   setGenerStep]  = useState(0);
  const [output,      setOutput]     = useState<unknown>(null);
  const [input,       setInput]      = useState<unknown>(null);
  const [history,     setHistory]    = useState<HistoryEntry[]>([]);
  const [savedId,     setSavedId]    = useState<string | null>(null);

  useEffect(() => { setHistory(loadHistory()); }, []);

  function startTool(tool: AiToolType) {
    setActiveTool(tool);
    setOutput(null);
    setInput(null);
    setView("form");
  }

  async function handleGenerate(inp: unknown) {
    if (!activeTool) return;
    setInput(inp);
    setView("generating");
    setGenerStep(0);

    // Simulate streaming steps
    for (let i = 0; i < 4; i++) {
      await new Promise((r) => setTimeout(r, 500 + Math.random() * 400));
      setGenerStep(i + 1);
    }
    await new Promise((r) => setTimeout(r, 300));

    let result: unknown;
    if (activeTool === "budget")       result = mockBudget(inp as BudgetInput);
    else if (activeTool === "run-of-show") result = mockRunOfShow(inp as RunOfShowInput);
    else if (activeTool === "social")  result = mockSocial(inp as SocialInput);
    else                               result = mockPresentation(inp as PresentationInput);

    setOutput(result);
    setView("output");
  }

  function handleSave() {
    if (!activeTool || !output) return;
    const meta = TOOL_META[activeTool];
    let title = meta.label;
    if (activeTool === "budget")       title = (output as BudgetOutput).title;
    else if (activeTool === "run-of-show") title = (output as RunOfShowOutput).eventName || meta.label;
    else if (activeTool === "social")  title = `${(input as SocialInput)?.eventName || "Social"} Captions`;
    else                               title = (output as PresentationOutput).title;

    const entry = saveToHistory({ tool: activeTool, title, input, output });
    setHistory(loadHistory());
    setSavedId(entry.id);
    setTimeout(() => setSavedId(null), 2500);
  }

  function handleDeleteHistory(id: string) {
    setHistory(deleteFromHistory(id));
  }

  function loadFromHistory(entry: HistoryEntry) {
    setActiveTool(entry.tool);
    setInput(entry.input);
    setOutput(entry.output);
    setView("output");
  }

  // ── Hub ──────────────────────────────────────────────────────────────────────
  if (view === "hub") {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-1)]">AI Tools</h2>
          <p className="text-[var(--text-2)] text-sm mt-1">Generate event assets in seconds — all fully editable.</p>
        </div>

        {/* Tool cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {(Object.keys(TOOL_META) as AiToolType[]).map((tool) => {
            const meta = TOOL_META[tool];
            const cc   = COLOR_CLASSES[meta.color];
            return (
              <button key={tool} onClick={() => startTool(tool)}
                className={`group text-left rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 transition-all hover:bg-[var(--bg-hover)] ${cc.ring} flex flex-col gap-4`}>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl ${cc.icon}`}>
                  {meta.icon}
                </div>
                <div>
                  <p className="text-[var(--text-1)] font-semibold text-sm group-hover:text-white transition-colors">{meta.label}</p>
                  <p className="text-[var(--text-3)] text-xs mt-1 leading-relaxed">{meta.description}</p>
                </div>
                <div className="mt-auto text-xs text-indigo-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Generate →
                </div>
              </button>
            );
          })}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[var(--text-1)] font-semibold text-sm">Recent Generations</h3>
              <button onClick={() => { localStorage.removeItem("kunjara_ai_history"); setHistory([]); }}
                className="text-xs text-[var(--text-3)] hover:text-red-400 transition-colors">Clear all</button>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] divide-y divide-[var(--border)]">
              {history.slice(0, 12).map((entry) => {
                const meta = TOOL_META[entry.tool];
                const cc   = COLOR_CLASSES[meta.color];
                const date = new Date(entry.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
                return (
                  <div key={entry.id} className="flex items-center gap-4 px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors group">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${cc.icon}`}>
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[var(--text-1)] text-sm font-medium truncate">{entry.title}</p>
                      <p className="text-[var(--text-3)] text-xs">{meta.label} · {date}</p>
                    </div>
                    <button onClick={() => loadFromHistory(entry)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity font-medium shrink-0">
                      Open →
                    </button>
                    <button onClick={() => handleDeleteHistory(entry.id)}
                      className="text-[var(--text-3)] hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity shrink-0">✕</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Generating ───────────────────────────────────────────────────────────────
  if (view === "generating" && activeTool) {
    const meta  = TOOL_META[activeTool];
    const steps = GENERATING_STEPS[activeTool];
    const cc    = COLOR_CLASSES[meta.color];
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

  // ── Form ─────────────────────────────────────────────────────────────────────
  if (view === "form" && activeTool) {
    const meta = TOOL_META[activeTool];
    const cc   = COLOR_CLASSES[meta.color];
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setView("hub")} className="text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors text-sm">← Back</button>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl ${cc.icon}`}>{meta.icon}</div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text-1)]">{meta.label}</h2>
            <p className="text-[var(--text-3)] text-xs">{meta.description}</p>
          </div>
        </div>
        {activeTool === "budget"      && <BudgetForm   onGenerate={handleGenerate as (i: BudgetInput) => void} />}
        {activeTool === "run-of-show" && <RunOfShowForm onGenerate={handleGenerate as (i: RunOfShowInput) => void} />}
        {activeTool === "social"      && <SocialForm   onGenerate={handleGenerate as (i: SocialInput) => void} />}
        {activeTool === "presentation"&& <PresentationForm onGenerate={handleGenerate as (i: PresentationInput) => void} />}
      </div>
    );
  }

  // ── Output ───────────────────────────────────────────────────────────────────
  if (view === "output" && activeTool && output) {
    const meta = TOOL_META[activeTool];
    const cc   = COLOR_CLASSES[meta.color];
    return (
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button onClick={() => setView("hub")} className="text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors text-sm">← Hub</button>
            <button onClick={() => setView("form")} className="text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors text-sm">← Edit Inputs</button>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${cc.icon}`}>{meta.icon}</div>
            <h2 className="text-lg font-bold text-[var(--text-1)]">{meta.label}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setOutput(null); handleGenerate(input); }}
              className="px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text-1)] text-sm transition-colors">
              ↺ Regenerate
            </button>
            <button onClick={handleSave}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${savedId ? "bg-emerald-500 text-white" : "bg-indigo-500 hover:bg-indigo-600 text-white"}`}>
              {savedId ? "✓ Saved!" : "Save to History"}
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTool === "budget" && (
          <BudgetOutputView output={output as BudgetOutput} onChange={(o) => setOutput(o)} />
        )}
        {activeTool === "run-of-show" && (
          <RunOfShowOutputView output={output as RunOfShowOutput} onChange={(o) => setOutput(o)} />
        )}
        {activeTool === "social" && (
          <SocialOutputView output={output as SocialOutput} onChange={(o) => setOutput(o)} />
        )}
        {activeTool === "presentation" && (
          <PresOutputView output={output as PresentationOutput} onChange={(o) => setOutput(o)} />
        )}
      </div>
    );
  }

  return null;
}
