"use client";

import { EventIdea } from "@/lib/proposals";

interface Props {
  ideas:      EventIdea[];
  onSelect:   (idea: EventIdea) => void;
  isLoading?: boolean;
}

const SCORE_COLOR = (v: number) =>
  v >= 8 ? "bg-emerald-500" : v >= 6 ? "bg-amber-500" : "bg-red-400";

const SCORE_TEXT = (v: number) =>
  v >= 8 ? "text-emerald-400" : v >= 6 ? "text-amber-400" : "text-red-400";

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <div className="flex justify-between" style={{ fontSize: 10.5 }}>
        <span style={{ color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{label}</span>
        <span className={`font-bold ${SCORE_TEXT(value)}`} style={{ fontVariantNumeric: "tabular-nums" }}>{value}/10</span>
      </div>
      <div style={{ height: 3, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <div
          className={`h-full rounded-full transition-all duration-700 ${SCORE_COLOR(value)}`}
          style={{ width: `${value * 10}%` }}
        />
      </div>
    </div>
  );
}

const EXP_TYPE_STYLES: Record<string, string> = {
  IMMERSIVE_JOURNEY:  "bg-violet-500/15 text-violet-300 border-violet-500/25",
  POP_UP_ACTIVATION:  "bg-orange-500/15 text-orange-300 border-orange-500/25",
  GAMIFICATION:       "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  SENSORY_EXPERIENCE: "bg-rose-500/15 text-rose-300 border-rose-500/25",
  CO_CREATION:        "bg-cyan-500/15 text-cyan-300 border-cyan-500/25",
  THEATRICAL_REVEAL:  "bg-amber-500/15 text-amber-300 border-amber-500/25",
};

export default function IdeaCards({ ideas, onSelect, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid gap-5 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-white/6 bg-white/3 p-6 space-y-4 animate-pulse">
            <div className="h-5 w-3/4 rounded bg-white/8" />
            <div className="h-3 w-1/2 rounded bg-white/5" />
            <div className="space-y-2 pt-2">
              {[1, 2, 3].map((j) => <div key={j} className="h-2 rounded bg-white/5" />)}
            </div>
            <div className="h-10 w-full rounded-xl bg-white/6 mt-4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {ideas.map((idea, idx) => {
        const expStyle = EXP_TYPE_STYLES[idea.experienceType] ?? "bg-indigo-500/15 text-indigo-300 border-indigo-500/25";
        const isRec    = idea.score.isRecommended;
        const delay    = ["", "delay-1", "delay-2"][idx] ?? "";

        return (
          <div
            key={idea.id}
            className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-200 hover:-translate-y-0.5 animate-fade-up ${delay}`}
            style={{
              background: isRec ? "rgba(99,102,241,0.05)" : "rgba(255,255,255,0.025)",
              borderColor: isRec ? "rgba(99,102,241,0.35)" : "rgba(255,255,255,0.07)",
              boxShadow: isRec ? "0 12px 40px rgba(99,102,241,0.12)" : "none",
            }}
          >
            {/* Recommended badge */}
            {isRec && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                <span
                  className="inline-flex items-center gap-1.5"
                  style={{
                    borderRadius: 99,
                    border: "1px solid rgba(99,102,241,0.4)",
                    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                    padding: "4px 12px",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#fff",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
                  }}
                >
                  <span style={{ color: "#fde68a" }}>★</span> Recommended
                </span>
              </div>
            )}

            {/* Experience type tag */}
            <div
              className={`self-start mb-4 mt-1 ${expStyle}`}
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.09em",
                textTransform: "uppercase",
                padding: "4px 10px",
                borderRadius: 7,
                border: "1px solid",
              }}
            >
              {idea.experienceType.replace(/_/g, " ")}
            </div>

            {/* Title + vibe */}
            <div style={{ marginBottom: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", lineHeight: 1.3, marginBottom: 5, letterSpacing: "-0.01em" }}>
                {idea.title}
              </h3>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", fontStyle: "italic" }}>{idea.vibe}</p>
            </div>

            {/* Headline */}
            <p
              className="line-clamp-3"
              style={{ fontSize: 13.5, color: "rgba(255,255,255,0.62)", lineHeight: 1.65, marginBottom: 16 }}
            >
              {idea.concept}
            </p>

            {/* Wow factor */}
            <div
              style={{
                marginBottom: 16,
                borderRadius: 10,
                background: "rgba(255,255,255,0.035)",
                border: "1px solid rgba(255,255,255,0.06)",
                padding: "12px 14px",
              }}
            >
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 5 }}>
                Wow Factor
              </p>
              <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.78)", lineHeight: 1.6 }}>{idea.wowFactor}</p>
            </div>

            {/* Engagement mechanics */}
            <div className="flex flex-wrap" style={{ gap: 6, marginBottom: 16 }}>
              {idea.engagement.map((e, i) => (
                <span
                  key={i}
                  style={{
                    borderRadius: 7,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    padding: "4px 10px",
                    fontSize: 11,
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  {e}
                </span>
              ))}
            </div>

            {/* Score bars */}
            <div style={{ marginBottom: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              <ScoreBar label="Uniqueness" value={idea.score.uniqueness} />
              <ScoreBar label="Engagement" value={idea.score.engagement} />
              <ScoreBar label="Budget Fit" value={idea.score.budgetFit}  />
            </div>

            {/* Overall score */}
            <div
              className="flex items-center justify-between"
              style={{
                marginBottom: 16,
                padding: "10px 13px",
                borderRadius: 9,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.28)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>
                Overall Score
              </span>
              <div className="flex items-baseline gap-1">
                <span className={`font-black tabular-nums ${SCORE_TEXT(idea.score.overall)}`} style={{ fontSize: 26, lineHeight: 1 }}>
                  {idea.score.overall.toFixed(1)}
                </span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>/ 10</span>
              </div>
            </div>

            {/* Brand integration */}
            <p
              className="line-clamp-2"
              style={{ marginBottom: 18, fontSize: 11, color: "rgba(255,255,255,0.28)", fontStyle: "italic", lineHeight: 1.6 }}
            >
              {idea.brandIntegration}
            </p>

            {/* CTA */}
            <button
              onClick={() => onSelect(idea)}
              style={{
                marginTop: "auto",
                width: "100%",
                padding: "12px",
                borderRadius: 11,
                fontSize: 13.5,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.18s",
                letterSpacing: "-0.01em",
                ...(isRec
                  ? {
                      background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                      color: "#fff",
                      border: "none",
                      boxShadow: "0 6px 20px rgba(99,102,241,0.28)",
                    }
                  : {
                      background: "rgba(255,255,255,0.07)",
                      color: "rgba(255,255,255,0.75)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }),
              }}
            >
              {isRec ? "✦ Select this concept" : "Select concept"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
