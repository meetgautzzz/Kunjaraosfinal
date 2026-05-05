// Server-only. Maps a ProposalData object to EventVisualInput and generates a render.

import type { ProposalData } from "@/lib/proposals";
import {
  generateEventVisual,
  buildEventVisualPrompt,
  type EventVisualInput,
  type EventVisualResult,
} from "./generateEventVisual";

// ── Field mappers ─────────────────────────────────────────────────────────────

function mapEventType(raw?: string): EventVisualInput["eventType"] {
  if (!raw) return "booth";
  const s = raw.toLowerCase();
  if (s.includes("concert") || s.includes("music") || s.includes("live")) return "concert";
  if (s.includes("festival") || s.includes("outdoor") || s.includes("multi")) return "festival";
  if (s.includes("stage")) return "stage";
  if (s.includes("booth") || s.includes("expo") || s.includes("trade") || s.includes("exhibition")) return "booth";
  return "booth";
}

const THEME_KEYWORDS: Record<EventVisualInput["theme"], string[]> = {
  luxury:      ["luxury", "premium", "opulent", "gold", "champagne", "royal", "elite"],
  modern:      ["modern", "contemporary", "clean", "sleek"],
  futuristic:  ["futuristic", "sci-fi", "tech", "digital", "cyber", "holographic"],
  gaming:      ["gaming", "neon", "rgb", "esports", "cyberpunk"],
  tropical:    ["tropical", "beach", "island", "nature", "botanical"],
  corporate:   ["corporate", "business", "professional", "executive", "formal"],
  minimal:     ["minimal", "minimalist", "simple", "understated"],
  traditional: ["traditional", "cultural", "ethnic", "classic", "heritage", "rustic"],
};

function mapTheme(raw?: string): EventVisualInput["theme"] {
  if (!raw) return "modern";
  const s = raw.toLowerCase();
  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS) as [EventVisualInput["theme"], string[]][]) {
    if (keywords.some((k) => s.includes(k))) return theme;
  }
  return "modern";
}

const FEATURE_OPTIONS = [
  "LED Panels", "Truss Lighting", "Branded Bar Counter", "Smoke / Haze Effects",
  "Moving Lights", "Projection Mapping", "VIP Lounge Area", "Photo Booth Zone",
  "Sponsor Banners", "Stage Risers", "Laser Lights", "Hanging Installations",
  "Interactive Screens", "Greenery / Floral", "Neon Signage", "Crowd Barriers",
];

function mapFeatures(proposal: ProposalData): string[] {
  const candidates: string[] = [];
  for (const a of proposal.experienceElements?.activations ?? []) {
    if (a.name) candidates.push(a.name.toLowerCase());
  }
  for (const b of proposal.budgetBreakdown ?? []) {
    if (b.category) candidates.push(b.category.toLowerCase());
  }

  const matched = FEATURE_OPTIONS.filter((f) => {
    const fl = f.toLowerCase();
    return candidates.some((c) => c.includes(fl.split(" ")[0]) || fl.includes(c.split(" ")[0]));
  });

  return matched.length >= 1 ? matched.slice(0, 8) : ["LED Panels", "Branded Bar Counter"];
}

// ── Main export ───────────────────────────────────────────────────────────────

export type ProposalVisualResult = EventVisualResult & {
  input: EventVisualInput;
};

export async function generateFromProposal(proposal: ProposalData): Promise<ProposalVisualResult> {
  const p = proposal as ProposalData & Record<string, unknown>;

  const brandName =
    proposal.client?.name ??
    proposal.client?.companyName ??
    (proposal.concept as { title?: string } | undefined)?.title ??
    proposal.title ??
    "";

  const themeRaw =
    (proposal.concept as { theme?: string } | undefined)?.theme ??
    proposal.eventConcept?.theme ??
    proposal.visualDirection?.overallAesthetic ??
    "";

  const input: EventVisualInput = {
    eventType:    mapEventType(proposal.eventType),
    brandName,
    dimensions:   (p.setupSize as string | undefined) ?? "",
    theme:        mapTheme(themeRaw),
    features:     mapFeatures(proposal),
    budget:       proposal.budget ? String(proposal.budget) : undefined,
    audienceType: (p.audienceType as string | undefined),
  };

  if (!input.dimensions) {
    // Fall back to a generic size so the API doesn't reject the required field
    input.dimensions = "standard event setup";
  }

  const result = await generateEventVisual(input);
  return { ...result, input };
}

export { buildEventVisualPrompt, type EventVisualInput, type EventVisualResult };
