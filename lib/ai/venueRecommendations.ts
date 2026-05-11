// Venue recommendation engine.
// Queries the vendors table for venue-type entries, scores them against
// event parameters, and fills gaps with knowledge-based recommendations.

import type { SupabaseClient } from "@supabase/supabase-js";
import { detectCity, CITY_BENCHMARKS, type CityCode } from "@/lib/ai/eventPlanningKnowledge";

export type VenueMatch = {
  source:       "database" | "knowledge";
  name:         string;
  location:     string;
  capacityHint: string;
  priceHint:    string;
  type:         string;
  pros:         string[];
  cons:         string[];
  contact?:     string;
  matchScore:   number;  // 0-100
  notes:        string;
};

// Knowledge-based venue recommendations when DB has no venue data.
// Structured by city; these are real venue categories the AI can expand on.
const KNOWLEDGE_VENUES: Record<CityCode, {
  type: string; nameExample: string; capacityRange: string; priceRange: string;
  pros: string[]; cons: string[];
}[]> = {
  mumbai: [
    { type: "5-Star Hotel Banquet", nameExample: "Taj Lands End / ITC Maratha / JW Marriott Juhu", capacityRange: "100-1500", priceRange: "₹2.5L-15L/event", pros: ["All-inclusive packages", "In-house F&B quality", "Valet + parking"], cons: ["Strictly no outside catering", "Alcohol at hotel rates (2-3x market)"] },
    { type: "Standalone Banquet Hall", nameExample: "Mangal Murti / Kohinoor / Celebrations Club Andheri", capacityRange: "100-800", priceRange: "₹80K-4L/event", pros: ["Outside catering allowed", "Flexible alcohol policy", "Lower per-plate cost"], cons: ["Parking limited in suburban areas", "Variable quality"] },
    { type: "Rooftop / Terrace", nameExample: "AER at Four Seasons / Asilo at St Regis", capacityRange: "50-200", priceRange: "₹1.5L-8L", pros: ["Skyline backdrop", "Premium ambiance"], cons: ["Weather-dependent", "Sound restrictions post-10PM", "10% surcharge Nov-Feb"] },
    { type: "Garden / Farmhouse", nameExample: "Aarey Colony / Thane Creek Flamingo Sanctuary perimeter", capacityRange: "100-500", priceRange: "₹1.5L-6L", pros: ["Outdoor setting", "Customisable"], cons: ["Monsoon risk Jun-Sep", "Logistics challenge"] },
  ],
  delhi: [
    { type: "Heritage Farmhouse", nameExample: "Sunder Nursery / Chattarpur farmhouses / Saidulajab", capacityRange: "200-2000", priceRange: "₹2L-20L/event", pros: ["Sprawling grounds", "Customisable décor", "Outside vendors OK"], cons: ["Distance from central Delhi", "Generator costs extra", "Noise limits 10PM"] },
    { type: "5-Star Hotel", nameExample: "The Leela Palace / Hyatt Regency / ITC Maurya", capacityRange: "100-3000", priceRange: "₹3L-25L", pros: ["Impeccable service", "All logistics handled"], cons: ["No outside catering", "Premium bar pricing"] },
    { type: "Palace / Haveli", nameExample: "Neemrana Fort Palace (Rajasthan day-trip) / Lodi Garden Resort", capacityRange: "50-400", priceRange: "₹3L-20L+", pros: ["Heritage backdrop", "Photogenic", "Unique experience"], cons: ["Limited parking", "Remote locations need transport plan"] },
    { type: "Convention Centre", nameExample: "Vigyan Bhavan / Siri Fort / India Habitat Centre", capacityRange: "200-5000", priceRange: "₹2L-10L", pros: ["Large capacity", "AV infrastructure", "Ample parking"], cons: ["Government booking process slow", "Generic look"] },
  ],
  bangalore: [
    { type: "Tech Park / Corporate Campus", nameExample: "Leela Galleria / Embassy GolfLinks", capacityRange: "100-1000", priceRange: "₹1.5L-8L", pros: ["Modern infrastructure", "Parking", "AV-ready"], cons: ["Strict security protocols", "Limited weekend access"] },
    { type: "Resort (Outskirts)", nameExample: "Eagleton Golf Resort / Clarks Exotica / Club Cabana", capacityRange: "50-500", priceRange: "₹2L-10L", pros: ["Activity options", "Overnight stay", "Outdoor spaces"], cons: ["30-60 mins from city", "Peak season premium"] },
    { type: "5-Star Hotel", nameExample: "JW Marriott / Conrad / ITC Gardenia", capacityRange: "100-1500", priceRange: "₹2L-12L", pros: ["Quality assured", "Easy access"], cons: ["Inflexible vendor policy"] },
    { type: "Standalone Banquet", nameExample: "Woodlands / Lalitha Mahal", capacityRange: "100-600", priceRange: "₹60K-3L", pros: ["Budget-friendly", "South Indian cuisine specialist"], cons: ["Limited decor flexibility"] },
  ],
  hyderabad: [
    { type: "Function Hall", nameExample: "HICC / Novotel HICC / Taj Banjara", capacityRange: "200-5000", priceRange: "₹1.5L-15L", pros: ["Large capacity", "Well-equipped"], cons: ["Parking can be challenging at HICC during conventions"] },
    { type: "Farmhouse / Lawn", nameExample: "Shamirpet farms / Genome Valley area", capacityRange: "100-1000", priceRange: "₹1L-6L", pros: ["Spacious", "Customisable", "Cost-effective"], cons: ["Distance from city", "Requires generator backup"] },
    { type: "Heritage", nameExample: "Chowmahalla Palace (for shoots) / Falaknuma Palace (Taj)", capacityRange: "50-500", priceRange: "₹3L-25L+", pros: ["Iconic backdrop", "Unique"], cons: ["Strict rules on décor", "Limited catering flexibility"] },
  ],
  pune: [
    { type: "Hotel Banquet", nameExample: "JW Marriott Pune / Westin Pune / Novotel", capacityRange: "100-1200", priceRange: "₹2L-10L", pros: ["Reliable quality", "Parking"], cons: ["Peak season scarcity"] },
    { type: "Resort (Expressway)", nameExample: "Della Adventure / Fariyas Resort Lonavala / Della Resorts", capacityRange: "50-500", priceRange: "₹2.5L-12L", pros: ["Activity-focused", "Overnight option", "Scenic"], cons: ["90 mins from Pune city", "Premium during weekends"] },
    { type: "Banquet Hall", nameExample: "Chitale Bandhu / Celebration Mall / Pride Hotel", capacityRange: "100-600", priceRange: "₹70K-3L", pros: ["Value for money", "Marathi cuisine specialists"], cons: ["Basic infrastructure"] },
  ],
  chennai: [
    { type: "Marriage Hall", nameExample: "Narada Gana Sabha / Ramaniyam Convention / Sri Devi Mahal", capacityRange: "100-800", priceRange: "₹50K-3L", pros: ["South Indian cuisine built-in", "Affordable"], cons: ["Traditional look; limited contemporary décor"] },
    { type: "5-Star Hotel", nameExample: "ITC Grand Chola / Taj Coromandel / Leela Palace", capacityRange: "100-2000", priceRange: "₹2L-15L", pros: ["Quality guaranteed", "Veg+non-veg"], cons: ["Alcohol permit complexity in Tamil Nadu"] },
    { type: "Beach Resort", nameExample: "Fisherman's Cove / Radisson Blu Kalpakkam", capacityRange: "50-400", priceRange: "₹2L-8L", pros: ["Sea backdrop", "Unique"], cons: ["40-60 mins from city", "CRZ rules limit certain structures"] },
  ],
  kolkata: [
    { type: "Wedding Venue", nameExample: "Taj Bengal / ITC Sonar / Swissôtel", capacityRange: "100-1500", priceRange: "₹2L-12L", pros: ["Premium quality", "Fish dishes a speciality"], cons: ["Peak demand Durga Puja season: not available Oct"] },
    { type: "Open-Air / Tent House", nameExample: "Eco Park tented venues / Milan Mela grounds", capacityRange: "200-3000", priceRange: "₹1L-8L", pros: ["Large capacity", "Flexible"], cons: ["Weather risk", "Requires generator"] },
  ],
  ahmedabad: [
    { type: "Convention / Banquet", nameExample: "Hyatt Regency / Marriott Ahmedabad / WelcomHotel", capacityRange: "100-1200", priceRange: "₹1.5L-8L", pros: ["Vegetarian cuisine excellence", "Modern infra"], cons: ["Alcohol restrictions — dry venue often"] },
    { type: "Garden / Lawn", nameExample: "Adalaj stepwell vicinity / Indroda Park area", capacityRange: "100-1000", priceRange: "₹70K-4L", pros: ["Heritage backdrop", "Outdoor"], cons: ["Summer heat extreme (Apr-Jun)", "Generator must"] },
  ],
  tier2: [
    { type: "Local Banquet Hall", nameExample: "Best local banquet hall (city-specific)", capacityRange: "100-500", priceRange: "₹25K-1.5L", pros: ["Most affordable", "Local network"], cons: ["Limited AV", "Basic infrastructure; supplement with rentals"] },
    { type: "Hotel Banquet", nameExample: "Best 4-star property in city", capacityRange: "50-400", priceRange: "₹70K-3L", pros: ["Reliable"], cons: ["Lower capacity"] },
  ],
};

