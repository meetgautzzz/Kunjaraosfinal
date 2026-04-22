// ── Status & priority types ────────────────────────────────────────────────────

export type ComplianceStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "WAIVED";

export type CompliancePriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

// ── Core item ─────────────────────────────────────────────────────────────────

export type ComplianceItem = {
  id:           string;
  type:         string;        // e.g. "POLICE_NOC"
  name:         string;
  authority:    string;        // issuing body
  description:  string;
  instructions: string;        // how to get it
  status:       ComplianceStatus;
  priority:     CompliancePriority;
  deadline:     string | null; // ISO date
  submittedAt:  string | null;
  approvedAt:   string | null;
  documentName: string | null; // uploaded file name
  documentUrl:  string | null;
  notes:        string;
  fee:          string;        // estimated fee
  processingDays: number;      // typical processing time
};

// ── Master compliance catalogue ───────────────────────────────────────────────

export const COMPLIANCE_CATALOGUE: Omit<ComplianceItem,
  "id"|"status"|"deadline"|"submittedAt"|"approvedAt"|"documentName"|"documentUrl"|"notes">[] = [
  {
    type:           "POLICE_NOC",
    name:           "Police NOC",
    authority:      "Local Police Commissioner / DCP",
    description:    "No Objection Certificate from the police department for holding a public gathering or event.",
    instructions:   "Apply at the local police station or online portal with event details, venue layout, security plan, and expected footfall. Requires 15–30 days processing.",
    priority:       "CRITICAL",
    fee:            "₹500 – ₹5,000",
    processingDays: 15,
  },
  {
    type:           "FIRE_NOC",
    name:           "Fire NOC",
    authority:      "State Fire Department",
    description:    "Fire safety certificate ensuring venue meets fire safety standards including exits, extinguishers, and sprinkler systems.",
    instructions:   "Submit venue fire safety inspection form with building plans. Inspector visits venue and issues NOC after verification.",
    priority:       "CRITICAL",
    fee:            "₹2,000 – ₹15,000",
    processingDays: 10,
  },
  {
    type:           "EXCISE",
    name:           "Excise Permission",
    authority:      "State Excise Department",
    description:    "Required if alcohol will be served at the event. Covers temporary liquor licence for the event duration.",
    instructions:   "Apply for a temporary/occasional liquor licence through the State Excise Department portal. Attach venue NOC and event details.",
    priority:       "HIGH",
    fee:            "₹5,000 – ₹50,000",
    processingDays: 21,
  },
  {
    type:           "SOUND_PERMISSION",
    name:           "Sound / Loudspeaker Permission",
    authority:      "Local Police / District Magistrate",
    description:    "Permission to use loudspeakers, DJs, or live music beyond permissible decibel levels and time limits.",
    instructions:   "Submit Form to local police station specifying sound system details, decibel levels, event hours, and venue address.",
    priority:       "HIGH",
    fee:            "₹200 – ₹2,000",
    processingDays: 7,
  },
  {
    type:           "FSSAI",
    name:           "FSSAI Food Safety Licence",
    authority:      "Food Safety and Standards Authority of India",
    description:    "Mandatory for events where food is served. Covers food vendor registration and hygiene standards compliance.",
    instructions:   "Register on the FSSAI portal (foscos.fssai.gov.in). For events, a temporary/short-term licence is available. Attach caterer's FSSAI licence.",
    priority:       "HIGH",
    fee:            "₹100 – ₹5,000/year",
    processingDays: 7,
  },
  {
    type:           "LOCAL_MUNICIPAL",
    name:           "Local Municipal Permission",
    authority:      "Municipal Corporation / Gram Panchayat",
    description:    "Permission from the local municipal body for use of public or semi-public spaces, road closures, or temporary structures.",
    instructions:   "Apply to the local ward office or municipal corporation with venue layout, event programme, and security arrangements.",
    priority:       "CRITICAL",
    fee:            "₹1,000 – ₹25,000",
    processingDays: 14,
  },
  {
    type:           "TRAFFIC_POLICE",
    name:           "Traffic Police Permission",
    authority:      "Traffic Police Department",
    description:    "Required for events expecting high footfall, road diversions, parking management, or use of public roads.",
    instructions:   "Submit traffic management plan to the Traffic Police HQ. Include parking map, diversion routes, and expected vehicle count.",
    priority:       "MEDIUM",
    fee:            "₹500 – ₹3,000",
    processingDays: 10,
  },
  {
    type:           "HEALTH_DEPARTMENT",
    name:           "Health Department NOC",
    authority:      "District Health Officer / CMHO",
    description:    "Sanitation and health clearance for events serving food or expecting large crowds. Covers medical facilities on site.",
    instructions:   "Submit application to the District Health Office with details of sanitation facilities, first aid arrangements, and caterers.",
    priority:       "MEDIUM",
    fee:            "₹500 – ₹5,000",
    processingDays: 7,
  },
  {
    type:           "IPRS",
    name:           "IPRS Licence",
    authority:      "Indian Performing Right Society",
    description:    "Licence for public performance of music — covers broadcast, live performance, and background music at events.",
    instructions:   "Apply on the IPRS website (iprs.org). Provide event details, expected audience size, and list of songs/performers.",
    priority:       "MEDIUM",
    fee:            "₹2,000 – ₹25,000",
    processingDays: 5,
  },
  {
    type:           "PPL",
    name:           "PPL Licence",
    authority:      "Phonographic Performance Limited",
    description:    "Required for playing recorded music (CDs, streaming, DJ sets) at public events. Separate from IPRS.",
    instructions:   "Apply on PPL India website (pplindia.org). License fee depends on venue capacity and event duration.",
    priority:       "MEDIUM",
    fee:            "₹1,500 – ₹20,000",
    processingDays: 5,
  },
  {
    type:           "NOVEX",
    name:           "Novex Communications Licence",
    authority:      "Novex Communications Pvt. Ltd.",
    description:    "Licence for public performance of songs owned/represented by Novex. Covers T-Series, Sony Music, and others.",
    instructions:   "Contact Novex Communications directly or apply through their authorised agents. Provide event details and playlist.",
    priority:       "LOW",
    fee:            "₹1,000 – ₹15,000",
    processingDays: 3,
  },
];

