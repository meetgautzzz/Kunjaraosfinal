// ── Shared ─────────────────────────────────────────────────────────────────────

export type AiToolType = "budget" | "run-of-show" | "social" | "presentation";

export type HistoryEntry = {
  id:        string;
  tool:      AiToolType;
  title:     string;
  createdAt: string;
  input:     unknown;
  output:    unknown;
};

// ── 1. Budget Generator ────────────────────────────────────────────────────────

export type BudgetInput = {
  eventType:    string;
  totalBudget:  number;
  guestCount:   number;
  location:     string;
  requirements: string;
};

export type BudgetLine = {
  category:    string;
  amount:      number;
  percentage:  number;
  description: string;
  gstRate:     0 | 5 | 12 | 18 | 28;
};

export type BudgetOutput = {
  title:    string;
  summary:  string;
  lines:    BudgetLine[];
  notes:    string[];
};

export function mockBudget(input: BudgetInput): BudgetOutput {
  const b = input.totalBudget;
  return {
    title:   `${input.eventType} Budget — ${input.location}`,
    summary: `A ${input.guestCount}-guest ${input.eventType.toLowerCase()} with a total budget of ₹${b.toLocaleString("en-IN")}. Allocation is optimised for impact across key spend categories.`,
    lines: [
      { category: "Venue & Logistics",    amount: Math.round(b*0.25), percentage: 25, description: "Venue rental, security, parking, logistics", gstRate: 18 },
      { category: "Catering & F&B",       amount: Math.round(b*0.22), percentage: 22, description: "Full F&B management — menu, staff, setup", gstRate: 5  },
      { category: "AV & Technology",      amount: Math.round(b*0.15), percentage: 15, description: "Sound, lighting, LED walls, streaming", gstRate: 18 },
      { category: "Décor & Installations",amount: Math.round(b*0.12), percentage: 12, description: "Thematic décor, florals, branding elements", gstRate: 18 },
      { category: "Entertainment",        amount: Math.round(b*0.10), percentage: 10, description: "Performers, MC, live band or DJ", gstRate: 18 },
      { category: "Photography & Video",  amount: Math.round(b*0.07), percentage: 7,  description: "Stills, video, drone, same-day reel", gstRate: 18 },
      { category: "Marketing & Print",    amount: Math.round(b*0.05), percentage: 5,  description: "Invites, digital creatives, signage, gifts", gstRate: 18 },
      { category: "Contingency Buffer",   amount: Math.round(b*0.04), percentage: 4,  description: "Emergency reserve — recommend 5–10%", gstRate: 0  },
    ],
    notes: [
      "GST is applicable on most services at 18% — factor this into your vendor negotiations.",
      `Per-head cost approximately ₹${Math.round(b / (input.guestCount || 1)).toLocaleString("en-IN")} before GST.`,
      "Venue costs can shift 5–8% depending on peak season and day of week.",
      "Lock AV and venue first — all other vendors adjust around these anchors.",
    ],
  };
}

// ── 2. Run-of-Show Generator ───────────────────────────────────────────────────

export type RunOfShowInput = {
  eventType:  string;
  eventName:  string;
  eventDate:  string;
  startTime:  string;  // "18:00"
  endTime:    string;  // "23:00"
  venue:      string;
  guestCount: number;
  requirements: string;
};

export type RosCategory = "SETUP" | "GUEST" | "PROGRAM" | "BREAK" | "CLOSE";

export type RosEntry = {
  id:       string;
  time:     string;  // "18:00"
  duration: number;  // minutes
  item:     string;
  owner:    string;
  notes:    string;
  category: RosCategory;
};

export type RunOfShowOutput = {
  eventName: string;
  date:      string;
  venue:     string;
  entries:   RosEntry[];
  notes:     string[];
};