function scoreVenueFromDB(vendor: {
  name: string;
  city?: string | null;
  notes?: string | null;
  events_done?: number | null;
}, budget: number, guestCount: number, city: CityCode): number {
  let score = 50;

  // City match
  const vendorCity = (vendor.city ?? "").toLowerCase();
  const targetCity = CITY_BENCHMARKS[city].displayName.toLowerCase().split(" ")[0];
  if (vendorCity.includes(targetCity) || targetCity.includes(vendorCity)) score += 25;
  else if (vendorCity) score -= 10;

  // Experience
  if ((vendor.events_done ?? 0) > 20) score += 10;
  else if ((vendor.events_done ?? 0) > 5) score += 5;

  // Notes keyword match
  const notes = (vendor.notes ?? "").toLowerCase();
  if (notes.includes("venue") || notes.includes("banquet") || notes.includes("hall") || notes.includes("farm")) score += 10;

  return Math.min(100, Math.max(0, score));
}

export async function getVenueRecommendations(args: {
  admin: SupabaseClient;
  location: string;
  budget: number;
  guestCount: number;
  eventType: string;
}): Promise<VenueMatch[]> {
  const city = detectCity(args.location);

  // Query vendors table for anything venue-related
  const { data: dbVendors } = await args.admin
    .from("vendors")
    .select("id, name, category, city, notes, events_done, active")
    .or("category.ilike.%venue%,category.ilike.%banquet%,category.ilike.%hall%,category.ilike.%resort%,category.ilike.%hotel%,category.ilike.%farmhouse%")
    .eq("active", true)
    .limit(20);

  const results: VenueMatch[] = [];

  // Score and include DB venues
  for (const v of dbVendors ?? []) {
    const score = scoreVenueFromDB(v, args.budget, args.guestCount, city);
    if (score >= 40) {
      results.push({
        source:       "database",
        name:         v.name,
        location:     v.city ?? args.location,
        capacityHint: `Verified vendor in your database`,
        priceHint:    `Contact for pricing`,
        type:         v.category ?? "Venue",
        pros:         ["Already in your vendor network", "Can get preferential pricing"],
        cons:         [],
        matchScore:   score,
        notes:        v.notes ?? "",
      });
    }
  }

  // Fill with knowledge-based recommendations
  const knowledgeVenues = KNOWLEDGE_VENUES[city] ?? KNOWLEDGE_VENUES.tier2;
  for (const kv of knowledgeVenues) {
    results.push({
      source:       "knowledge",
      name:         kv.nameExample,
      location:     CITY_BENCHMARKS[city].displayName,
      capacityHint: kv.capacityRange,
      priceHint:    kv.priceRange,
      type:         kv.type,
      pros:         kv.pros,
      cons:         kv.cons,
      matchScore:   70,
      notes:        `Knowledge-based recommendation for ${CITY_BENCHMARKS[city].displayName} ${kv.type}`,
    });
  }

  // Sort: DB matches first, then by score
  results.sort((a, b) => {
    if (a.source !== b.source) return a.source === "database" ? -1 : 1;
    return b.matchScore - a.matchScore;
  });

  return results.slice(0, 5);
}

export function formatVenueRecommendationsForPrompt(venues: VenueMatch[]): string {
  if (venues.length === 0) return "";
  return [
    "VENUE RECOMMENDATIONS (from your vendor database + market knowledge):",
    ...venues.map((v, i) => [
      `  ${i + 1}. ${v.name} [${v.source === "database" ? "YOUR NETWORK" : "MARKET KNOWLEDGE"}]`,
      `     Type: ${v.type} | Capacity: ${v.capacityHint} | Price: ${v.priceHint}`,
      v.pros.length ? `     Pros: ${v.pros.join("; ")}` : null,
      v.cons.length ? `     Cons: ${v.cons.join("; ")}` : null,
      v.notes ? `     Note: ${v.notes}` : null,
    ].filter(Boolean).join("\n")),
  ].join("\n");
}
