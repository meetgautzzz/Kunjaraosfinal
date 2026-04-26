"use client";

// Folds the four standalone /ai tools into the proposal editor.
// Self-contained inner state machine: hub -> form -> generating -> output.
// Reuses the same form/output components and mock generators from the
// previous /ai page — no behavior change, just nested inside a tab.

import { useState } from "react";
import {
  AiToolType, TOOL_META,
  BudgetInput, BudgetOutput, mockBudget,
  RunOfShowInput, RunOfShowOutput, mockRunOfShow,
  SocialInput, SocialOutput, mockSocial,
  PresentationInput, PresentationOutput, mockPresentation,
} from "@/lib/ai-tools";
import { BudgetForm,       BudgetOutput   as BudgetOutputView }       from "@/components/ai/BudgetTool";
import { RunOfShowForm,    RunOfShowOutput as RunOfShowOutputView }   from "@/components/ai/RunOfShowTool";
import { SocialForm,       SocialOutput   as SocialOutputView }       from "@/components/ai/SocialTool";
import { PresentationForm, PresentationOutput as PresOutputView }     from "@/components/ai/PresentationTool";

type View = "hub" | "form" | "generating" | "output";

const COLOR_CLASSES: Record<string, { icon: string; ring: string }> = {
  emerald: { icon: "bg-emerald-500/15 text-emerald-400", ring: "hover:border-emerald-500/40" },
  amber:   { icon: "bg-amber-500/15 text-amber-400",     ring: "hover:border-amber-500/40"   },
  pink:    { icon: "bg-pink-500/15 text-pink-400",       ring: "hover:border-pink-500/40"    },
  indigo:  { icon: "bg-indigo-500/15 text-indigo-400",   ring: "hover:border-indigo-500/40"  },
};

const GENERATING_STEPS: Record<AiToolType, string[]> = {
  "budget":       ["Analysing event type & scale", "Calculating budget allocation", "Adding GST breakdown", "Generating notes & tips"],
  "run-of-show":  ["Parsing event timeline", "Building cue sequence", "Assigning ownership", "Adding production notes"],
  "social":       ["Analysing platforms & tone", "Writing platform captions", "Generating hashtag sets", "Optimising for reach"],
  "presentation": ["Structuring slide deck", "Writing slide content", "Adding speaker notes", "Final review"],
};

