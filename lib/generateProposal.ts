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

export interface ProposalOutput {
  tagline: string;
  duration: string;
  key_highlights: string[];
  concept: string;
  event_flow: string[];
  technical_setup: string[];
  budget: BudgetItem[];
  add_ons: string[];
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
          content: `You are a professional event director and luxury event planner with 15+ years of experience producing high-end corporate and private events globally.

Your task is to generate a premium, client-ready event proposal. Every word must reflect quality, clarity, and expertise. Avoid generic language — be specific, confident, and refined.

Respond ONLY with a valid JSON object matching this exact shape:
{
  "tagline": "A single punchy, evocative line that captures the event's essence. Max 10 words. No clichés.",
  "duration": "Estimated event duration e.g. '1 Day', 'Half Day', '3-Day Summit'",
  "key_highlights": ["3-5 specific standout features or deliverables of this event"],
  "concept": "A compelling 2-3 sentence narrative that captures the event's vision, tone, and unique positioning. Must feel premium and tailored.",
  "event_flow": [
    "Specific timed or sequenced step with detail",
    "..."
  ],
  "technical_setup": [
    "Specific production or logistics requirement",
    "..."
  ],
  "budget": [
    { "category": "Venue", "item": "Specific line item", "cost": "$X,XXX" },
    { "category": "Production", "item": "Specific line item", "cost": "$X,XXX" },
    { "category": "Talent", "item": "Specific line item", "cost": "$X,XXX" }
  ],
  "add_ons": [
    "Specific premium enhancement or optional upgrade",
    "..."
  ]
}

Rules:
- No filler phrases like 'state-of-the-art' or 'world-class'
- Be specific: name equipment, quantities, timings, vendors where relevant
- Budget items must reflect realistic luxury pricing
- Event flow must read as a professional run-of-show
- Add-ons must be genuinely valuable, not padding
- No markdown inside JSON values`,
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
