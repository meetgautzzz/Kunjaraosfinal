// Centralized model selection. Names are env-driven so we can rotate
// models without a redeploy of route code. Defaults are conservative:
// gpt-4o for proposal generation (where output quality compounds in
// every downstream tab), gpt-4o-mini for everything else.
//
// Override via Vercel env vars (no code change needed):
//   AI_MODEL_PRIMARY   — overrides PRIMARY_MODEL
//   AI_MODEL_MID_TIER  — overrides MID_TIER_MODEL
//   AI_MODEL_CHEAP     — overrides CHEAP_MODEL
//   AI_IMAGE_MODEL     — overrides IMAGE_MODEL
//   IMAGE_GEN_ENABLED  — "true" to switch on the image route

export type ActionType =
  | "proposal"   // full event plan generation (generate-experience, regenerate)
  | "concept"    // creative idea brainstorming (generate-ideas)
  | "edit"       // user-driven inline edit / small refinement
  | "budget"
  | "vendor"
  | "timeline"
  | "other";

export const PRIMARY_MODEL  = process.env.AI_MODEL_PRIMARY  || "gpt-4o";
export const MID_TIER_MODEL = process.env.AI_MODEL_MID_TIER || "gpt-4o";
export const CHEAP_MODEL    = process.env.AI_MODEL_CHEAP    || "gpt-4o-mini";

export const IMAGE_MODEL       = process.env.AI_IMAGE_MODEL    || "dall-e-3";
export const IMAGE_GEN_ENABLED = process.env.IMAGE_GEN_ENABLED === "true";

export function getModelForAction(action: ActionType): string {
  switch (action) {
    case "proposal": return MID_TIER_MODEL;
    case "edit":     return CHEAP_MODEL;
    default:         return CHEAP_MODEL;
  }
}