// ── Event-type → required compliance mapping ──────────────────────────────────

const EVENT_COMPLIANCE_MAP: Record<string, string[]> = {
  "Corporate Gala":    ["POLICE_NOC","FIRE_NOC","SOUND_PERMISSION","LOCAL_MUNICIPAL","FSSAI","TRAFFIC_POLICE","HEALTH_DEPARTMENT","IPRS","PPL"],
  "Conference":        ["POLICE_NOC","FIRE_NOC","LOCAL_MUNICIPAL","HEALTH_DEPARTMENT"],
  "Product Launch":    ["POLICE_NOC","FIRE_NOC","SOUND_PERMISSION","LOCAL_MUNICIPAL","FSSAI","IPRS"],
  "Wedding":           ["POLICE_NOC","FIRE_NOC","EXCISE","SOUND_PERMISSION","LOCAL_MUNICIPAL","FSSAI","HEALTH_DEPARTMENT","IPRS","PPL","NOVEX"],
  "Concert":           ["POLICE_NOC","FIRE_NOC","SOUND_PERMISSION","LOCAL_MUNICIPAL","TRAFFIC_POLICE","IPRS","PPL","NOVEX","EXCISE"],
  "Brand Activation":  ["POLICE_NOC","FIRE_NOC","SOUND_PERMISSION","LOCAL_MUNICIPAL","TRAFFIC_POLICE","FSSAI"],
  "Awards Night":      ["POLICE_NOC","FIRE_NOC","SOUND_PERMISSION","LOCAL_MUNICIPAL","FSSAI","EXCISE","IPRS","PPL"],
  "Team Retreat":      ["POLICE_NOC","FIRE_NOC","FSSAI","HEALTH_DEPARTMENT"],
  "Exhibition":        ["POLICE_NOC","FIRE_NOC","LOCAL_MUNICIPAL","TRAFFIC_POLICE","HEALTH_DEPARTMENT"],
  "Fundraiser":        ["POLICE_NOC","FIRE_NOC","SOUND_PERMISSION","LOCAL_MUNICIPAL","FSSAI","EXCISE"],
  "Sports Event":      ["POLICE_NOC","FIRE_NOC","LOCAL_MUNICIPAL","TRAFFIC_POLICE","HEALTH_DEPARTMENT","FSSAI"],
  "Workshop":          ["FIRE_NOC","LOCAL_MUNICIPAL"],
  "Default":           ["POLICE_NOC","FIRE_NOC","LOCAL_MUNICIPAL"],
};

// ── Generate checklist from event type + event date ───────────────────────────

export function generateChecklist(eventType: string, eventDate: string | null): ComplianceItem[] {
  const types   = EVENT_COMPLIANCE_MAP[eventType] ?? EVENT_COMPLIANCE_MAP["Default"];
  const eventMs = eventDate ? new Date(eventDate).getTime() : Date.now() + 60 * 86400_000;

  return COMPLIANCE_CATALOGUE
    .filter((c) => types.includes(c.type))
    .map((template) => ({
      ...template,
      id:           crypto.randomUUID(),
      status:       "NOT_STARTED" as ComplianceStatus,
      deadline:     new Date(eventMs - template.processingDays * 1.5 * 86400_000).toISOString(),
      submittedAt:  null,
      approvedAt:   null,
      documentName: null,
      documentUrl:  null,
      notes:        "",
    }));
}