export default function ToolkitTab() {
  const [view,       setView]       = useState<View>("hub");
  const [activeTool, setActiveTool] = useState<AiToolType | null>(null);
  const [generStep,  setGenerStep]  = useState(0);
  const [output,     setOutput]     = useState<unknown>(null);
  const [input,      setInput]      = useState<unknown>(null);

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
    for (let i = 0; i < 4; i++) {
      await new Promise((r) => setTimeout(r, 500 + Math.random() * 400));
      setGenerStep(i + 1);
    }
    await new Promise((r) => setTimeout(r, 300));

    let result: unknown;
    if      (activeTool === "budget")       result = mockBudget(inp as BudgetInput);
    else if (activeTool === "run-of-show")  result = mockRunOfShow(inp as RunOfShowInput);
    else if (activeTool === "social")       result = mockSocial(inp as SocialInput);
    else                                    result = mockPresentation(inp as PresentationInput);

    setOutput(result);
    setView("output");
  }

  // ── Hub ──
  if (view === "hub") {
    return (
      <div className="p-6 space-y-5">
        <div>
          <h4 className="text-[var(--text-1)] font-semibold text-sm">AI Toolkit</h4>
          <p className="text-[var(--text-3)] text-xs mt-1">
            Quick generators that complement the Vision Board — pick one to start.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {(Object.keys(TOOL_META) as AiToolType[]).map((tool) => {
            const meta = TOOL_META[tool];
            const cc   = COLOR_CLASSES[meta.color];
            return (
              <button
                key={tool}
                onClick={() => startTool(tool)}
                className={`group text-left rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 transition-all hover:bg-[var(--bg-card)] ${cc.ring} flex flex-col gap-3`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${cc.icon}`}>
                  {meta.icon}
                </div>
                <div>
                  <p className="text-[var(--text-1)] font-semibold text-sm">{meta.label}</p>
                  <p className="text-[var(--text-3)] text-xs mt-1 leading-relaxed">{meta.description}</p>
                </div>
                <div className="mt-auto text-xs text-indigo-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Generate →
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Generating ──
  if (view === "generating" && activeTool) {
    const meta  = TOOL_META[activeTool];
    const steps = GENERATING_STEPS[activeTool];
    const cc    = COLOR_CLASSES[meta.color];
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-6 p-6">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-ping" />
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${cc.icon}`}>
            {meta.icon}
          </div>
        </div>
        <div className="text-center">
          <p className="text-[var(--text-1)] font-semibold">Generating {meta.label}…</p>
        </div>
        <div className="flex flex-col gap-2 w-72">
          {steps.map((label, i) => (
            <div key={label} className="flex items-center gap-3 text-sm">
              <div className={`w-1.5 h-1.5 rounded-full ${i < generStep ? "bg-indigo-400" : "bg-[var(--border)]"}`} />
              <span className={i < generStep ? "text-[var(--text-2)]" : "text-[var(--text-3)]"}>{label}</span>
              {i < generStep && <span className="text-emerald-400 text-xs ml-auto">✓</span>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Form ──
  if (view === "form" && activeTool) {
    const meta = TOOL_META[activeTool];
    const cc   = COLOR_CLASSES[meta.color];
    return (
      <div className="p-6 space-y-5 max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <button onClick={() => setView("hub")} className="text-[var(--text-3)] hover:text-[var(--text-1)] text-sm">← Back</button>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${cc.icon}`}>{meta.icon}</div>
          <div>
            <h4 className="text-[var(--text-1)] font-semibold text-sm">{meta.label}</h4>
            <p className="text-[var(--text-3)] text-xs">{meta.description}</p>
          </div>
        </div>
        {activeTool === "budget"       && <BudgetForm       onGenerate={handleGenerate as (i: BudgetInput) => void} />}
        {activeTool === "run-of-show"  && <RunOfShowForm    onGenerate={handleGenerate as (i: RunOfShowInput) => void} />}
        {activeTool === "social"       && <SocialForm       onGenerate={handleGenerate as (i: SocialInput) => void} />}
        {activeTool === "presentation" && <PresentationForm onGenerate={handleGenerate as (i: PresentationInput) => void} />}
      </div>
    );
  }

  // ── Output ──
  if (view === "output" && activeTool && output) {
    const meta = TOOL_META[activeTool];
    const cc   = COLOR_CLASSES[meta.color];
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <button onClick={() => setView("hub")}  className="text-[var(--text-3)] hover:text-[var(--text-1)] text-sm">← Toolkit</button>
            <button onClick={() => setView("form")} className="text-[var(--text-3)] hover:text-[var(--text-1)] text-sm">← Edit inputs</button>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base ${cc.icon}`}>{meta.icon}</div>
            <h4 className="text-[var(--text-1)] font-semibold text-sm">{meta.label}</h4>
          </div>
          <button
            onClick={() => { setOutput(null); handleGenerate(input); }}
            className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text-1)] text-xs"
          >
            ↺ Regenerate
          </button>
        </div>

        {activeTool === "budget"       && <BudgetOutputView    output={output as BudgetOutput}       onChange={(o) => setOutput(o)} />}
        {activeTool === "run-of-show"  && <RunOfShowOutputView output={output as RunOfShowOutput}    onChange={(o) => setOutput(o)} />}
        {activeTool === "social"       && <SocialOutputView    output={output as SocialOutput}       onChange={(o) => setOutput(o)} />}
        {activeTool === "presentation" && <PresOutputView      output={output as PresentationOutput} onChange={(o) => setOutput(o)} />}
      </div>
    );
  }

  return null;
}
