export type ClientInfo = {
  name?:        string;
  companyName?: string;
  mobile?:      string;
  email?:       string;
  address?:     string;
};

export type ProposalConcept = {
  title:       string;
  tagline:     string;
  description: string;
  theme:       string;
  highlights:  string[];
};

export type BudgetLine = {
  category:    string;
  amount:      number;
  percentage:  number;
  description: string;
};

export type TimelinePhase = {
  phase:     string;
  daysOut:   string;
  tasks:     string[];
  milestone: boolean;
};

export type ProposalVendor = {
  category:      string;
  role:          string;
  estimatedCost: number;
  notes:         string;
};

// ── Experience Generator types ─────────────────────────────────────────────────

export type IdeaScore = {
  uniqueness:    number;  // 1-10
  engagement:    number;  // 1-10
  budgetFit:     number;  // 1-10
  overall:       number;  // weighted average, 1-10
  isRecommended: boolean;
};

export type EventIdea = {
  id:               string;
  title:            string;
  concept:          string;
  experienceType:   string;
  engagement:       string[];
  brandIntegration: string;
  vibe:             string;
  headline:         string;
  wowFactor:        string;
  score:            IdeaScore;
};

export type ColorSwatch = {
  name:  string;
  hex:   string;
  usage: string;
};

export type ExperienceActivation = {
  name:           string;
  description:    string;
  engagementType: "PASSIVE" | "ACTIVE" | "SOCIAL" | "COMPETITIVE";
};

export type DecorZone = {
  name:    string;
  concept: string;
};

export type ProposalData = {
  id:              string;
  title:           string;
  eventType:       string;
  location:        string;
  budget:          number;
  requirements:    string;
  status:          "DRAFT" | "GENERATED" | "SAVED" | "SENT" | "APPROVED" | "CHANGES_REQUESTED";
  concept:         ProposalConcept;
  budgetBreakdown: BudgetLine[];
  timeline:        TimelinePhase[];
  vendors:         ProposalVendor[];
  riskFlags:       string[];
  tips:            string[];
  createdAt:       string;
  updatedAt:       string;
  // Experience Generator extensions (optional)
  selectedIdea?:      EventIdea;
  eventConcept?: {
    theme:            string;
    storyline:        string;
    tagline:          string;
    emotionalJourney: string[];
  };
  visualDirection?: {
    palette:           ColorSwatch[];
    lighting:          string;
    overallAesthetic:  string;
    dallePrompt:       string;
    generatedImageUrl?: string;
  };
  stageDesign?: {
    layout:          string;
    focalPoints:     string[];
    entryExperience: string;
    signature:       string;
  };
  decorPlan?: {
    hero:                string;
    zones:               DecorZone[];
    sustainabilityNotes: string;
  };
  experienceElements?: {
    activations:      ExperienceActivation[];
    guestJourney:     string[];
    techElements:     string[];
    surpriseElements: string[];
  };
  // Client + event metadata collected at form time
  client?:        ClientInfo;
  eventDate?:     string;
  venueByClient?: boolean;
  foodByClient?:  boolean;
  // Compliance checklist generated from eventType + eventDate
  compliance?:    import("./compliance").ComplianceItem[];
  // Captured when a client responds via the public /p/[id] share page
  clientResponse?: {
    action:     "APPROVED" | "CHANGES_REQUESTED";
    clientName: string;
    comment:    string;
    respondedAt: string; // ISO timestamp
  };
  // Regeneration history. The active version's content lives at top-level
  // (concept/budgetBreakdown/etc); `versions` holds historical snapshots.
  versions?:           ProposalVersionSnapshot[];
  regenerationsUsed?:  number;        // 0–5
  activeVersionLabel?: string;        // e.g. "v1", "v2"
  originalBrief?:      OriginalBrief; // captured on first generation, replayable
  // Batch generation — links proposals created together from the same brief
  batchId?:    string;  // shared UUID across all proposals in a batch
  batchIndex?: number;  // 0-based position within the batch (0, 1, 2)
  isLocked?:   boolean; // planner has locked this version from further edits
  // Pitch deck generated from this proposal
  pitchDeck?:  PitchDeck;
};

export type OriginalBrief = {
  selectedIdea: EventIdea;
  eventType:    string;
  budget:       number;
  location:     string;
  requirements: string;
  guestCount?:  number;
  clientCompanyName?: string;
  eventDate?:   string;
  venueByClient?: boolean;
  foodByClient?:  boolean;
};

export type ProposalVersionSnapshot = {
  label:     string;       // "v1", "v2"...
  createdAt: string;
  guidance?: string;       // free-text the user typed when regenerating into this version
  // AI-generated payload at the time this version was active.
  title:              string;
  concept:            ProposalConcept;
  budgetBreakdown:    BudgetLine[];
  timeline:           TimelinePhase[];
  vendors:            ProposalVendor[];
  riskFlags:          string[];
  tips:               string[];
  eventConcept?:      ProposalData["eventConcept"];
  visualDirection?:   ProposalData["visualDirection"];
  stageDesign?:       ProposalData["stageDesign"];
  decorPlan?:         ProposalData["decorPlan"];
  experienceElements?:ProposalData["experienceElements"];
};

// ── Pitch Deck ────────────────────────────────────────────────────────────────

export type PitchSlide = {
  title:         string;
  bullets:       string[];
  speaker_notes: string;
  image_prompt?: string;
};

export type PitchDeck = {
  deckId:     string;
  slides:     PitchSlide[];
  version:    number;
  tone:       string;
  slideCount: number;
  createdAt:  string;
  updatedAt:  string;
};

export const MAX_REGENERATIONS = 5;

export function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

export const STATUS_STYLES: Record<string, string> = {
  DRAFT:              "bg-gray-500/15 text-gray-400",
  GENERATED:          "bg-indigo-500/15 text-indigo-400",
  SAVED:              "bg-emerald-500/15 text-emerald-400",
  SENT:               "bg-purple-500/15 text-purple-400",
  APPROVED:           "bg-emerald-500/15 text-emerald-400",
  CHANGES_REQUESTED:  "bg-amber-500/15 text-amber-400",
};