function rosId() { return `ros_${Math.random().toString(36).slice(2, 8)}`; }

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const total  = h * 60 + m + mins;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function mockRunOfShow(input: RunOfShowInput): RunOfShowOutput {
  const start = input.startTime || "18:00";
  let t = addMinutes(start, -90);
  const rows: RosEntry[] = [
    { id: rosId(), time: t,                 duration: 90,  item: "Venue setup & vendor checkin",          owner: "Production Lead",     notes: "AV, décor, catering all arrive by setup start", category: "SETUP"   },
    { id: rosId(), time: t = addMinutes(t, 90),  duration: 30,  item: "Tech rehearsal & sound check",     owner: "AV Team",             notes: "Walk through all cues — mic, slides, lighting", category: "SETUP"   },
    { id: rosId(), time: t = addMinutes(t, 30),  duration: 15,  item: "Team briefing & station positions",owner: "Event Manager",       notes: "All staff at positions 15 min before doors", category: "SETUP"   },
    { id: rosId(), time: t = addMinutes(t, 15),  duration: 45,  item: "Guest arrival & registration",     owner: "Welcome Team",        notes: "Cocktails / welcome drink on arrival", category: "GUEST"   },
    { id: rosId(), time: t = addMinutes(t, 45),  duration: 10,  item: "Guests move to main hall",         owner: "Ushers",              notes: "Soft background music, lights dim to 70%", category: "GUEST"   },
    { id: rosId(), time: t = addMinutes(t, 10),  duration: 5,   item: "Welcome address by host / MC",     owner: "MC",                  notes: "Introduce event, agenda, housekeeping", category: "PROGRAM" },
    { id: rosId(), time: t = addMinutes(t, 5),   duration: 20,  item: "Opening act / entertainment",      owner: "Entertainment Team",  notes: "Live band / performer opener set", category: "PROGRAM" },
    { id: rosId(), time: t = addMinutes(t, 20),  duration: 60,  item: "Dinner service",                   owner: "Catering Manager",    notes: "Courses coordinated with program beats", category: "PROGRAM" },
    { id: rosId(), time: t = addMinutes(t, 60),  duration: 30,  item: "Main program / keynote / awards",  owner: "MC + Speakers",       notes: "All scripts finalised 24 hrs before event", category: "PROGRAM" },
    { id: rosId(), time: t = addMinutes(t, 30),  duration: 15,  item: "Networking break",                 owner: "Event Team",          notes: "Open bar, background music, photo ops", category: "BREAK"   },
    { id: rosId(), time: t = addMinutes(t, 15),  duration: 20,  item: "Closing performance / DJ set",     owner: "Entertainment",       notes: "High energy close", category: "PROGRAM" },
    { id: rosId(), time: t = addMinutes(t, 20),  duration: 10,  item: "Vote of thanks & closing remarks", owner: "Host / MC",           notes: "Thank sponsors, key vendors, guests", category: "CLOSE"   },
    { id: rosId(), time: t = addMinutes(t, 10),  duration: 30,  item: "Guest departure & farewell",       owner: "Welcome Team",        notes: "Gift bags, valet coordination", category: "CLOSE"   },
    { id: rosId(), time: t = addMinutes(t, 30),  duration: 60,  item: "Vendor breakdown & venue clearance",owner:"Production Lead",     notes: "All material cleared before midnight curfew", category: "CLOSE"   },
  ];
  return {
    eventName: input.eventName || `${input.eventType} — ${input.venue}`,
    date:      input.eventDate,
    venue:     input.venue,
    entries:   rows,
    notes: [
      "All times are indicative — adjust as confirmed run time evolves.",
      "Distribute final ROS to all vendors 48 hours before event.",
      "Designate a single 'ROS owner' to call cues on the day.",
      "Keep a printed copy at the production desk at all times.",
    ],
  };
}

// ── 3. Social Media Captions ──────────────────────────────────────────────────

export type SocialPlatform = "Instagram" | "LinkedIn" | "Twitter/X" | "Facebook" | "WhatsApp";
export type SocialTone     = "Professional" | "Celebratory" | "Exciting" | "Informative";
export type CaptionType    = "Announcement" | "Countdown" | "Behind the Scenes" | "Recap";

export type SocialInput = {
  eventName:  string;
  eventType:  string;
  eventDate:  string;
  location:   string;
  platforms:  SocialPlatform[];
  tones:      SocialTone[];
  keyDetails: string;
};

export type SocialCaption = {
  id:        string;
  platform:  SocialPlatform;
  type:      CaptionType;
  caption:   string;
  hashtags:  string[];
  charCount: number;
};

export type SocialOutput = {
  captions: SocialCaption[];
  notes:    string[];
};

function scId() { return `sc_${Math.random().toString(36).slice(2, 8)}`; }

