// Structured Indian event-planning knowledge base.
// Injected into AI context at prompt-build time — gives the model
// specific, realistic numbers instead of hallucinated estimates.
// All prices are INR. Ranges represent standard market rate (2024-25).

// ── City benchmarks ────────────────────────────────────────────────────────────

export type CityCode = "mumbai" | "delhi" | "bangalore" | "hyderabad" | "pune" | "chennai" | "kolkata" | "ahmedabad" | "tier2";

export const CITY_BENCHMARKS: Record<CityCode, {
  displayName:        string;
  perPersonMin:       number;  // minimum viable event cost/person
  perPersonMid:       number;  // typical quality event cost/person
  perPersonLux:       number;  // luxury tier cost/person
  cateringPlateMin:   number;
  cateringPlateMid:   number;
  cateringPlateLux:   number;
  venueHireMin:       number;  // per-event hall hire (not per person)
  venueHireMid:       number;
  venueHireLux:       number;
  decorMin:           number;
  decorMid:           number;
  decorLux:           number;
  photographyMin:     number;
  photographyMid:     number;
  seasonalPeakMonths: number[];  // 1-12
  notes:              string;
}> = {
  mumbai: {
    displayName: "Mumbai",
    perPersonMin: 2500, perPersonMid: 4000, perPersonLux: 8000,
    cateringPlateMin: 800, cateringPlateMid: 1600, cateringPlateLux: 3500,
    venueHireMin: 80_000, venueHireMid: 250_000, venueHireLux: 800_000,
    decorMin: 50_000, decorMid: 200_000, decorLux: 1_000_000,
    photographyMin: 40_000, photographyMid: 90_000,
    seasonalPeakMonths: [11, 12, 1, 2],
    notes: "Premium pricing; demand spikes Nov-Feb. South Mumbai and Bandra venues command a 30-40% premium over suburbs. GST at 18% on banquet halls >₹7,500/day.",
  },
  delhi: {
    displayName: "Delhi / NCR",
    perPersonMin: 2000, perPersonMid: 3500, perPersonLux: 7000,
    cateringPlateMin: 700, cateringPlateMid: 1400, cateringPlateLux: 3000,
    venueHireMin: 70_000, venueHireMid: 200_000, venueHireLux: 700_000,
    decorMin: 40_000, decorMid: 180_000, decorLux: 900_000,
    photographyMin: 35_000, photographyMid: 80_000,
    seasonalPeakMonths: [11, 12, 1, 2, 3],
    notes: "Wedding capital of India. Gurgaon and Noida add 10-15% for logistics. Heritage venues (farmhouses, palaces) carry 25-50% premium. Cold weather Oct-Feb affects outdoor events.",
  },
  bangalore: {
    displayName: "Bangalore",
    perPersonMin: 2000, perPersonMid: 3500, perPersonLux: 6500,
    cateringPlateMin: 650, cateringPlateMid: 1300, cateringPlateLux: 2800,
    venueHireMin: 60_000, venueHireMid: 180_000, venueHireLux: 600_000,
    decorMin: 35_000, decorMid: 160_000, decorLux: 800_000,
    photographyMin: 30_000, photographyMid: 75_000,
    seasonalPeakMonths: [12, 1, 2, 10, 11],
    notes: "Tech-savvy clientele; hybrid events popular. Monsoon Jun-Sep affects outdoor venues. Whitefield and Koramangala corridors have best venue density. Alcohol service requires state excise licence.",
  },
  hyderabad: {
    displayName: "Hyderabad",
    perPersonMin: 1500, perPersonMid: 3000, perPersonLux: 6000,
    cateringPlateMin: 600, cateringPlateMid: 1200, cateringPlateLux: 2500,
    venueHireMin: 50_000, venueHireMid: 150_000, venueHireLux: 500_000,
    decorMin: 30_000, decorMid: 140_000, decorLux: 700_000,
    photographyMin: 25_000, photographyMid: 65_000,
    seasonalPeakMonths: [11, 12, 1, 2],
    notes: "Strong Biryani/Mughlai preference; non-veg heavy. HICC/Novotel/ITC Kohenur for large corporate. Old City heritage venues for weddings. Summer May-Jun very hot — indoor preferred.",
  },
  pune: {
    displayName: "Pune",
    perPersonMin: 1800, perPersonMid: 3200, perPersonLux: 6000,
    cateringPlateMin: 650, cateringPlateMid: 1300, cateringPlateLux: 2600,
    venueHireMin: 55_000, venueHireMid: 160_000, venueHireLux: 550_000,
    decorMin: 30_000, decorMid: 150_000, decorLux: 750_000,
    photographyMin: 28_000, photographyMid: 70_000,
    seasonalPeakMonths: [11, 12, 1, 2, 3],
    notes: "Strong corporate event market. Pleasant climate most of year. Resorts along Expressway (Lonavala direction) popular for off-sites. Ganesh Chaturthi (Aug-Sep) blocks most venues.",
  },
  chennai: {
    displayName: "Chennai",
    perPersonMin: 1800, perPersonMid: 3000, perPersonLux: 5500,
    cateringPlateMin: 600, cateringPlateMid: 1200, cateringPlateLux: 2400,
    venueHireMin: 50_000, venueHireMid: 150_000, venueHireLux: 500_000,
    decorMin: 30_000, decorMid: 140_000, decorLux: 650_000,
    photographyMin: 25_000, photographyMid: 65_000,
    seasonalPeakMonths: [12, 1, 2, 3, 4],
    notes: "Strong vegetarian preference (60-70% of events). Traditional temple/marriage hall circuit. Dry state restrictions on alcohol (need permit). Tamil New Year (Apr) and Pongal (Jan) are busy.",
  },
  kolkata: {
    displayName: "Kolkata",
    perPersonMin: 1500, perPersonMid: 2800, perPersonLux: 5500,
    cateringPlateMin: 550, cateringPlateMid: 1100, cateringPlateLux: 2200,
    venueHireMin: 40_000, venueHireMid: 130_000, venueHireLux: 450_000,
    decorMin: 25_000, decorMid: 120_000, decorLux: 600_000,
    photographyMin: 22_000, photographyMid: 60_000,
    seasonalPeakMonths: [10, 11, 12, 1, 2],
    notes: "Durga Puja (Oct) shuts down entire vendor market. Strong fish/non-veg demand. Tent house culture strong for outdoor events. Victoria Memorial / Rabindra Sarobar for high-profile shoots.",
  },
  ahmedabad: {
    displayName: "Ahmedabad",
    perPersonMin: 1400, perPersonMid: 2500, perPersonLux: 4500,
    cateringPlateMin: 500, cateringPlateMid: 1000, cateringPlateLux: 2000,
    venueHireMin: 35_000, venueHireMid: 120_000, venueHireLux: 400_000,
    decorMin: 25_000, decorMid: 110_000, decorLux: 550_000,
    photographyMin: 20_000, photographyMid: 55_000,
    seasonalPeakMonths: [11, 12, 1, 2, 3],
    notes: "Predominantly vegetarian (Jain-friendly menus essential). No alcohol at most venues — get client confirmation. Navratri (Oct) is peak garba season — entertainment bookings go 3x. GIFT City corporate venue hub.",
  },
  tier2: {
    displayName: "Tier-2 City",
    perPersonMin: 1000, perPersonMid: 2000, perPersonLux: 3500,
    cateringPlateMin: 400, cateringPlateMid: 900, cateringPlateLux: 1800,
    venueHireMin: 25_000, venueHireMid: 80_000, venueHireLux: 250_000,
    decorMin: 15_000, decorMid: 75_000, decorLux: 350_000,
    photographyMin: 15_000, photographyMid: 45_000,
    seasonalPeakMonths: [11, 12, 1, 2],
    notes: "Lower vendor density; book early. Logistics often need city-import. Local catering quality variable — specify menu standards in contract. Power backup essential.",
  },
};

