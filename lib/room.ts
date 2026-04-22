// ── Core types ────────────────────────────────────────────────────────────────

export type RoomTask = {
  id:          string;
  title:       string;
  description: string | null;
  assignedTo:  string | null;
  dueDate:     string | null;
  status:      "PENDING" | "IN_PROGRESS" | "DONE";
  priority:    "LOW" | "MEDIUM" | "HIGH";
  completedAt: string | null;
};

export type RoomPayment = {
  id:                string;
  label:             string;
  amount:            number;
  currency:          string;
  status:            "PENDING" | "PROCESSING" | "PAID" | "FAILED";
  dueDate:           string | null;
  paidAt:            string | null;
  razorpayOrderId:   string | null;
  razorpayPaymentId: string | null;
};

export type TimelinePhase = {
  phase:     string;
  daysOut:   string;
  tasks:     string[];
  milestone: boolean;
};

export type VendorEntry = {
  id:       string;
  name:     string;
  category: string;
  status:   "ACTIVE" | "PENDING" | "INACTIVE";
  email?:   string;
  role?:    string;
  fee?:     number;
};

export type EventRoom = {
  id:             string;
  token:          string;
  eventId:        string;
  title:          string;
  clientName:     string | null;
  clientEmail:    string | null;
  status:         "ACTIVE" | "ARCHIVED" | "LOCKED";
  showProposal:   boolean;
  showBudget:     boolean;
  showTimeline:   boolean;
  showVendors:    boolean;
  showTasks:      boolean;
  showPayments:   boolean;
  showApprovals:  boolean;
  proposalData:   any;
  budgetData:     any;
  timelineData:   TimelinePhase[] | null;
  vendorData:     VendorEntry[]   | null;
  totalAmount:    number | null;
  amountPaid:     number;
  currency:       string;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED" | "REVISION_REQUESTED";
  approvedAt:     string | null;
  approvedByName: string | null;
  approvalNote:   string | null;
  viewCount:      number;
  lastViewedAt:   string | null;
  createdAt:      string;
  updatedAt:      string;
  tasks:          RoomTask[];
  payments:       RoomPayment[];
};

// ── Status helpers ─────────────────────────────────────────────────────────────

export const APPROVAL_STYLES: Record<string, string> = {
  PENDING:             "bg-amber-500/15 text-amber-400 border-amber-500/20",
  APPROVED:            "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  REJECTED:            "bg-red-500/15 text-red-400 border-red-500/20",
  REVISION_REQUESTED:  "bg-orange-500/15 text-orange-400 border-orange-500/20",
};

export const APPROVAL_LABELS: Record<string, string> = {
  PENDING:            "Awaiting Approval",
  APPROVED:           "Approved",
  REJECTED:           "Rejected",
  REVISION_REQUESTED: "Revision Requested",
};

export const TASK_STATUS_STYLES: Record<string, string> = {
  PENDING:     "bg-gray-500/15 text-gray-400",
  IN_PROGRESS: "bg-indigo-500/15 text-indigo-400",
  DONE:        "bg-emerald-500/15 text-emerald-400",
};

export const PAYMENT_STATUS_STYLES: Record<string, string> = {
  PENDING:    "bg-amber-500/15 text-amber-400",
  PROCESSING: "bg-indigo-500/15 text-indigo-400",
  PAID:       "bg-emerald-500/15 text-emerald-400",
  FAILED:     "bg-red-500/15 text-red-400",
};

export const PRIORITY_STYLES: Record<string, string> = {
  LOW:    "bg-gray-500/15 text-gray-400",
  MEDIUM: "bg-amber-500/15 text-amber-400",
  HIGH:   "bg-red-500/15 text-red-400",
};

export function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(n);
}

// ── Mock room data ─────────────────────────────────────────────────────────────

