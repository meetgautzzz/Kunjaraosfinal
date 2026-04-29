// Shared prompt + user-message builder for /generate-experience and
// /regenerate. Single source of truth for the SYSTEM_PROMPT — keep
// any wording changes in one place.

import type { EventIdea } from "@/lib/proposals";
import type { ProposalExample } from "@/lib/ai/examples";

export const EXPERIENCE_SYSTEM_PROMPT = `You are a senior event director at a premium Indian event agency. You have been given a chosen creative concept for an event — your job is to expand it into a fully executable luxury event plan.

Produce a JSON response that matches EXACTLY this shape (all fields required except where noted optional):

{
  "title": "string — the event title, e.g. 'Apex Gala Night 2025'",
  "concept": {
    "title":       "string — short concept name",
    "tagline":     "string — punchy one-liner, max 10 words",
    "description": "string — 2-3 sentence premium concept narrative",
    "theme":       "string — theme name + primary colours",
    "highlights":  ["5 specific signature highlights — concrete and named"]
  },
  "budgetBreakdown": [
    { "category": "Venue",          "amount": 250000, "percentage": 10, "description": "Specific venue line item" },
    { "category": "Catering",       "amount": 750000, "percentage": 30, "description": "..." },
    { "category": "Production",     "amount": 500000, "percentage": 20, "description": "..." },
    { "category": "Decor",          "amount": 300000, "percentage": 12, "description": "..." },
    { "category": "Entertainment",  "amount": 200000, "percentage":  8, "description": "..." },
    { "category": "Photography",    "amount": 100000, "percentage":  4, "description": "..." },
    { "category": "Logistics",      "amount": 150000, "percentage":  6, "description": "..." },
    { "category": "Contingency",    "amount": 250000, "percentage": 10, "description": "..." }
  ],
  "timeline": [
    { "phase": "Strategy & Planning",  "daysOut": "90 days before", "tasks": ["3-5 specific tasks"], "milestone": true  },
    { "phase": "Vendor Sourcing",      "daysOut": "75 days before", "tasks": ["..."],                "milestone": false },
    { "phase": "Creative Development", "daysOut": "60 days before", "tasks": ["..."],                "milestone": true  },
    { "phase": "Production",           "daysOut": "30 days before", "tasks": ["..."],                "milestone": false },
    { "phase": "Final Preparation",    "daysOut": "7 days before",  "tasks": ["..."],                "milestone": true  },
    { "phase": "Event Day",            "daysOut": "Day of event",   "tasks": ["..."],                "milestone": true  }
  ],
  "vendors": [
    { "category": "Venue",           "role": "Host venue & facilities",   "estimatedCost": 250000, "notes": "Specific venue recommendation with rationale" },
    { "category": "Catering",        "role": "F&B management",            "estimatedCost": 750000, "notes": "..." },
    { "category": "AV & Technology", "role": "Sound, lighting, LED",      "estimatedCost": 350000, "notes": "..." },
    { "category": "Decor & Design",  "role": "Theme execution",           "estimatedCost": 300000, "notes": "..." },
    { "category": "Entertainment",   "role": "Performers & DJ",           "estimatedCost": 200000, "notes": "..." },
    { "category": "Photography",     "role": "Photo + video",             "estimatedCost": 100000, "notes": "..." }
  ],
  "riskFlags": ["3-4 real risks for this specific event/location/time"],
  "tips":      ["3-4 pro tips from 15 years of Indian event experience"],
  "eventConcept": {
    "theme":            "string — theme name",
    "storyline":        "string — the narrative arc of the event night",
    "tagline":          "string — punchy line",
    "emotionalJourney": ["4-6 emotional beats guests move through"]
  },
  "visualDirection": {
    "palette": [
      { "name": "string — colour name that fits this event", "hex": "#xxxxxx", "usage": "string — which surfaces/elements use this colour" },
      { "name": "string — second colour", "hex": "#xxxxxx", "usage": "string" },
      { "name": "string — third colour",  "hex": "#xxxxxx", "usage": "string" }
    ],
    "lighting":         "string — lighting style and key fixtures",
    "overallAesthetic": "string — one-sentence mood summary",
    "dallePrompt":      "string — a vivid image prompt for DALL-E that captures the visual direction"
  },
  "stageDesign": {
    "layout":          "string — stage type, dimensions, orientation",
    "focalPoints":     ["3-4 specific stage focal elements"],
    "entryExperience": "string — what guests experience on arrival",
    "signature":       "string — the one stage moment unique to this event"
  },
  "decorPlan": {
    "hero": "string — the hero decor statement piece",
    "zones": [
      { "name": "Entry",       "concept": "string" },
      { "name": "Main Hall",   "concept": "string" },
      { "name": "Dining Area", "concept": "string" },
      { "name": "Lounge",      "concept": "string" }
    ],
    "sustainabilityNotes": "string — specific reuse/eco choices"
  },
  "experienceElements": {
    "activations": [
      { "name": "string", "description": "string", "engagementType": "ACTIVE" },
      { "name": "string", "description": "string", "engagementType": "SOCIAL" },
      { "name": "string", "description": "string", "engagementType": "PASSIVE" }
    ],
    "guestJourney":     ["5-7 touchpoints a guest moves through from arrival to farewell"],
    "techElements":     ["3-5 tech or AV elements"],
    "surpriseElements": ["2-3 unannounced moments that delight guests"]
  }
}

Rules:
- budgetBreakdown amounts must SUM to the user's total budget. Percentages must total 100.
- engagementType must be one of: PASSIVE, ACTIVE, SOCIAL, COMPETITIVE
- All numbers are integers in INR (no strings, no currency symbols)
- Every field is required — do not omit any. Use empty arrays only if truly nothing applies.
- Be concrete and India-first. Name specific vendors, venues, fabrics, songs, dishes where relevant.
- No filler words like "world-class", "state-of-the-art", "premium quality".
- No markdown inside JSON values.
- visualDirection.palette MUST be derived from the specific event type, theme, vibe, and location — never reuse a generic palette. A Holi festival palette should be vibrant and multicoloured; a corporate gala should be understated and sophisticated; a beach wedding should use ocean and sand tones; a Diwali event should use deep jewel tones and gold. The hex codes must be real, saturated, event-appropriate colours — not placeholder greys.`;