// ── Vendor category benchmarks ──────────────────────────────────────────────────

export type VendorCategory =
  | "catering" | "decor" | "entertainment" | "photography"
  | "av_technology" | "logistics" | "flowers" | "invitations"
  | "gifting" | "security" | "valet" | "bar_service";

export const VENDOR_BENCHMARKS: Record<VendorCategory, {
  label:       string;
  description: string;
  priceMin:    number;
  priceMid:    number;
  priceLux:    number;
  unit:        string;
  typicalBudgetPct: { wedding: number; corporate: number; birthday: number; launch: number };
  keyConsiderations: string[];
  redFlags:    string[];
}> = {
  catering: {
    label: "Catering & F&B",
    description: "Per-plate cost covers raw ingredients, cooking, service staff, and basic crockery. Excludes bar.",
    priceMin: 500, priceMid: 1500, priceLux: 4000, unit: "per plate",
    typicalBudgetPct: { wedding: 35, corporate: 30, birthday: 28, launch: 25 },
    keyConsiderations: [
      "Confirm veg/non-veg ratio upfront — typically 60:40 in North India, 80:20 in South",
      "Jain/Halal/Vegan options need separate prep kitchens — add ₹100-200/plate",
      "Buffet service needs 1 staff per 25 guests; plated service 1 per 15",
      "Tasting session mandatory before finalising — include in contract",
      "Service charge (10%) + GST (5%) adds ~15% to quoted plate cost",
    ],
    redFlags: [
      "No written menu lock-in",
      "Caterer refuses kitchen inspection",
      "No food safety certification (FSSAI)",
      "Payment 100% advance with no contract",
    ],
  },
  decor: {
    label: "Decor & Theme Design",
    description: "Includes concept design, fabrication, installation, and breakdown. Does not include flowers (separate line).",
    priceMin: 20_000, priceMid: 200_000, priceLux: 1_500_000, unit: "per event",
    typicalBudgetPct: { wedding: 18, corporate: 12, birthday: 20, launch: 22 },
    keyConsiderations: [
      "Setup time: minimum 6 hours for complex installs — book venue from morning",
      "Breakdown adds 3-4 hours after event — factor into venue booking window",
      "Fabric draping, LED screens, and custom structures quoted separately",
      "Ceiling décor requires venue permission and rigging points check",
      "Eco-friendly/rental decor can save 20-30% vs custom fabrication",
    ],
    redFlags: [
      "No 3D mock-up or mood board before payment",
      "Suspiciously low quote with vague scope",
      "No breakdown/damage liability clause",
    ],
  },
  entertainment: {
    label: "Entertainment",
    description: "Performers, DJ, live band, anchoring, and interactive experiences.",
    priceMin: 10_000, priceMid: 80_000, priceLux: 500_000, unit: "per event",
    typicalBudgetPct: { wedding: 10, corporate: 15, birthday: 20, launch: 18 },
    keyConsiderations: [
      "DJ: 4-hour set standard; additional hours billed at ₹5K-15K/hr",
      "Live bands: 2-hour set typical; travel + accommodation extra for out-of-city",
      "Celebrity anchors: minimum 2-week advance booking; exclusivity clauses common",
      "Fire/pyro acts: NOC from local fire department required",
      "Noise permits for outdoor events after 10 PM — venue must arrange",
    ],
    redFlags: [
      "DJ without backup equipment",
      "No sound system specs in quote",
      "Performer contracts without appearance guarantees",
    ],
  },
  photography: {
    label: "Photography & Videography",
    description: "Photo + video coverage. Albums, edited reels, and drone footage are add-ons.",
    priceMin: 25_000, priceMid: 90_000, priceLux: 350_000, unit: "per event",
    typicalBudgetPct: { wedding: 10, corporate: 8, birthday: 8, launch: 10 },
    keyConsiderations: [
      "Minimum team: 1 photographer + 1 videographer for events >100 guests",
      "Edited delivery: 4-6 weeks typical; express (2 weeks) costs 20-30% more",
      "Drone requires DGCA-authorised pilot + airspace clearance (book 2+ weeks ahead)",
      "Raw files rarely included — specify in contract",
      "4K video and Instagram reels edit now standard in mid/premium packages",
    ],
    redFlags: [
      "No portfolio of similar events",
      "Delivery timelines not in contract",
      "Unclear copyright ownership of images",
    ],
  },
  av_technology: {
    label: "AV & Technology",
    description: "Sound system, LED screens, lighting rigs, live streaming, and hybrid event tech.",
    priceMin: 30_000, priceMid: 150_000, priceLux: 600_000, unit: "per event",
    typicalBudgetPct: { wedding: 8, corporate: 18, birthday: 6, launch: 20 },
    keyConsiderations: [
      "Line array speakers for halls >500 pax; column speakers for smaller",
      "LED wall: P3.9 pixel pitch for close-view stages; P6 fine for 10m+ audiences",
      "Live streaming requires dedicated bandwidth — confirm venue internet",
      "Operator on-site mandatory for full duration; standby engineer for big events",
      "Power load: 15 KVA minimum for basic AV; 100 KVA+ for large productions",
    ],
    redFlags: [
      "No site visit before quote",
      "Single-point-of-failure speaker setup without backup",
      "No operator included in package",
    ],
  },
  logistics: {
    label: "Logistics & Operations",
    description: "Venue management, manpower, setup crew, security, and on-day operations.",
    priceMin: 15_000, priceMid: 80_000, priceLux: 300_000, unit: "per event",
    typicalBudgetPct: { wedding: 6, corporate: 8, birthday: 5, launch: 7 },
    keyConsiderations: [
      "1 event manager per 100 guests as baseline staffing",
      "Walkie-talkie radios for team of 10+; assign colour-coded roles",
      "Crowd management plan mandatory for 500+ guests",
      "First-aid station required for 300+ guests",
      "Waste management contract (especially for outdoor events) avoids municipality fines",
    ],
    redFlags: [
      "No run-of-show document",
      "Event manager handling multiple events same day",
    ],
  },
  flowers: {
    label: "Floral Design",
    description: "Fresh flowers, artificial flowers, and green installations.",
    priceMin: 8_000, priceMid: 60_000, priceLux: 500_000, unit: "per event",
    typicalBudgetPct: { wedding: 5, corporate: 3, birthday: 6, launch: 4 },
    keyConsiderations: [
      "Import flowers (roses, orchids, lilies) cost 3-5x local seasonal flowers",
      "Best seasons for Indian flowers: Jan-Mar, Oct-Nov",
      "Delivery must be within 4 hours of event start to maintain freshness",
      "Marigold (genda) most cost-effective for traditional/ethnic themes",
    ],
    redFlags: [
      "No refrigeration/cold chain for delicate flowers",
      "Flowers quoted without delivery and installation",
    ],
  },
  invitations: {
    label: "Invitations & Stationery",
    description: "Printed invites, digital e-invites, menus, place cards, and signage.",
    priceMin: 5_000, priceMid: 30_000, priceLux: 150_000, unit: "per event",
    typicalBudgetPct: { wedding: 2, corporate: 2, birthday: 2, launch: 3 },
    keyConsiderations: [
      "Luxury box invites: ₹300-1500 each; digital WhatsApp invites: ₹50-150/design",
      "Printing turnaround: 7-10 days for standard, 3-4 days for express (+30%)",
      "Event signage (standees, banners, directional signs) often missed in budget",
    ],
    redFlags: ["No proof approval before printing bulk order"],
  },
  gifting: {
    label: "Guest Gifting & Favours",
    description: "Branded merchandise, return gifts, and hampers.",
    priceMin: 3_000, priceMid: 25_000, priceLux: 200_000, unit: "per event",
    typicalBudgetPct: { wedding: 3, corporate: 5, birthday: 3, launch: 4 },
    keyConsiderations: [
      "Per-gift budget: ₹150-500 (budget), ₹500-2000 (mid), ₹2000+ (premium)",
      "Corporate: branded merchandise, power banks, eco-products popular",
      "Weddings: dry fruits, sweets, silver artefacts, or experiential vouchers",
      "Minimum order quantities for custom products: typically 100+ units",
    ],
    redFlags: [],
  },
  security: {
    label: "Security & Crowd Management",
    description: "Trained security personnel, access control, and emergency response.",
    priceMin: 5_000, priceMid: 20_000, priceLux: 80_000, unit: "per event",
    typicalBudgetPct: { wedding: 1, corporate: 2, birthday: 1, launch: 2 },
    keyConsiderations: [
      "Minimum 1 guard per 100 guests; additional for VIP zones",
      "CCTV coverage recommended for 500+ guests",
      "Background-verified staff only; request agency certification",
    ],
    redFlags: ["Agency with no police verification records"],
  },
  valet: {
    label: "Valet Parking",
    description: "Valet service and parking management.",
    priceMin: 8_000, priceMid: 25_000, priceLux: 80_000, unit: "per event",
    typicalBudgetPct: { wedding: 2, corporate: 1, birthday: 1, launch: 1 },
    keyConsiderations: [
      "1 valet per 15-20 vehicles; peak arrival surge needs 2x staff",
      "Parking layout planning required: minimum 3 sqm per car",
      "Key tags + receipt system mandatory; damage liability in contract",
    ],
    redFlags: ["No insurance for vehicle damage"],
  },
  bar_service: {
    label: "Bar & Beverages",
    description: "Open bar, IMFL, beer, soft drinks, mocktails. Excludes catering.",
    priceMin: 200, priceMid: 600, priceLux: 1500, unit: "per person",
    typicalBudgetPct: { wedding: 5, corporate: 4, birthday: 6, launch: 3 },
    keyConsiderations: [
      "Alcohol service requires state excise permit (venue typically arranges)",
      "Standard consumption: 2 drinks/hr for first 2 hrs, 1/hr thereafter",
      "Dry events (no alcohol): replace with premium mocktail bar (₹150-300/person)",
      "Bartender: 1 per 50 guests for smooth service",
    ],
    redFlags: ["Venue claiming to include alcohol in F&B quote without liquor permit"],
  },
};