// ── Scoring ───────────────────────────────────────────────────────────────────

export function calcScore(items: ComplianceItem[]): number {
  if (!items.length) return 0;
  const weights: Record<CompliancePriority, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  let earned = 0, total = 0;
  for (const item of items) {
    const w = weights[item.priority];
    total   += w;
    if (item.status === "APPROVED") earned += w;
    else if (item.status === "SUBMITTED") earned += w * 0.7;
    else if (item.status === "IN_PROGRESS") earned += w * 0.3;
    else if (item.status === "WAIVED") earned += w;
  }
  return Math.round((earned / total) * 100);
}

// ── Deadline helpers ──────────────────────────────────────────────────────────

export function deadlineState(item: ComplianceItem): "overdue" | "urgent" | "upcoming" | "ok" | null {
  if (!item.deadline) return null;
  if (item.status === "APPROVED" || item.status === "WAIVED") return null;
  const days = Math.ceil((new Date(item.deadline).getTime() - Date.now()) / 86400_000);
  if (days < 0)  return "overdue";
  if (days <= 3) return "urgent";
  if (days <= 7) return "upcoming";
  return "ok";
}

export function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400_000);
}

// ── Status config ─────────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<ComplianceStatus, { label: string; color: string; bg: string; icon: string }> = {
  NOT_STARTED: { label: "Not Started", color: "text-[var(--text-3)]",  bg: "bg-[var(--bg-surface)] border-[var(--border)]", icon: "○" },
  IN_PROGRESS: { label: "In Progress", color: "text-indigo-400",        bg: "bg-indigo-500/15 border-indigo-500/20",          icon: "◐" },
  SUBMITTED:   { label: "Submitted",   color: "text-amber-400",         bg: "bg-amber-500/15 border-amber-500/20",            icon: "⏳" },
  APPROVED:    { label: "Approved",    color: "text-emerald-400",       bg: "bg-emerald-500/15 border-emerald-500/20",        icon: "✓" },
  REJECTED:    { label: "Rejected",    color: "text-red-400",           bg: "bg-red-500/15 border-red-500/20",                icon: "✗" },
  WAIVED:      { label: "Waived",      color: "text-purple-400",        bg: "bg-purple-500/15 border-purple-500/20",          icon: "—" },
};

export const PRIORITY_CONFIG: Record<CompliancePriority, { label: string; dot: string }> = {
  CRITICAL: { label: "Critical", dot: "bg-red-500"    },
  HIGH:     { label: "High",     dot: "bg-amber-500"  },
  MEDIUM:   { label: "Medium",   dot: "bg-indigo-500" },
  LOW:      { label: "Low",      dot: "bg-gray-500"   },
};

// ── Mock data ─────────────────────────────────────────────────────────────────

