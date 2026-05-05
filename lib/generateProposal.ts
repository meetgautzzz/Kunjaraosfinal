import OpenAI from "openai";
import { PRIMARY_MODEL } from "@/lib/ai/router";

export interface ProposalInput {
  eventType: string;
  budget: string;
  location: string;
  audience: string;
  theme: string;
  clientName?: string;
}

export interface BudgetItem {
  category: string;
  item: string;
  cost: string;
}

export interface VisualStage {
  theme: string;       // overall visual theme description
  stage: string;       // stage design details
  decor: string[];     // decor elements list
  references: string[]; // look & feel references
}

export interface ProposalOutput {
  tagline:        string;
  duration:       string;
  key_highlights: string[];

  // Section 1
  concept: string;

  // Section 2
  visual_stage: VisualStage;

  // Section 3
  activation: string[];

  // Section 4
  experience: string[];

  // Section 5
  timeline: string[];

  // Section 6
  vendors: { name: string; role: string }[];

  // Section 7
  budget: BudgetItem[];

  // Section 8
  risks: string[];

  // Section 9
  compliance: string[];

  // Backward-compat — proposals stored before this schema revision
  event_flow?:      string[];
  technical_setup?: string[];
  add_ons?:         string[];
}

export async function generateProposal(
  input: ProposalInput
): Promise<ProposalOutput> {
  const apiKey = process.env.OPENAI_API_KEY;
  console.log("[generateProposal] OPENAI_API_KEY length:", apiKey?.length ?? 0);
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set.");

  const client = new OpenAI({ apiKey });

  const { eventType, budget, location, audience, theme, clientName } = input;

  let response;
  try {
    response = await client.chat.completions.create({
      model: PRIMARY_MODEL,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `You are a senior event director with 15+ years producing high-end corporate and private events across India.

Generate a premium, client-ready event proposal. Be specific and concise. No filler phrases ('world-class', 'state-of-the-art', 'seamless'). Name real equipment, quantities, timings, and vendors where relevant.

Respond ONLY with a valid JSON object matching this exact shape:

{
  "tagline": "One punchy line capturing the event essence. Max 10 words.",
  "duration": "e.g. '1 Day', 'Half Day', '3-Day Summit'",
  "key_highlights": ["3-5 specific standout features or deliverables"],

  "concept": "2-3 sentences: the event's vision, tone, and unique positioning. Tailored and premium.",

  "visual_stage": {
    "theme": "1-2 sentences describing the overall visual theme and aesthetic direction.",
    "stage": "1-2 sentences on stage layout, dimensions, and design treatment.",
    "decor": ["Specific decor element with detail", "..."],
    "references": ["Look & feel reference or inspiration", "..."]
  },

  "activation": [
    "Specific audience engagement moment or activation with detail",
    "..."
  ],

  "experience": [
    "Specific attendee experience detail — food, hospitality, touchpoint, or moment",
    "..."
  ],

  "timeline": [
    "HH:MM — Activity with specific detail",
    "..."
  ],

  "vendors": [
    { "name": "Vendor/Category Name", "role": "Specific responsibility" },
    "..."
  ],

  "budget": [
    { "category": "Venue", "item": "Specific line item", "cost": "₹X,XX,XXX" },
    { "category": "Production", "item": "Specific line item", "cost": "₹X,XX,XXX" }
  ],

  "risks": [
    "Risk or practical tip with mitigation advice",
    "..."
  ],

  "compliance": [
    "Specific permit, license, or regulatory requirement for this event type and location",
    "..."
  ]
}

Rules:
- Budget costs must be in Indian Rupees (₹) with realistic local pricing
- Timeline must read as a professional run-of-show with specific timings
- Vendors section: 4-6 entries covering key categories (AV, catering, decor, etc.)
- Risks: 3-5 practical, specific risks with mitigations — not generic advice
- Compliance: 3-5 actual requirements relevant to the event type and Indian jurisdiction
- No markdown inside JSON values
- No placeholder text`,
        },
        {
          role: "user",
          content: `Generate a proposal for:
- Event Type: ${eventType}
- Budget: ${budget}
- Location: ${location}
- Audience: ${audience}
- Theme: ${theme}${clientName ? `\n- Client: ${clientName}` : ""}`,
        },
      ],
      response_format: { type: "json_object" },
    });
  } catch (err) {
    console.error("[generateProposal] OpenAI API error:", err);
    throw new Error(err instanceof Error ? err.message : "Kunjara Core request failed.");
  }

  if (!response.choices || response.choices.length === 0) {
    console.error("[generateProposal] No choices in response:", response);
    throw new Error("Invalid response from Kunjara Core — no output returned.");
  }

  const content = response.choices[0].message.content;
  if (!content) {
    console.error("[generateProposal] Empty content in response");
    throw new Error("Empty response from Kunjara Core.");
  }

  try {
    return JSON.parse(content) as ProposalOutput;
  } catch (err) {
    console.error("[generateProposal] Failed to parse JSON:", content, err);
    throw new Error("Kunjara Core returned invalid JSON.");
  }
}