export function mockSocial(input: SocialInput): SocialOutput {
  const { eventName, eventType, location, eventDate } = input;
  const dateStr = eventDate ? new Date(eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "coming soon";
  const captions: SocialCaption[] = [];

  const platforms = input.platforms.length ? input.platforms : ["Instagram", "LinkedIn"] as SocialPlatform[];

  if (platforms.includes("Instagram")) {
    const ig1 = `✨ Announcing ${eventName}!\n\nGet ready for an unforgettable ${eventType.toLowerCase()} at ${location} on ${dateStr}. We've crafted every detail to deliver an extraordinary experience — from world-class entertainment to a curated atmosphere that will leave you inspired.\n\nSave the date. This one's special. 🖤`;
    captions.push({ id: scId(), platform: "Instagram", type: "Announcement", caption: ig1, hashtags: ["#" + eventName.replace(/\s+/g,""), `#${eventType.replace(/\s+/g,"")}`, "#KunjaraOS", "#EventManagement", "#SaveTheDate", "#ExclusiveEvent"], charCount: ig1.length });

    const ig2 = `⏳ ${eventDate ? Math.max(0, Math.ceil((new Date(eventDate).getTime() - Date.now()) / 86400_000)) : "X"} days to go!\n\n${eventName} is almost here and we couldn't be more excited. Behind the scenes, every detail is coming together perfectly. Are you ready? 🎉\n\nLink in bio for details.`;
    captions.push({ id: scId(), platform: "Instagram", type: "Countdown", caption: ig2, hashtags: ["#Countdown", "#" + eventName.replace(/\s+/g,""), "#ComingSoon", "#EventVibes"], charCount: ig2.length });
  }

  if (platforms.includes("LinkedIn")) {
    const li1 = `We're thrilled to announce ${eventName} — a premier ${eventType.toLowerCase()} taking place at ${location} on ${dateStr}.\n\nThis gathering brings together industry leaders, creative minds, and forward-thinkers for an evening of connection, inspiration, and celebration.\n\nSpaces are limited. We look forward to welcoming you.\n\n#${eventType.replace(/\s+/g,"")} #${eventName.replace(/\s+/g,"")} #Networking #EventManagement`;
    captions.push({ id: scId(), platform: "LinkedIn", type: "Announcement", caption: li1, hashtags: [`#${eventType.replace(/\s+/g,"")}`, `#${eventName.replace(/\s+/g,"")}`, "#Networking", "#EventManagement", "#Leadership"], charCount: li1.length });

    const li2 = `${eventName} is wrapped — and what an evening it was.\n\nThank you to every guest, vendor, and partner who made ${location} come alive on ${dateStr}. The energy, the conversations, and the moments created were truly exceptional.\n\nUntil next time. 🙏\n\n#EventRecap #${eventName.replace(/\s+/g,"")} #ThankYou`;
    captions.push({ id: scId(), platform: "LinkedIn", type: "Recap", caption: li2, hashtags: ["#EventRecap", `#${eventName.replace(/\s+/g,"")}`, "#ThankYou", "#Community"], charCount: li2.length });
  }

  if (platforms.includes("Twitter/X")) {
    const tw1 = `🎉 Announcing ${eventName}!\n${eventType} · ${location} · ${dateStr}\n\nWe're building something extraordinary. Stay tuned. 👀 #${eventName.replace(/\s+/g,"")} #${eventType.replace(/\s+/g,"")}`;
    captions.push({ id: scId(), platform: "Twitter/X", type: "Announcement", caption: tw1, hashtags: [`#${eventName.replace(/\s+/g,"")}`, `#${eventType.replace(/\s+/g,"")}`], charCount: tw1.length });
  }

  if (platforms.includes("WhatsApp")) {
    const wa1 = `📣 *${eventName}*\n\n🗓 Date: ${dateStr}\n📍 Venue: ${location}\n\nYou're cordially invited to join us for an extraordinary ${eventType.toLowerCase()}. Expect world-class entertainment, exceptional F&B, and an evening to remember.\n\n✅ *RSVP by [date]* — Limited seats available.\n\nReply to confirm your attendance.`;
    captions.push({ id: scId(), platform: "WhatsApp", type: "Announcement", caption: wa1, hashtags: [], charCount: wa1.length });
  }

  if (platforms.includes("Facebook")) {
    const fb1 = `🌟 We're excited to announce ${eventName}!\n\n📅 ${dateStr}\n📍 ${location}\n\n${input.keyDetails || `Join us for an extraordinary ${eventType.toLowerCase()} — crafted with precision and designed to inspire. Whether you're a first-time guest or a returning friend, this one will be unforgettable.`}\n\n👉 Comment below or send us a message to RSVP.\n\n#${eventName.replace(/\s+/g,"")} #${eventType.replace(/\s+/g,"")} #SaveTheDate`;
    captions.push({ id: scId(), platform: "Facebook", type: "Announcement", caption: fb1, hashtags: [`#${eventName.replace(/\s+/g,"")}`, `#${eventType.replace(/\s+/g,"")}`], charCount: fb1.length });
  }

  return {
    captions,
    notes: [
      "Adjust all hashtags to your brand's active hashtag strategy.",
      "For Instagram, keep caption under 2,200 characters for full display.",
      "For LinkedIn, first 3 lines are shown before 'see more' — front-load the hook.",
      "Post event announcements on Tuesday–Thursday 10am–12pm for max organic reach.",
    ],
  };
}

// ── 4. Presentation Generator ─────────────────────────────────────────────────

export type PresentationInput = {
  topic:        string;
  eventType:    string;
  audience:     string;
  slideCount:   number;
  tone:         string;
  requirements: string;
};

export type SlideType = "TITLE" | "AGENDA" | "CONTENT" | "DATA" | "QUOTE" | "CLOSING";

export type PresentationSlide = {
  id:            string;
  slideNumber:   number;
  type:          SlideType;
  title:         string;
  bulletPoints:  string[];
  speakerNotes:  string;
};

export type PresentationOutput = {
  title:    string;
  subtitle: string;
  slides:   PresentationSlide[];
  notes:    string[];
};

function psId() { return `ps_${Math.random().toString(36).slice(2, 8)}`; }

export function mockPresentation(input: PresentationInput): PresentationOutput {
  const { topic, eventType, audience } = input;
  const count = Math.max(5, Math.min(20, input.slideCount || 10));

  const baseSlides: PresentationSlide[] = [
    {
      id: psId(), slideNumber: 1, type: "TITLE",
      title: topic || `${eventType} Presentation`,
      bulletPoints: [input.audience ? `Prepared for: ${audience}` : "KUNJARA OS", new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })],
      speakerNotes: "Welcome the audience warmly. Introduce yourself and set the tone for the presentation. Keep the opener to under 60 seconds.",
    },
    {
      id: psId(), slideNumber: 2, type: "AGENDA",
      title: "Today's Agenda",
      bulletPoints: ["01 — Overview & Objectives", "02 — Key Highlights", "03 — Detailed Breakdown", "04 — Timeline & Milestones", "05 — Budget & Resources", "06 — Next Steps"],
      speakerNotes: "Walk through the agenda briefly. Let the audience know what to expect and when Q&A will happen.",
    },
    {
      id: psId(), slideNumber: 3, type: "CONTENT",
      title: "Overview & Objectives",
      bulletPoints: [
        `${topic} is designed to deliver measurable results`,
        `Target audience: ${audience || "key stakeholders"}`,
        "Core objective: Drive engagement, deliver ROI, elevate brand",
        "Success metrics defined and tracked from Day 1",
      ],
      speakerNotes: "Establish the 'why' before the 'what'. This sets the stage for everything that follows.",
    },
    {
      id: psId(), slideNumber: 4, type: "CONTENT",
      title: "Key Highlights",
      bulletPoints: [
        "World-class production quality at every touchpoint",
        "Data-driven decision making throughout planning",
        "Experienced team with 50+ successful events",
        "End-to-end vendor management and compliance",
        "Real-time reporting and post-event analytics",
      ],
      speakerNotes: "Lead with your strongest differentiators. Pause after each point to let it land.",
    },
    {
      id: psId(), slideNumber: 5, type: "DATA",
      title: "By the Numbers",
      bulletPoints: [
        "500+ guests expected across all touchpoints",
        "12 curated vendor partnerships",
        "98% on-time delivery record",
        "4.9/5 average client satisfaction score",
        "₹0 budget overruns in last 3 events",
      ],
      speakerNotes: "Numbers build credibility. If you have client-specific data, replace these with actuals.",
    },
  ];

  // Fill remaining slides up to requested count
  const contentSlides: PresentationSlide[] = [
    {
      id: psId(), slideNumber: 6, type: "CONTENT",
      title: "Timeline & Key Milestones",
      bulletPoints: ["90 days out: Strategy, venue, core vendors locked", "60 days out: Creative, branding, invitations finalised", "30 days out: Tech rehearsal, final guest comms", "7 days out: Final briefings, run-of-show confirmed", "Event day: Execute with precision"],
      speakerNotes: "Emphasise the structured approach. This instils confidence in the client.",
    },
    {
      id: psId(), slideNumber: 7, type: "DATA",
      title: "Budget Overview",
      bulletPoints: ["Venue & Logistics: 25%", "Catering & F&B: 22%", "AV & Technology: 15%", "Décor & Entertainment: 22%", "Photography, Marketing & Contingency: 16%"],
      speakerNotes: "Use a visual pie chart on this slide. Walk through each line with a brief rationale.",
    },
    {
      id: psId(), slideNumber: 8, type: "QUOTE",
      title: "What Our Clients Say",
      bulletPoints: ['"Every detail was flawless — our guests are still talking about it." — CEO, Fortune 500 Company', '"KUNJARA OS delivered beyond expectations. The ROI was immediate and measurable." — CMO, Global Brand'],
      speakerNotes: "Let the testimonials speak. Pause after each quote for effect.",
    },
    {
      id: psId(), slideNumber: 9, type: "CONTENT",
      title: "Our Approach",
      bulletPoints: ["Discovery: Deep dive into your vision and objectives", "Strategy: Data-backed planning and vendor curation", "Production: Flawless execution on every detail", "Review: Post-event analytics and debrief report"],
      speakerNotes: "This is your process slide. Make it feel systematic and reassuring.",
    },
    {
      id: psId(), slideNumber: 10, type: "CONTENT",
      title: "Why KUNJARA OS",
      bulletPoints: ["All-in-one event management platform", "AI-powered proposals, budgets, and compliance", "Dedicated client room with real-time visibility", "Single point of accountability — no coordination gaps"],
      speakerNotes: "Close the case for your solution before moving to next steps.",
    },
  ];

  const closingSlide: PresentationSlide = {
    id: psId(), slideNumber: count, type: "CLOSING",
    title: "Next Steps",
    bulletPoints: ["Review proposal and share feedback within 48 hours", "Schedule a venue walkthrough at your convenience", "Confirm event brief — we begin immediately upon sign-off", "Contact: events@kunjara.com | +91 98765 43210"],
    speakerNotes: "End with a clear, low-friction call to action. Make it easy for them to say yes.",
  };

  const allMiddle = contentSlides.slice(0, Math.max(0, count - 5));
  const slides = [
    ...baseSlides.slice(0, Math.min(4, count - 1)),
    ...allMiddle,
    closingSlide,
  ].map((s, i) => ({ ...s, slideNumber: i + 1 }));

  return {
    title:    topic || `${eventType} Presentation`,
    subtitle: `Prepared for ${audience || "Stakeholders"} · ${new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}`,
    slides,
    notes: [
      "Replace placeholder data with actual event-specific figures before presenting.",
      "Keep each slide to one core idea — don't overload with text.",
      "Rehearse the deck at least twice before the presentation.",
      "Export as PDF for distribution; use PPTX for live presenting.",
    ],
  };
}