// ── Event type templates ────────────────────────────────────────────────────────

export type EventTypeKey =
  | "wedding" | "corporate_conference" | "corporate_gala" | "product_launch"
  | "birthday" | "engagement" | "anniversary" | "college_fest"
  | "team_building" | "charity_fundraiser" | "festival_celebration";

export const EVENT_TYPE_TEMPLATES: Record<EventTypeKey, {
  label:                  string;
  typicalDuration:        string;
  typicalGuestRange:      string;
  budgetAllocation:       Record<string, number>;  // % of total budget
  keyMilestones:          string[];
  mustHaves:              string[];
  commonMistakes:         string[];
  culturalConsiderations: string[];
  leadTimeWeeks:          { minimum: number; recommended: number };
}> = {
  wedding: {
    label: "Indian Wedding",
    typicalDuration: "1-3 days (mehendi/sangeet + wedding + reception)",
    typicalGuestRange: "100-1000+",
    budgetAllocation: { venue: 15, catering: 35, decor: 18, photography: 10, entertainment: 8, logistics: 5, flowers: 5, invitations: 2, gifting: 2 },
    keyMilestones: [
      "Venue booking (12+ months out for premium venues)",
      "Caterer lock-in with tasting (6 months out)",
      "Decor concept approval (4 months out)",
      "Outfit trials and photography brief (2 months out)",
      "Vendor run-of-show meeting (2 weeks out)",
      "Final headcount to caterer (72 hours out)",
    ],
    mustHaves: [
      "Mandap/stage for ceremony — full custom or rental",
      "Separate mehendi, sangeet, and wedding themes if multi-day",
      "Guest accommodation block if out-of-town attendance >30%",
      "Pandit/priest coordination with venue timing",
      "Day-of coordinator separate from overall planner",
    ],
    commonMistakes: [
      "Underestimating catering headcount (add 10-15% buffer)",
      "Single photographer for 300+ guest events",
      "Not confirming generator backup with venue",
      "Ignoring sunset time for outdoor ceremonies",
      "No food for vendor staff (12-14 people on-site)",
    ],
    culturalConsiderations: [
      "Auspicious date: match with family astrologer; avoid Shraadh period (Sept-Oct)",
      "North Indian weddings: pheras at night; South Indian: morning ceremonies",
      "Muslim weddings: Nikah timing, separate gender seating often preferred",
      "Christian weddings: church booking separate from reception venue",
    ],
    leadTimeWeeks: { minimum: 16, recommended: 52 },
  },
  corporate_conference: {
    label: "Corporate Conference / Summit",
    typicalDuration: "Half day to 3 days",
    typicalGuestRange: "50-2000",
    budgetAllocation: { venue: 25, catering: 20, av_technology: 25, logistics: 10, photography: 5, gifting: 5, invitations: 5, decor: 5 },
    keyMilestones: [
      "Venue RFP and site visits (8 weeks out)",
      "Speaker confirmations and AV brief (6 weeks out)",
      "Registration platform live (4 weeks out)",
      "Printed materials final (2 weeks out)",
      "Tech rehearsal with speakers (day before)",
      "Live stream test (morning of event)",
    ],
    mustHaves: [
      "Dedicated AV operator for full duration",
      "High-speed wired internet (WiFi unreliable for streaming)",
      "Breakout rooms for workshops if multi-track",
      "Speaker green room with catering",
      "Live captioning or translation if multi-lingual audience",
    ],
    commonMistakes: [
      "Underestimating AV complexity — always do site survey",
      "No backup internet connection",
      "Seating too close together — 18\" minimum per person",
      "Missing Q&A microphone logistics (roving mics, moderator)",
    ],
    culturalConsiderations: [
      "Start times: 9:30 AM preferred; avoid Friday afternoons (Juma prayers)",
      "Dietary: always offer Jain/vegan options; label clearly",
      "Name badge protocol: job title matters in Indian corporate culture",
    ],
    leadTimeWeeks: { minimum: 8, recommended: 16 },
  },
  corporate_gala: {
    label: "Corporate Gala / Awards Night",
    typicalDuration: "4-6 hours (evening)",
    typicalGuestRange: "100-1000",
    budgetAllocation: { venue: 20, catering: 28, decor: 20, entertainment: 12, av_technology: 8, photography: 6, logistics: 4, gifting: 2 },
    keyMilestones: [
      "Theme lock-in and venue booking (10 weeks out)",
      "Award categories and trophy design (8 weeks out)",
      "Performer booking (6 weeks out)",
      "Seating plan finalised (1 week out)",
      "Trophy/trophy print final check (3 days out)",
    ],
    mustHaves: [
      "Awards stage with podium and trophy table",
      "Autocue/teleprompter for presenters",
      "Cocktail hour separate from dinner seating — allows decor transition",
      "Photo wall / step-and-repeat for award winners",
    ],
    commonMistakes: [
      "Award ceremony running too long — cap at 90 mins max",
      "No rehearsal with presenters",
      "Dinner starting before awards — kills atmosphere",
    ],
    culturalConsiderations: [
      "Confirm dietary restrictions across all 500+ attendees upfront",
      "Alcohol: confirm company policy; some MNCs prohibit at official events",
    ],
    leadTimeWeeks: { minimum: 10, recommended: 20 },
  },
  product_launch: {
    label: "Product Launch",
    typicalDuration: "2-4 hours",
    typicalGuestRange: "50-500",
    budgetAllocation: { venue: 18, catering: 15, av_technology: 25, decor: 20, photography: 8, logistics: 5, gifting: 5, invitations: 4 },
    keyMilestones: [
      "Creative concept + brand alignment (6 weeks out)",
      "Media list + invites (4 weeks out)",
      "Reveal mechanism engineering (3 weeks out)",
      "Dress rehearsal with spokesperson (2 days out)",
      "Media kit distribution (day of event)",
    ],
    mustHaves: [
      "Product reveal moment: drape drop, hologram, or LED countdown",
      "Media zone with branded backdrop for press photography",
      "Product demo stations with trained brand ambassadors",
      "Social media live stream setup",
      "Press kit: physical and digital",
    ],
    commonMistakes: [
      "Too much speech, not enough product interaction time",
      "Media embargo broken early — plan digital reveal timing carefully",
      "No demo product backups for hands-on sessions",
    ],
    culturalConsiderations: [
      "Auspicious launch timing: muhurtam preferred by many Indian promoters",
      "Regional language considerations if pan-India launch",
    ],
    leadTimeWeeks: { minimum: 6, recommended: 12 },
  },
  birthday: {
    label: "Birthday Party",
    typicalDuration: "3-5 hours",
    typicalGuestRange: "20-300",
    budgetAllocation: { venue: 20, catering: 30, decor: 22, entertainment: 12, photography: 6, cake: 4, gifting: 3, logistics: 3 },
    keyMilestones: [
      "Theme lock-in and venue booking (6 weeks out)",
      "Invites sent (4 weeks out)",
      "Entertainment booking (3 weeks out)",
      "Cake design approved (2 weeks out)",
      "Final headcount (1 week out)",
    ],
    mustHaves: [
      "Statement birthday cake — custom design",
      "Photo booth or selfie zone",
      "Surprise/reveal moment if milestone birthday",
      "Return gifts for all guests",
    ],
    commonMistakes: [
      "Underestimating children's entertainment needs for kids' parties",
      "Cake cutting not synced with photographer",
      "No dietary alternatives for guests with allergies",
    ],
    culturalConsiderations: [
      "Milestone birthdays (50th, 60th): traditional puja often included",
      "Kids parties: vegetarian menu strongly preferred by most Indian parents",
    ],
    leadTimeWeeks: { minimum: 4, recommended: 8 },
  },
  engagement: {
    label: "Engagement / Roka Ceremony",
    typicalDuration: "3-5 hours",
    typicalGuestRange: "50-200",
    budgetAllocation: { venue: 20, catering: 32, decor: 25, photography: 10, entertainment: 5, flowers: 5, invitations: 3 },
    keyMilestones: [
      "Date finalised with both families (8 weeks out)",
      "Venue and catering locked (6 weeks out)",
      "Ring delivery confirmed (2 weeks out)",
      "Coordinate ring ceremony timing with officiant (1 week out)",
    ],
    mustHaves: [
      "Ring exchange stage/backdrop",
      "Family photo-wall moment coordination",
      "Mehendi counter if evening engagement",
    ],
    commonMistakes: [
      "Too formal atmosphere — engagement is a family celebration",
      "Food served before ring ceremony interrupts flow",
    ],
    culturalConsiderations: [
      "Roka: separate Punjabi tradition before formal engagement — simpler and family-only",
      "South Indian Nichayatamarthamu: different rituals — consult with family",
    ],
    leadTimeWeeks: { minimum: 6, recommended: 12 },
  },
  anniversary: {
    label: "Anniversary Celebration",
    typicalDuration: "3-5 hours",
    typicalGuestRange: "30-300",
    budgetAllocation: { venue: 20, catering: 30, decor: 25, photography: 10, entertainment: 8, gifting: 4, flowers: 3 },
    keyMilestones: [
      "Theme and era references (4 weeks out)",
      "Photo wall with timeline of couple's journey (3 weeks out)",
      "Personalised video from friends/family (2 weeks out)",
    ],
    mustHaves: [
      "Memory/nostalgia element: photo slideshow, video montage",
      "Signature couple cocktail or mocktail",
      "Renewal of vows option (50th etc.)",
    ],
    commonMistakes: ["Generic decor not reflecting the couple's story"],
    culturalConsiderations: ["Silver (25) and Gold (50) anniversaries: traditional puja preferred by older couples"],
    leadTimeWeeks: { minimum: 4, recommended: 8 },
  },
  college_fest: {
    label: "College Cultural Fest",
    typicalDuration: "1-3 days",
    typicalGuestRange: "200-5000",
    budgetAllocation: { venue: 10, av_technology: 30, entertainment: 35, catering: 10, logistics: 8, photography: 4, decor: 3 },
    keyMilestones: [
      "College committee approvals and budget sanction (12 weeks out)",
      "Performer bookings (8 weeks out)",
      "Sponsorship activations (6 weeks out)",
      "Security planning with college admin (2 weeks out)",
      "Volunteer briefing (3 days out)",
    ],
    mustHaves: [
      "Crowd barrier management plan for main stage",
      "Multiple entry/exit points with wristband system",
      "Medical tent with first-aid staff",
      "Volunteer coordinator with radio comms",
    ],
    commonMistakes: [
      "Underestimating crowd surge at headline act",
      "Insufficient power backup for outdoor stages",
      "No cancellation clause with performers",
    ],
    culturalConsiderations: ["Avoid schedule overlap with board exam periods (Feb-Mar, Oct-Nov)"],
    leadTimeWeeks: { minimum: 12, recommended: 24 },
  },
  team_building: {
    label: "Corporate Team Building",
    typicalDuration: "4-8 hours (day event)",
    typicalGuestRange: "20-500",
    budgetAllocation: { venue: 25, catering: 30, entertainment: 25, logistics: 10, photography: 5, gifting: 5 },
    keyMilestones: [
      "Activity design aligned with company goals (6 weeks out)",
      "Venue recce with facilitator (4 weeks out)",
      "Team grouping plan (2 weeks out)",
      "Weather backup confirmed (1 week out for outdoor)",
    ],
    mustHaves: [
      "Professional facilitator for structured activities",
      "Inclusive activities (no physical barriers for differently-abled team members)",
      "Debrief session after activities — ties to company values",
    ],
    commonMistakes: ["Choosing competitive games that alienate introverts or create winners/losers"],
    culturalConsiderations: [
      "Mixed gender teams: design activities where both genders equally contribute",
      "Dietary diversity: many companies have vegetarian, non-vegetarian, and diet-restricted staff",
    ],
    leadTimeWeeks: { minimum: 4, recommended: 8 },
  },
  charity_fundraiser: {
    label: "Charity Fundraiser / Gala",
    typicalDuration: "3-5 hours",
    typicalGuestRange: "50-500",
    budgetAllocation: { venue: 15, catering: 25, av_technology: 15, decor: 15, entertainment: 10, photography: 5, logistics: 5, invitations: 5, gifting: 5 },
    keyMilestones: [
      "NGO/cause storytelling content (8 weeks out)",
      "Auction items sourced (6 weeks out)",
      "Donor invite list and RSVPs (4 weeks out)",
      "Pledge and payment mechanism tested (2 weeks out)",
    ],
    mustHaves: [
      "Compelling cause narrative — video/speaker",
      "Live auction auctioneer or silent auction app",
      "Tax receipt mechanism for 80G donations",
      "Clear fundraising goal with live progress meter",
    ],
    commonMistakes: [
      "Event cost eating too much of fundraise — aim for 20-30% max ratio",
      "No follow-up impact report to donors",
    ],
    culturalConsiderations: ["80G certification essential for Indian corporates to approve CSR donations"],
    leadTimeWeeks: { minimum: 8, recommended: 16 },
  },
  festival_celebration: {
    label: "Festival / Holiday Celebration",
    typicalDuration: "3-6 hours",
    typicalGuestRange: "50-1000",
    budgetAllocation: { venue: 18, catering: 28, decor: 22, entertainment: 15, photography: 5, logistics: 5, gifting: 4, flowers: 3 },
    keyMilestones: [
      "Festival date confirmed (festival-specific — Diwali, Holi, etc.)",
      "Theme and decor aligned to festival traditions (4 weeks out)",
      "Food menu reflecting festival cuisine (3 weeks out)",
    ],
    mustHaves: [
      "Festival-authentic decor: diyas for Diwali, colours for Holi, etc.",
      "Traditional food menu tied to festival",
      "Cultural activity: rangoli, puja, games tied to festival",
    ],
    commonMistakes: [
      "Generic party setup for a cultural event — loses authenticity",
      "Holi events: outdoor only; plan water/colour stain management",
    ],
    culturalConsiderations: [
      "Diwali: avoid fireworks in residential areas — use LED alternatives",
      "Holi: segregate dry and wet colour zones; provide outfit covers",
      "Navratri/Durga Puja: no non-veg food; garba dress code for hosts",
    ],
    leadTimeWeeks: { minimum: 6, recommended: 12 },
  },
};