export type ExperienceInputs = {
  selectedIdea:  Pick<EventIdea, "title" | "headline" | "concept" | "experienceType" | "vibe" | "wowFactor" | "brandIntegration">;
  eventType:     string;
  budget:        number;
  location:      string;
  requirements:  string;
  guestCount?:   number;
  clientCompanyName?: string;
  eventDate?:    string;
  venueByClient?: boolean;
  foodByClient?:  boolean;
  // For regenerations: free-text guidance the user typed in the regen modal.
  regenerationGuidance?: string;
};

export function buildExperienceUserMessage(args: ExperienceInputs, examples?: ProposalExample[]): string {
  return [
    `Chosen creative concept:`,
    `- Title:           ${args.selectedIdea.title}`,
    `- Headline:        ${args.selectedIdea.headline}`,
    `- Concept:         ${args.selectedIdea.concept}`,
    `- Experience type: ${args.selectedIdea.experienceType}`,
    `- Vibe:            ${args.selectedIdea.vibe}`,
    `- Wow factor:      ${args.selectedIdea.wowFactor}`,
    `- Brand tie-in:    ${args.selectedIdea.brandIntegration}`,
    ``,
    `Event brief:`,
    `- Event type: ${args.eventType}`,
    args.clientCompanyName ? `- Client company: ${args.clientCompanyName}` : null,
    `- Location:   ${args.location}`,
    args.eventDate ? `- Event date: ${args.eventDate}` : null,
    `- Total budget: ₹${args.budget.toLocaleString("en-IN")} INR`,
    args.guestCount ? `- Expected guests: ${args.guestCount}` : null,
    args.venueByClient === false
      ? `- VENUE: Client has NOT booked a venue — include a specific venue recommendation in the Venue line item and the vendors list.`
      : args.venueByClient === true
      ? `- VENUE: Client has already booked their own venue — do not suggest alternates; treat venue as fixed.`
      : null,
    args.foodByClient === false
      ? `- F&B: Client has NOT arranged food and beverages — include a full catering plan and vendor.`
      : args.foodByClient === true
      ? `- F&B: Client has already arranged food and beverages — do not plan catering; treat F&B as handled.`
      : null,
    ``,
    `Client requirements:`,
    args.requirements,
    args.regenerationGuidance ? `\nAdditional guidance for THIS regeneration (override prior choices where in conflict):\n${args.regenerationGuidance}` : null,
    ``,
    `Expand this chosen concept into a fully executable Indian luxury event plan. Respect the budget. Be specific.`,
    // Inject approved examples as few-shot style guides when available.
    ...(examples?.length
      ? [
          ``,
          `--- APPROVED REFERENCE EXAMPLES (same event type + budget range, accepted by real planners without changes) ---`,
          `Match or exceed this quality level. Use them as style and specificity guides — do NOT copy names or venues.`,
          ...examples.map((ex, i) =>
            [
              ``,
              `Example ${i + 1} · ${ex.eventType} · ₹${Number(ex.budget).toLocaleString("en-IN")} · ${ex.location}`,
              `Concept: ${JSON.stringify(ex.concept ?? {})}`,
              `Event concept: ${JSON.stringify(ex.eventConcept ?? {})}`,
              `Budget breakdown: ${JSON.stringify(ex.budgetBreakdown ?? [])}`,
              `Pro tips: ${JSON.stringify(ex.tips ?? [])}`,
            ].join("\n")
          ),
          ``,
          `--- END REFERENCE EXAMPLES ---`,
        ]
      : []),
  ].filter(Boolean).join("\n");
}

// L3 defense-in-depth: sanitize AI-controlled fields that flow into DOM
// attributes. Mirrors the logic that used to live inline in the route.
export function sanitizeExperiencePayload<T extends { visualDirection?: any }>(parsed: T): T {
  if (parsed.visualDirection) {
    delete (parsed.visualDirection as { generatedImageUrl?: unknown }).generatedImageUrl;
    if (Array.isArray(parsed.visualDirection.palette)) {
      const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
      parsed.visualDirection.palette = parsed.visualDirection.palette.map((s: any) => ({
        ...s,
        hex: typeof s?.hex === "string" && HEX.test(s.hex.trim()) ? s.hex.trim() : "#888888",
      }));
    }
  }
  return parsed;
}
