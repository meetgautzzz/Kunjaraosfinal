// Centralized model selection. Names are env-driven so we can rotate
// models without a redeploy of route code. Defaults are conservative:
// gpt-4o for proposal generation (where output quality compounds in
// every downstream tab), gpt-4o-mini for everything else.

export type ActionType =
  | "proposal"   // full event plan generation (generate-experience, regenerate)
  | "concept"    // creative idea brainstorming (generate-ideas)
  | "edit"       // user-driven inline edit / small refinement
  | "budget"
  | "vendor"
  | "timeline"
  | "other";

export const MID_TIER_MODEL  = process.env.AI_MODEL_MID_TIER  || "gpt-4o";
export const CHEAP_MODEL     = process.env.AI_MODEL_CHEAP     || "gpt-4o-mini";

export function getModelForAction(action: ActionType): string {
  switch (action) {
    case "proposal": return MID_TIER_MODEL;
    case "edit":     return CHEAP_MODEL;
    default:         return CHEAP_MODEL;
  }
}
