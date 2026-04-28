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

