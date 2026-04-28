import type { ProposalData } from "@/lib/proposals";
import { formatINR } from "@/lib/proposals";

export const PITCH_DECK_TONES = [
  "Professional & Authoritative",
  "Warm & Collaborative",
  "Bold & Creative",
  "Elegant & Restrained",
] as const;
export type PitchDeckTone = typeof PITCH_DECK_TONES[number];

export const DEFAULT_SLIDE_COUNT = 11;
export const MIN_SLIDE_COUNT = 6;
export const MAX_SLIDE_COUNT = 15;

export const PITCH_DECK_SYSTEM_PROMPT = `You are an expert event pitch strategist with 15+ years of winning high-value event mandates for luxury Indian brands.

You have been given a fully developed event proposal. Your task is to convert it into a structured, high-conversion pitch deck that will help the event planner WIN this client.

Follow the storytelling arc: Problem → Big Idea → Experience → Execution → Value → Close.

Return ONLY valid JSON matching this exact shape:
{
  "slides": [
    {
      "title": "slide title",
      "bullets": ["bullet 1", "bullet 2", "bullet 3"],
      "speaker_notes": "...",
      "image_prompt": "optional DALL-E prompt"
    }
  ]
}

Rules:
- Use ONLY content from the provided proposal. Never invent facts or figures.
- Each slide must have 3–5 bullet points. Max 15 words per bullet.
- speaker_notes: 3–5 confident, client-facing sentences. Talk to the client, not about the event.
- image_prompt: only include on slides 1 (title), 3 (concept), and 5 (visual). Leave it out on data-heavy slides.
- No markdown, no bold markers, no lists inside string values.
- All currency in Indian Rupees (₹) formatted with Indian notation.
- Slide count: exactly as requested.`;

export function buildPitchDeckUserMessage(
  proposal: ProposalData,
  tone: string,
  slideCount: number,
): string {
  const budget = formatINR(proposal.budget);
  const lines: (string | null)[] = [
    `Generate a ${slideCount}-slide pitch deck in tone: "${tone}".`,
    ``,
    `== PROPOSAL DATA ==`,
    `Title: ${proposal.title}`,
    `Event type: ${proposal.eventType}`,
    `Location: ${proposal.location}`,
    `Budget: ${budget}`,
    proposal.client?.companyName ? `Client company: ${proposal.client.companyName}` : null,
    proposal.client?.name        ? `Client contact: ${proposal.client.name}`        : null,
    proposal.eventDate           ? `Event date: ${proposal.eventDate}`               : null,
    ``,
    `-- CONCEPT --`,
    `Title: ${proposal.concept?.title ?? proposal.title}`,
    proposal.concept?.tagline     ? `Tagline: ${proposal.concept.tagline}`      : null,
    proposal.concept?.description ? `Narrative: ${proposal.concept.description}` : null,
    proposal.concept?.theme       ? `Theme: ${proposal.concept.theme}`           : null,
    proposal.concept?.highlights?.length
      ? `Highlights:\n${proposal.concept.highlights.map((h) => `  - ${h}`).join("\n")}`
      : null,
    ``,
    proposal.eventConcept ? [
      `-- EVENT CONCEPT --`,
      `Theme: ${proposal.eventConcept.theme}`,
      `Tagline: ${proposal.eventConcept.tagline}`,
      `Storyline: ${proposal.eventConcept.storyline}`,
      `Emotional journey: ${proposal.eventConcept.emotionalJourney?.join(" → ")}`,
    ].join("\n") : null,
    ``,
    proposal.visualDirection ? [
      `-- VISUAL DIRECTION --`,
      `Aesthetic: ${proposal.visualDirection.overallAesthetic}`,
      `Lighting: ${proposal.visualDirection.lighting}`,
      `Palette: ${proposal.visualDirection.palette?.map((c) => `${c.name} (${c.hex}) for ${c.usage}`).join("; ")}`,
    ].join("\n") : null,
    ``,
    proposal.stageDesign ? [
      `-- STAGE DESIGN --`,
      `Layout: ${proposal.stageDesign.layout}`,
      `Entry experience: ${proposal.stageDesign.entryExperience}`,
      `Signature moment: ${proposal.stageDesign.signature}`,
      `Focal points: ${proposal.stageDesign.focalPoints?.join("; ")}`,
    ].join("\n") : null,
    ``,
    proposal.experienceElements ? [
      `-- EXPERIENCE ELEMENTS --`,
      `Guest journey: ${proposal.experienceElements.guestJourney?.join(" → ")}`,
      `Activations: ${proposal.experienceElements.activations?.map((a) => `${a.name} (${a.engagementType})`).join("; ")}`,
      `Tech elements: ${proposal.experienceElements.techElements?.join("; ")}`,
      `Surprise moments: ${proposal.experienceElements.surpriseElements?.join("; ")}`,
    ].join("\n") : null,
    ``,
    proposal.budgetBreakdown?.length ? [
      `-- BUDGET BREAKDOWN (${budget} total) --`,
      ...proposal.budgetBreakdown.map(
        (b) => `  ${b.category}: ${formatINR(b.amount)} (${b.percentage}%) — ${b.description}`
      ),
    ].join("\n") : null,
    ``,
    proposal.vendors?.length ? [
      `-- VENDORS --`,
      ...proposal.vendors.map((v) => `  ${v.category}: ${v.role} — ${formatINR(v.estimatedCost)}`),
    ].join("\n") : null,
    ``,
    proposal.timeline?.length ? [
      `-- TIMELINE --`,
      ...proposal.timeline.map((t) => `  ${t.phase} (${t.daysOut}): ${t.tasks.join("; ")}`),
    ].join("\n") : null,
    ``,
    proposal.tips?.length ? [
      `-- PRO TIPS / DIFFERENTIATORS --`,
      ...proposal.tips.map((t) => `  - ${t}`),
    ].join("\n") : null,
    ``,
    `Generate exactly ${slideCount} slides. The final slide must be a strong closing call-to-action.`,
  ];

  return lines.filter(Boolean).join("\n");
}