// ── Seasonal pricing factors ────────────────────────────────────────────────────

export type SeasonLabel = "peak" | "shoulder" | "offpeak";

export const SEASONAL_FACTORS: Record<SeasonLabel, {
  label:           string;
  months:          number[];  // 1-12
  priceMultiplier: number;
  venueAvailability: "scarce" | "moderate" | "ample";
  notes:           string;
}> = {
  peak: {
    label: "Peak Season",
    months: [10, 11, 12, 1, 2],
    priceMultiplier: 1.25,
    venueAvailability: "scarce",
    notes: "Oct-Feb is wedding + corporate award season. Venues book 12+ months in advance for weekends. All vendor categories see 20-30% price premium. Book performers and catering 6+ months out.",
  },
  shoulder: {
    label: "Shoulder Season",
    months: [3, 4, 9],
    priceMultiplier: 1.0,
    venueAvailability: "moderate",
    notes: "March (post-wedding season, pre-summer) and September (pre-Navratri) offer standard pricing and decent availability. Good window for corporate events.",
  },
  offpeak: {
    label: "Off-Peak Season",
    months: [5, 6, 7, 8],
    priceMultiplier: 0.85,
    venueAvailability: "ample",
    notes: "May-August is monsoon season. Outdoor events risk heavy rain. Vendors offer 10-20% discounts. Indoor large halls typically available on short notice. Corporate retreats and indoor events work well.",
  },
};

