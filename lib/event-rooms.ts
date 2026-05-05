// ── Types ─────────────────────────────────────────────────────────────────────

export type RoomStatus =
  | "draft"
  | "discussion"
  | "revision"
  | "approved"
  | "won"
  | "lost";

export type CommentType  = "comment" | "request_change" | "approval";
export type AuthorType   = "planner" | "client";
export type SectionRef   =
  | "concept" | "budget" | "timeline" | "vendors"
  | "visual"  | "compliance" | "experience" | "activation"
  | null;

export interface EventRoom {
  id:           string;
  proposal_id:  string;
  planner_id:   string;
  client_name:  string;
  client_email: string | null;
  status:       RoomStatus;
  deal_value:   number;
  created_at:   string;
  updated_at:   string;
}

export interface RoomComment {
  id:            string;
  event_room_id: string;
  author_id:     string;
  author_name:   string;
  author_type:   AuthorType;
  message:       string;
  section_ref:   SectionRef;
  type:          CommentType;
  parent_id:     string | null;
  created_at:    string;
  replies?:      RoomComment[];  // hydrated client-side
}

export interface ProposalVersion {
  id:             string;
  event_room_id:  string;
  proposal_id:    string;
  version_number: number;
  data_snapshot:  Record<string, unknown>;
  label:          string | null;
  created_by:     string | null;
  created_at:     string;
}

// ── State machine ─────────────────────────────────────────────────────────────

// Adjacency list — only these transitions are valid.
const TRANSITIONS: Partial<Record<RoomStatus, RoomStatus[]>> = {
  draft:      ["discussion", "lost"],
  discussion: ["revision", "approved", "lost"],
  revision:   ["discussion", "lost"],
  approved:   ["won", "lost"],
  // won + lost are terminal — no outbound edges
};

export function canTransition(from: RoomStatus, to: RoomStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

// Proposal-level side effects applied when a room changes state.
// These are patched into proposals.data via the existing PATCH route.
export type ProposalStatusPatch = {
  status?: "DRAFT" | "GENERATED" | "SAVED" | "SENT" | "APPROVED" | "CHANGES_REQUESTED" | "LOST";
  isLocked?: boolean;
};

export function proposalPatchForTransition(to: RoomStatus): ProposalStatusPatch {
  switch (to) {
    case "discussion": return { status: "SENT" };
    case "revision":   return { status: "CHANGES_REQUESTED" };
    case "approved":   return { status: "APPROVED", isLocked: true };
    case "won":        return { status: "APPROVED" };
    case "lost":       return { status: "LOST" };
    default:           return {};
  }
}

// Whether a snapshot should be auto-created on transition.
export function shouldSnapshot(to: RoomStatus): boolean {
  return to === "revision" || to === "approved";
}

// Human label for each status.
export const ROOM_STATUS_LABEL: Record<RoomStatus, string> = {
  draft:      "Draft",
  discussion: "In Discussion",
  revision:   "Revision",
  approved:   "Approved",
  won:        "Won",
  lost:       "Lost",
};

export const ROOM_STATUS_COLOR: Record<RoomStatus, string> = {
  draft:      "#4A4535",
  discussion: "#2F7A78",
  revision:   "#D4A85F",
  approved:   "#34d399",
  won:        "#34d399",
  lost:       "#f87171",
};