const base = Date.now();
export const MOCK_ITEMS: ComplianceItem[] = [
  { id:"c1", type:"POLICE_NOC",       name:"Police NOC",                 authority:"DCP Office, Mumbai",         description:"No Objection Certificate from police for public gathering.", instructions:"Apply at local PS with event details.", status:"APPROVED",     priority:"CRITICAL", deadline:new Date(base - 10*86400_000).toISOString(), submittedAt:new Date(base-20*86400_000).toISOString(), approvedAt:new Date(base-10*86400_000).toISOString(), documentName:"police_noc_signed.pdf", documentUrl:"/docs/police_noc.pdf", notes:"", fee:"₹500 – ₹5,000",    processingDays:15 },
  { id:"c2", type:"FIRE_NOC",         name:"Fire NOC",                   authority:"Maharashtra Fire Brigade",   description:"Fire safety certificate for venue.",                         instructions:"Submit venue plans to fire dept.",   status:"SUBMITTED",    priority:"CRITICAL", deadline:new Date(base + 3*86400_000).toISOString(),  submittedAt:new Date(base-5*86400_000).toISOString(),  approvedAt:null,                                      documentName:"fire_noc_application.pdf",documentUrl:null,                  notes:"Inspector visit scheduled for Apr 10.", fee:"₹2,000 – ₹15,000",  processingDays:10 },
  { id:"c3", type:"EXCISE",           name:"Excise Permission",          authority:"State Excise Department",    description:"Temporary liquor licence for event.",                        instructions:"Apply via state excise portal.",     status:"IN_PROGRESS",  priority:"HIGH",     deadline:new Date(base + 6*86400_000).toISOString(),  submittedAt:null,                                      approvedAt:null,                                      documentName:null,                     documentUrl:null,                  notes:"Application number: EXC-2025-4471", fee:"₹5,000 – ₹50,000",  processingDays:21 },
  { id:"c4", type:"SOUND_PERMISSION", name:"Sound / Loudspeaker",        authority:"Traffic Police HQ",          description:"Permission for loudspeakers & live music.",                 instructions:"Submit to local police station.",   status:"APPROVED",     priority:"HIGH",     deadline:new Date(base - 5*86400_000).toISOString(),  submittedAt:new Date(base-15*86400_000).toISOString(),approvedAt:new Date(base-5*86400_000).toISOString(),  documentName:"sound_permission.pdf",   documentUrl:"/docs/sound.pdf",     notes:"Valid until Apr 12, 11pm", fee:"₹200 – ₹2,000",     processingDays:7  },
  { id:"c5", type:"FSSAI",            name:"FSSAI Food Safety Licence",  authority:"FSSAI, Mumbai",              description:"Food safety licence for catering vendors.",                 instructions:"Register on foscos.fssai.gov.in.",  status:"APPROVED",     priority:"HIGH",     deadline:new Date(base - 8*86400_000).toISOString(),  submittedAt:new Date(base-20*86400_000).toISOString(),approvedAt:new Date(base-8*86400_000).toISOString(),  documentName:"fssai_licence.pdf",      documentUrl:"/docs/fssai.pdf",     notes:"Caterer FSSAI: 10724xxxxxx", fee:"₹100 – ₹5,000/year",processingDays:7  },
  { id:"c6", type:"LOCAL_MUNICIPAL",  name:"Local Municipal Permission", authority:"BMC Ward Office, Mumbai",    description:"Municipal permission for venue and structures.",            instructions:"Apply to ward office with venue layout.", status:"IN_PROGRESS",priority:"CRITICAL", deadline:new Date(base + 2*86400_000).toISOString(),  submittedAt:null,                                      approvedAt:null,                                      documentName:null,                     documentUrl:null,                  notes:"Follow-up scheduled with ward officer tomorrow.", fee:"₹1,000 – ₹25,000",processingDays:14 },
  { id:"c7", type:"TRAFFIC_POLICE",   name:"Traffic Police Permission",  authority:"Traffic Police, Mumbai",     description:"Traffic management and road diversion approval.",           instructions:"Submit traffic plan to Traffic HQ.", status:"NOT_STARTED",  priority:"MEDIUM",   deadline:new Date(base + 5*86400_000).toISOString(),  submittedAt:null,                                      approvedAt:null,                                      documentName:null,                     documentUrl:null,                  notes:"", fee:"₹500 – ₹3,000",    processingDays:10 },
  { id:"c8", type:"HEALTH_DEPARTMENT",name:"Health Department NOC",      authority:"MCGM Health Dept",           description:"Sanitation and health clearance.",                          instructions:"Submit to District Health Office.",  status:"NOT_STARTED",  priority:"MEDIUM",   deadline:new Date(base + 8*86400_000).toISOString(),  submittedAt:null,                                      approvedAt:null,                                      documentName:null,                     documentUrl:null,                  notes:"", fee:"₹500 – ₹5,000",    processingDays:7  },
  { id:"c9", type:"IPRS",             name:"IPRS Licence",               authority:"Indian Performing Right Society", description:"Licence for public performance of music.",           instructions:"Apply on iprs.org.",                 status:"SUBMITTED",    priority:"MEDIUM",   deadline:new Date(base + 4*86400_000).toISOString(),  submittedAt:new Date(base-3*86400_000).toISOString(),  approvedAt:null,                                      documentName:"iprs_application.pdf",   documentUrl:null,                  notes:"Reference: IPRS-2025-88234", fee:"₹2,000 – ₹25,000",  processingDays:5  },
  { id:"c10",type:"PPL",              name:"PPL Licence",                authority:"Phonographic Performance Limited", description:"Licence for playing recorded music.",             instructions:"Apply on pplindia.org.",             status:"NOT_STARTED",  priority:"MEDIUM",   deadline:new Date(base + 5*86400_000).toISOString(),  submittedAt:null,                                      approvedAt:null,                                      documentName:null,                     documentUrl:null,                  notes:"", fee:"₹1,500 – ₹20,000",  processingDays:5  },
  { id:"c11",type:"NOVEX",            name:"Novex Communications",       authority:"Novex Communications Pvt. Ltd.", description:"Licence for T-Series/Sony songs at event.",           instructions:"Contact Novex directly.",            status:"NOT_STARTED",  priority:"LOW",      deadline:new Date(base + 7*86400_000).toISOString(),  submittedAt:null,                                      approvedAt:null,                                      documentName:null,                     documentUrl:null,                  notes:"", fee:"₹1,000 – ₹15,000",  processingDays:3  },
];