// ── Risk categories ─────────────────────────────────────────────────────────────

export const RISK_DATABASE = {
  weather: [
    "Monsoon backup plan: covered marquee or indoor fallback for outdoor events Jun-Sep",
    "Heat management: misting fans + shaded areas for outdoor events May-Jun in North India",
    "Cyclone risk: coastal Odisha, Andhra, Tamil Nadu events Oct-Dec need weather clause in contracts",
  ],
  vendors: [
    "Caterer no-show: retain emergency caterer contact in same city; keep ₹50K contingency for ready-meals",
    "Decor delay: confirm setup team arrival time in contract with penalty clause",
    "DJ equipment failure: require dual-laptop setup and spare speaker as contract clause",
  ],
  regulatory: [
    "Noise after 10 PM: Confirm with venue — many residential-adjacent venues have 10 PM hard cutoff",
    "Alcohol licence: must be in planner's or venue's name with government permit — verify 2 weeks before",
    "Drone flight: DGCA authorisation required; restricted zones near airports, defence areas, VIP routes",
    "Crowd >1000: Police permission (Form 31/32 or state equivalent) required 30 days before",
  ],
  food_safety: [
    "Allergy protocol: collect guest dietary info via RSVP; brief catering team; label all dishes",
    "Cold chain: verify refrigeration for dairy and non-veg items; reject delivery if >4°C breach",
    "FSSAI compliance: insist on caterer's valid FSSAI licence copy in contract",
  ],
  crowd: [
    "Crowd surge at headline acts: install crowd barriers 1.5m from stage; 3m emergency corridor minimum",
    "Medical emergencies: first-aid station mandatory for 200+ guests; ambulance on standby for 500+",
    "Fire safety: venue must have valid NOC; check fire extinguisher locations with staff",
  ],
};

