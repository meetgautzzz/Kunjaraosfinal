export type PaymentStatus = "REQUESTED" | "PAID" | "CONFIRMED" | "CANCELLED";
export type PaymentMethod = "UPI" | "BANK";

export type ProposalPayment = {
  id:              string;
  proposalId:      string;
  amount:          number;        // INR paise? No — store rupees as integer for simplicity
  currency:        string;
  description:     string;
  dueDate:         string | null; // ISO date
  method:          PaymentMethod;
  paymentTarget:   string;        // UPI id or bank-detail blob shown to client
  status:          PaymentStatus;
  payerName:       string | null;
  payerReference:  string | null; // UTR / txn id from client
  payerNote:       string | null;
  submittedAt:     string | null;
  confirmedAt:     string | null;
  plannerNotes:    string;
  createdAt:       string;
  updatedAt:       string;
};

// DB row shape (snake_case) — what Supabase returns.
export type ProposalPaymentRow = {
  id:              string;
  proposal_id:     string;
  user_id:         string;
  amount:          number;
  currency:        string;
  description:     string;
  due_date:        string | null;
  method:          PaymentMethod;
  payment_target:  string;
  status:          PaymentStatus;
  payer_name:      string | null;
  payer_reference: string | null;
  payer_note:      string | null;
  submitted_at:    string | null;
  confirmed_at:    string | null;
  planner_notes:   string;
  created_at:      string;
  updated_at:      string;
};

export function rowToPayment(row: ProposalPaymentRow): ProposalPayment {
  return {
    id:             row.id,
    proposalId:     row.proposal_id,
    amount:         row.amount,
    currency:       row.currency,
    description:    row.description,
    dueDate:        row.due_date,
    method:         row.method,
    paymentTarget:  row.payment_target,
    status:         row.status,
    payerName:      row.payer_name,
    payerReference: row.payer_reference,
    payerNote:      row.payer_note,
    submittedAt:    row.submitted_at,
    confirmedAt:    row.confirmed_at,
    plannerNotes:   row.planner_notes,
    createdAt:      row.created_at,
    updatedAt:      row.updated_at,
  };
}

export const PAYMENT_STATUS_STYLES: Record<PaymentStatus, { label: string; bg: string; text: string }> = {
  REQUESTED: { label: "Awaiting payment",     bg: "bg-amber-500/15",   text: "text-amber-400"   },
  PAID:      { label: "Paid · verifying",     bg: "bg-indigo-500/15",  text: "text-indigo-400"  },
  CONFIRMED: { label: "Confirmed",            bg: "bg-emerald-500/15", text: "text-emerald-400" },
  CANCELLED: { label: "Cancelled",            bg: "bg-gray-500/15",    text: "text-gray-400"    },
};