// ── History (localStorage) ────────────────────────────────────────────────────

const HISTORY_KEY = "kunjara_ai_history";

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
  } catch { return []; }
}

export function saveToHistory(entry: Omit<HistoryEntry, "id" | "createdAt">): HistoryEntry {
  const full: HistoryEntry = {
    ...entry,
    id:        `h_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const existing = loadHistory().filter((h) => h.id !== full.id);
  const updated  = [full, ...existing].slice(0, 50); // keep last 50
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  return full;
}

export function deleteFromHistory(id: string): HistoryEntry[] {
  const updated = loadHistory().filter((h) => h.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  return updated;
}

export const TOOL_META: Record<AiToolType, { label: string; icon: string; description: string; color: string }> = {
  "budget":        { label: "Budget Generator",      icon: "₹",  description: "AI-powered budget breakdown with GST",      color: "emerald" },
  "run-of-show":   { label: "Run-of-Show",            icon: "⏱",  description: "Minute-by-minute event schedule",           color: "amber"   },
  "social":        { label: "Social Media Captions",  icon: "📣",  description: "Platform-optimised captions & hashtags",    color: "pink"    },
  "presentation":  { label: "Presentation Builder",   icon: "🖥",  description: "Slide-by-slide deck with speaker notes",    color: "indigo"  },
};