// ── Helper functions ────────────────────────────────────────────────────────────

export function detectCity(location: string): CityCode {
  const l = location.toLowerCase();
  if (l.includes("mumbai") || l.includes("bombay") || l.includes("thane") || l.includes("navi"))       return "mumbai";
  if (l.includes("delhi") || l.includes("ncr") || l.includes("gurgaon") || l.includes("noida") || l.includes("faridabad")) return "delhi";
  if (l.includes("bangalore") || l.includes("bengaluru"))  return "bangalore";
  if (l.includes("hyderabad") || l.includes("secunderabad")) return "hyderabad";
  if (l.includes("pune") || l.includes("pcmc"))             return "pune";
  if (l.includes("chennai") || l.includes("madras"))        return "chennai";
  if (l.includes("kolkata") || l.includes("calcutta"))      return "kolkata";
  if (l.includes("ahmedabad") || l.includes("surat") || l.includes("vadodara")) return "ahmedabad";
  return "tier2";
}

export function detectEventType(eventType: string): EventTypeKey {
  const e = eventType.toLowerCase();
  if (e.includes("wedding") || e.includes("shaadi") || e.includes("vivah"))          return "wedding";
  if (e.includes("conference") || e.includes("summit") || e.includes("seminar"))      return "corporate_conference";
  if (e.includes("gala") || e.includes("awards") || e.includes("dinner"))             return "corporate_gala";
  if (e.includes("launch") || e.includes("unveil"))                                   return "product_launch";
  if (e.includes("birthday") || e.includes("bday") || e.includes("birthday"))         return "birthday";
  if (e.includes("engagement") || e.includes("roka") || e.includes("sagai"))          return "engagement";
  if (e.includes("anniversary"))                                                       return "anniversary";
  if (e.includes("fest") || e.includes("college") || e.includes("university"))        return "college_fest";
  if (e.includes("team") || e.includes("offsite") || e.includes("off-site"))          return "team_building";
  if (e.includes("charity") || e.includes("fundrais") || e.includes("ngo"))           return "charity_fundraiser";
  if (e.includes("diwali") || e.includes("holi") || e.includes("festival") || e.includes("navratri")) return "festival_celebration";
  return "corporate_gala";
}

