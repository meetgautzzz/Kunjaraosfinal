// Event planner orchestrator.
// Gathers all enrichment context (knowledge base + DB venues + examples)
// and returns a structured context object ready to inject into AI prompts.

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildKnowledgeContext,
  detectCity,
  detectEventType,
  detectSeason,
  estimateBudgetBreakdown,
  CITY_BENCHMARKS,
  EVENT_TYPE_TEMPLATES,
  SEASONAL_FACTORS,
} from "@/lib/ai/eventPlanningKnowledge";
import {
  getVenueRecommendations,
  formatVenueRecommendationsForPrompt,
} from "@/lib/ai/venueRecommendations";

export type EventPlannerContext = {
  // Injected into AI prompt as structured text
  knowledgeBlock:  string;
  venueBlock:      string;
  // Structured data for validation / post-processing
  city:            string;
  eventTypeKey:    string;
  season:          string;
  budgetPerPerson: number;
  budgetTier:      "below-market" | "budget" | "mid-range" | "luxury";
  suggestedBreakdown: { category: string; amount: number; percentage: number; description: string }[];
  warnings:        string[];
};

export async function buildEventPlannerContext(args: {
  admin:      SupabaseClient;
  location:   string;
  budget:     number;
  eventType:  string;
  guestCount?: number;
  eventDate?:  string;
}): Promise<EventPlannerContext> {
  const guestCount = args.guestCount ?? 150;
  const city       = detectCity(args.location);
  const cityData   = CITY_BENCHMARKS[city];
  const evType     = detectEventType(args.eventType);
  const template   = EVENT_TYPE_TEMPLATES[evType];
  const season     = detectSeason(args.eventDate);
  const perPerson  = Math.round(args.budget / guestCount);

  const budgetTier: EventPlannerContext["budgetTier"] =
    perPerson < cityData.perPersonMin ? "below-market" :
    perPerson < cityData.perPersonMid ? "budget" :
    perPerson < cityData.perPersonLux ? "mid-range" : "luxury";

  const warnings: string[] = [];

  if (budgetTier === "below-market") {
    warnings.push(
      `Budget of ₹${perPerson.toLocaleString("en-IN")}/person is below the minimum viable threshold for ${cityData.displayName} ` +
      `(₹${cityData.perPersonMin.toLocaleString("en-IN")}/person). Consider reducing guest count or increasing budget. ` +
      `At current numbers, catering alone at ₹${cityData.cateringPlateMin.toLocaleString("en-IN")}/plate would consume ` +
      `${Math.round((cityData.cateringPlateMin * guestCount / args.budget) * 100)}% of total budget.`
    );
  }

  if (season === "peak" && budgetTier !== "luxury") {
    const peakData = SEASONAL_FACTORS.peak;
    warnings.push(
      `Peak season pricing applies (${peakData.priceMultiplier}× multiplier). Venue availability is ${peakData.venueAvailability}. ` +
      `Recommend locking venue and caterer immediately if event is within ${template.leadTimeWeeks.recommended} weeks.`
    );
  }

  if (args.eventDate) {
    const d = new Date(args.eventDate);
    if (!isNaN(d.getTime())) {
      const weeksOut = Math.round((d.getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000));
      if (weeksOut < template.leadTimeWeeks.minimum) {
        warnings.push(
          `Event is ${weeksOut} weeks away but this event type needs a minimum ${template.leadTimeWeeks.minimum}-week lead time. ` +
          `Accelerate vendor bookings immediately and expect premium pricing for last-minute availability.`
        );
      }
    }
  }

  const [venueMatches, suggestedBreakdown] = await Promise.all([
    getVenueRecommendations({ admin: args.admin, location: args.location, budget: args.budget, guestCount, eventType: args.eventType }),
    Promise.resolve(estimateBudgetBreakdown(args.budget, evType, guestCount, city)),
  ]);

  const knowledgeBlock = buildKnowledgeContext({
    location:   args.location,
    budget:     args.budget,
    eventType:  args.eventType,
    guestCount,
    eventDate:  args.eventDate,
  });

  const venueBlock = formatVenueRecommendationsForPrompt(venueMatches);

  return {
    knowledgeBlock,
    venueBlock,
    city:             cityData.displayName,
    eventTypeKey:     evType,
    season,
    budgetPerPerson:  perPerson,
    budgetTier,
    suggestedBreakdown,
    warnings,
  };
}

// Builds the full enriched user message combining knowledge + venues + brief.
export function buildEnrichedUserMessage(args: {
  context:      EventPlannerContext;
  baseMessage:  string;  // the original user message from buildExperienceUserMessage
}): string {
  const blocks: string[] = [];

  if (args.context.warnings.length > 0) {
    blocks.push(
      "⚠ PLANNER WARNINGS (address these in the proposal):\n" +
      args.context.warnings.map((w) => `  • ${w}`).join("\n")
    );
  }

  blocks.push(args.context.knowledgeBlock);

  if (args.context.venueBlock) {
    blocks.push(args.context.venueBlock);
  }

  blocks.push(args.baseMessage);

  return blocks.join("\n\n");
}