export const MOCK_ROOM: EventRoom = {
  id:            "room_1",
  token:         "kunjara-gala-2025",
  eventId:       "evt_1",
  title:         "Gala Night 2025",
  clientName:    "Apex Corp",
  clientEmail:   "events@apexcorp.com",
  status:        "ACTIVE",
  showProposal:  true,
  showBudget:    true,
  showTimeline:  true,
  showVendors:   true,
  showTasks:     true,
  showPayments:  true,
  showApprovals: true,
  totalAmount:   2500000,
  amountPaid:    625000,
  currency:      "INR",
  approvalStatus:"PENDING",
  approvedAt:    null,
  approvedByName:null,
  approvalNote:  null,
  viewCount:     12,
  lastViewedAt:  new Date().toISOString(),
  createdAt:     "2025-04-01T10:00:00Z",
  updatedAt:     new Date().toISOString(),

  proposalData: {
    concept: {
      title:       "Celestial Gala Night 2025",
      tagline:     "Where Stars Align for Excellence.",
      description: "An extraordinary black-tie celebration set against Mumbai's iconic skyline. Every element is crafted to create an unforgettable evening of prestige and connection.",
      theme:       "Celestial Luxury — Deep Navy, Gold & Starlight",
      highlights: [
        "360° LED constellation ceiling installation",
        "Live jazz orchestra with celebrity performer",
        "7-course Michelin-inspired tasting menu",
        "Personalised crystal award ceremony",
        "Live social wall with real-time guest moments",
      ],
    },
  },

  budgetData: {
    meta:  { title: "Gala Night 2025 Budget", clientName: "Apex Corp", globalMargin: 0, hideClientCosts: false },
    items: [
      { id: "b1", category: "Venue",          description: "Grand Ballroom Rental",      quantity: 1,   unitCost: 250000, gstRate: 18, margin: 10, visible: true },
      { id: "b2", category: "Catering",       description: "7-Course Dinner (per head)", quantity: 300, unitCost: 2500,   gstRate: 5,  margin: 12, visible: true },
      { id: "b3", category: "AV & Technology",description: "LED Wall + Sound System",    quantity: 1,   unitCost: 150000, gstRate: 18, margin: 15, visible: true },
      { id: "b4", category: "Décor & Design", description: "Celestial Theme Décor",      quantity: 1,   unitCost: 120000, gstRate: 12, margin: 20, visible: true },
      { id: "b5", category: "Entertainment",  description: "Live Band + Celebrity",       quantity: 1,   unitCost: 200000, gstRate: 18, margin: 10, visible: true },
    ],
  },

  timelineData: [
    { phase: "Strategy & Planning",  daysOut: "90 days before", tasks: ["Finalize venue contract", "Set guest list", "Brief core team"],         milestone: true  },
    { phase: "Vendor Sourcing",      daysOut: "75 days before", tasks: ["Issue RFPs to vendors", "Review proposals", "Sign contracts"],           milestone: false },
    { phase: "Creative Development", daysOut: "60 days before", tasks: ["Lock celestial theme", "Approve AV concepts", "Brief catering team"],    milestone: true  },
    { phase: "Production Begins",    daysOut: "30 days before", tasks: ["Confirm all bookings", "Send final invites", "Tech rehearsal"],          milestone: false },
    { phase: "Final Preparation",    daysOut: "7 days before",  tasks: ["Venue walkthrough", "Confirm run-of-show", "Final team briefing"],       milestone: true  },
    { phase: "Event Day",            daysOut: "Day of event",   tasks: ["Setup by 10am", "Guest arrival from 7pm", "Awards ceremony at 9:30pm"], milestone: true  },
  ],

  vendorData: [
    { id: "v1", name: "Grand Hyatt Mumbai",      category: "Venue",          status: "ACTIVE",  role: "Host venue & facilities",    fee: 250000 },
    { id: "v2", name: "Apex Catering Co.",        category: "Catering",       status: "ACTIVE",  role: "Full F&B management",        fee: 750000 },
    { id: "v3", name: "SoundWave Productions",    category: "AV & Technology",status: "ACTIVE",  role: "Sound, lighting, LED walls",  fee: 150000 },
    { id: "v4", name: "Luxe Décor Studio",        category: "Décor & Design", status: "PENDING", role: "Celestial theme & florals",   fee: 120000 },
    { id: "v5", name: "Vertex Photography",       category: "Photography",    status: "ACTIVE",  role: "Photo + cinematic video",     fee: 60000  },
  ],

  tasks: [
    { id: "t1", title: "Send final guest list to venue",     description: null, assignedTo: "Gautam",  dueDate: "2025-04-10T00:00:00Z", status: "DONE",        priority: "HIGH",   completedAt: "2025-04-09T00:00:00Z" },
    { id: "t2", title: "Confirm AV equipment checklist",     description: null, assignedTo: "Aisha",   dueDate: "2025-04-12T00:00:00Z", status: "IN_PROGRESS", priority: "HIGH",   completedAt: null },
    { id: "t3", title: "Finalise menu with catering team",   description: null, assignedTo: "Gautam",  dueDate: "2025-04-14T00:00:00Z", status: "PENDING",     priority: "MEDIUM", completedAt: null },
    { id: "t4", title: "Send invitations to all guests",     description: null, assignedTo: "Sara",    dueDate: "2025-04-08T00:00:00Z", status: "DONE",        priority: "HIGH",   completedAt: "2025-04-07T00:00:00Z" },
    { id: "t5", title: "Brief security team on VIP protocol",description: null, assignedTo: "Ravi",    dueDate: "2025-04-18T00:00:00Z", status: "PENDING",     priority: "LOW",    completedAt: null },
    { id: "t6", title: "Collect signed NDAs from all vendors",description: null, assignedTo: "Aisha",  dueDate: "2025-04-11T00:00:00Z", status: "IN_PROGRESS", priority: "MEDIUM", completedAt: null },
  ],

  payments: [
    { id: "p1", label: "50% Advance",     amount: 1250000, currency: "INR", status: "PAID",    dueDate: "2025-04-01T00:00:00Z", paidAt: "2025-04-02T00:00:00Z", razorpayOrderId: "order_1", razorpayPaymentId: "pay_1" },
    { id: "p2", label: "25% Milestone",   amount: 625000,  currency: "INR", status: "PENDING", dueDate: "2025-04-15T00:00:00Z", paidAt: null,                   razorpayOrderId: null,      razorpayPaymentId: null    },
    { id: "p3", label: "25% Final",       amount: 625000,  currency: "INR", status: "PENDING", dueDate: "2025-04-20T00:00:00Z", paidAt: null,                   razorpayOrderId: null,      razorpayPaymentId: null    },
  ],
};