export function detectSeason(eventDate?: string): SeasonLabel {
  if (!eventDate) return "shoulder";
  const d = new Date(eventDate);
  if (isNaN(d.getTime())) return "shoulder";
  const month = d.getMonth() + 1;
  if ([10, 11, 12, 1, 2].includes(month)) return "peak";
  if ([5, 6, 7, 8].includes(month))       return "offpeak";
  return "shoulder";
}

export function estimateBudgetBreakdown(
  budget: number,
  eventType: EventTypeKey,
  guestCount: number,
  city: CityCode,
): { category: string; amount: number; percentage: number; description: string }[] {
  const template = EVENT_TYPE_TEMPLATES[eventType];
  const cityData  = CITY_BENCHMARKS[city];
  const alloc     = template.budgetAllocation;

  // Map allocation keys to user-facing category labels + descriptions
  const LABEL_MAP: Record<string, { label: string; description: string }> = {
    venue:          { label: "Venue",          description: `${cityData.displayName} venue hire + security deposit` },
    catering:       { label: "Catering",       description: `₹${Math.round(budget * (alloc.catering ?? 30) / 100 / guestCount)}/plate for ${guestCount} guests, inclusive of service staff` },
    decor:          { label: "Decor & Design", description: "Theme concept, fabrication, installation, and breakdown" },
    entertainment:  { label: "Entertainment",  description: "DJ/live band, performers, and anchor" },
    photography:    { label: "Photography",    description: "Photo + video coverage, edited delivery" },
    av_technology:  { label: "AV & Technology",description: "Sound system, LED screens, lighting rig, and operator" },
    logistics:      { label: "Logistics",      description: "Event crew, walkie-talkies, setup, and on-day management" },
    flowers:        { label: "Floral Design",  description: "Fresh flower arrangements and installations" },
    invitations:    { label: "Invitations",    description: "Design, print, and distribution of invites + stationery" },
    gifting:        { label: "Guest Gifting",  description: "Return gifts and branded merchandise for guests" },
    security:       { label: "Security",       description: "Trained security personnel and access control" },
    valet:          { label: "Valet Parking",  description: "Parking management and valet team" },
    bar_service:    { label: "Bar & Beverages",description: `Open bar for ${guestCount} guests including soft drinks` },
    cake:           { label: "Cake & Desserts",description: "Custom birthday cake and dessert stations" },
    contingency:    { label: "Contingency",    description: "10% buffer for last-minute additions and unforeseen costs" },
  };

  // Always add a contingency bucket (10%)
  const baseAlloc = { ...alloc };
  const allocTotal = Object.values(baseAlloc).reduce((s, v) => s + v, 0);
  const contingencyPct = Math.max(0, 10 - (100 - allocTotal));
  const scaleFactor = (100 - 10) / allocTotal;  // scale existing to 90%, keep 10% contingency

  const lines: { category: string; amount: number; percentage: number; description: string }[] = [];
  let remaining = budget;

  for (const [key, pct] of Object.entries(baseAlloc)) {
    const scaledPct = Math.round(pct * scaleFactor);
    const amount    = Math.round((scaledPct / 100) * budget);
    remaining      -= amount;
    const info      = LABEL_MAP[key] ?? { label: key, description: "" };
    lines.push({ category: info.label, amount, percentage: scaledPct, description: info.description });
  }

  // Contingency gets the remaining amount
  lines.push({
    category:   "Contingency",
    amount:     remaining,
    percentage: 10,
    description: "10% buffer for last-minute additions and unforeseen costs",
  });

  return lines;
}

