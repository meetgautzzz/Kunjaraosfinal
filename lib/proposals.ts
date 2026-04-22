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
  status:          "DRAFT" | "GENERATED" | "SAVED" | "SENT";
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
};

export function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

export const STATUS_STYLES: Record<string, string> = {
  DRAFT:     "bg-gray-500/15 text-gray-400",
  GENERATED: "bg-indigo-500/15 text-indigo-400",
  SAVED:     "bg-emerald-500/15 text-emerald-400",
  SENT:      "bg-purple-500/15 text-purple-400",
};