// ── Knowledge context string (injected into AI prompt) ─────────────────────────

export function buildKnowledgeContext(args: {
  location:   string;
  budget:     number;
  eventType:  string;
  guestCount?: number;
  eventDate?:  string;
}): string {
  const city        = detectCity(args.location);
  const cityData    = CITY_BENCHMARKS[city];
  const evType      = detectEventType(args.eventType);
  const template    = EVENT_TYPE_TEMPLATES[evType];
  const season      = detectSeason(args.eventDate);
  const seasonData  = SEASONAL_FACTORS[season];
  const guestCount  = args.guestCount ?? 150;
  const perPerson   = Math.round(args.budget / guestCount);
  const budgetTier  = perPerson < cityData.perPersonMin ? "below-market"
                    : perPerson < cityData.perPersonMid ? "budget"
                    : perPerson < cityData.perPersonLux ? "mid-range"
                    : "luxury";

  const suggestedBreakdown = estimateBudgetBreakdown(args.budget, evType, guestCount, city);

  return `
=== INDIAN EVENT PLANNING KNOWLEDGE CONTEXT ===

CITY: ${cityData.displayName}
  Budget tier: ${budgetTier} (₹${perPerson.toLocaleString("en-IN")}/person vs market: ₹${cityData.perPersonMin.toLocaleString("en-IN")}-₹${cityData.perPersonLux.toLocaleString("en-IN")}/person)
  Catering plate range: ₹${cityData.cateringPlateMin.toLocaleString("en-IN")} – ₹${cityData.cateringPlateLux.toLocaleString("en-IN")}/plate
  Venue hire range: ₹${(cityData.venueHireMin/1000).toFixed(0)}K – ₹${(cityData.venueHireLux/100000).toFixed(1)}L
  Decor range: ₹${(cityData.decorMin/1000).toFixed(0)}K – ₹${(cityData.decorLux/100000).toFixed(1)}L
  City notes: ${cityData.notes}

SEASON: ${seasonData.label} (${args.eventDate ? `event date: ${args.eventDate}` : "date not specified"})
  Price multiplier: ${seasonData.priceMultiplier}× standard
  Venue availability: ${seasonData.venueAvailability}
  Notes: ${seasonData.notes}

EVENT TYPE: ${template.label}
  Typical duration: ${template.typicalDuration}
  Recommended lead time: ${template.leadTimeWeeks.recommended} weeks (minimum: ${template.leadTimeWeeks.minimum} weeks)
  Must-haves for this event type:
${template.mustHaves.map((m) => `  • ${m}`).join("\n")}
  Common mistakes to avoid:
${template.commonMistakes.map((m) => `  • ${m}`).join("\n")}
  Cultural considerations:
${template.culturalConsiderations.map((c) => `  • ${c}`).join("\n")}

SUGGESTED BUDGET ALLOCATION (₹${args.budget.toLocaleString("en-IN")} total, ${guestCount} guests):
${suggestedBreakdown.map((l) => `  ${l.category.padEnd(20)} ₹${l.amount.toLocaleString("en-IN").padStart(10)} (${l.percentage}%) — ${l.description}`).join("\n")}

KEY VENDOR BENCHMARKS FOR ${cityData.displayName.toUpperCase()}:
  Catering: ₹${cityData.cateringPlateMin.toLocaleString("en-IN")}-${cityData.cateringPlateLux.toLocaleString("en-IN")}/plate (confirm veg/non-veg ratio, FSSAI licence)
  Decor: ₹${(cityData.decorMin/1000).toFixed(0)}K-${(cityData.decorLux/100000).toFixed(1)}L (includes installation & breakdown; confirm ceiling rigging permission)
  Photography: ₹${(cityData.photographyMin/1000).toFixed(0)}K-${(cityData.photographyMid*3/1000).toFixed(0)}K (mid-tier: ${(cityData.photographyMid/1000).toFixed(0)}K; drone needs DGCA approval)
  Entertainment: ₹10K-5L (DJ standard: 4-hr set; live band: 2-hr set + travel)

TOP RISKS FOR THIS EVENT/LOCATION/SEASON:
${[
  ...RISK_DATABASE.weather.slice(0, season === "offpeak" ? 2 : 1),
  ...RISK_DATABASE.vendors.slice(0, 2),
  ...RISK_DATABASE.regulatory.slice(0, 2),
  ...RISK_DATABASE.food_safety.slice(0, 1),
].map((r) => `  ⚠ ${r}`).join("\n")}

=== END KNOWLEDGE CONTEXT ===

Use the above data to make your proposal numbers realistic and location-specific. Vendor costs must fall within the cited ranges. Flag any budget that is below the minimum viable threshold for this city/guest count.`.trim();
}
