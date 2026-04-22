"use client";

import { useState } from "react";
import { formatINR, PAYMENT_STATUS_STYLES } from "@/lib/room";
import type { EventRoom, RoomPayment } from "@/lib/room";

type Props = { room: EventRoom; readOnly?: boolean; onPay?: (paymentId: string) => void };

export default function RoomPayments({ room, readOnly, onPay }: Props) {
  const paid    = room.payments.filter((p) => p.status === "PAID");
  const pending = room.payments.filter((p) => p.status !== "PAID");
  const paidAmt = paid.reduce((s, p) => s + p.amount, 0);
  const totalAmt= room.totalAmount ?? room.payments.reduce((s, p) => s + p.amount, 0);
  const pct     = totalAmt > 0 ? (paidAmt / totalAmt) * 100 : 0;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[var(--text-3)] text-xs">Total Contract Value</p>
            <p className="text-[var(--text-1)] text-2xl font-black tabular-nums">{formatINR(totalAmt)}</p>
          </div>
          <div className="text-right">
            <p className="text-[var(--text-3)] text-xs">Amount Paid</p>
            <p className="text-emerald-400 text-xl font-bold tabular-nums">{formatINR(paidAmt)}</p>
          </div>
        </div>
        <div className="space-y-1">
          <div className="h-2.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }} />
          </div>
          <p className="text-[var(--text-3)] text-xs text-right">{pct.toFixed(0)}% received</p>
        </div>
      </div>

      {/* Payment schedule */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--bg-surface)]">
          <p className="text-[var(--text-1)] text-sm font-semibold">Payment Schedule</p>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {room.payments.length === 0 && (
            <p className="text-[var(--text-3)] text-sm text-center py-10">No payment milestones added yet.</p>
          )}
          {room.payments.map((p) => (
            <PaymentRow key={p.id} payment={p} readOnly={readOnly} onPay={onPay} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PaymentRow({ payment: p, readOnly, onPay }: {
  payment: RoomPayment; readOnly?: boolean;
  onPay?: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    setLoading(true);
    try { await onPay?.(p.id); }
    finally { setLoading(false); }
  }

  const isPaid    = p.status === "PAID";
  const isOverdue = p.dueDate && new Date(p.dueDate) < new Date() && !isPaid;

  return (
    <div className="flex items-center gap-4 px-5 py-4 hover:bg-[var(--bg-hover)] transition-colors">
      {/* Icon */}
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0 ${
        isPaid ? "bg-emerald-500/15" : "bg-[var(--bg-surface)] border border-[var(--border)]"
      }`}>
        {isPaid ? "✓" : "₹"}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[var(--text-1)] text-sm font-medium">{p.label}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {p.dueDate && (
            <p className={`text-xs ${isOverdue ? "text-red-400 font-medium" : "text-[var(--text-3)]"}`}>
              {isOverdue ? "Overdue · " : "Due "}
              {new Date(p.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          )}
          {isPaid && p.paidAt && (
            <p className="text-emerald-400 text-xs">
              · Paid {new Date(p.paidAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </p>
          )}
        </div>
      </div>

      {/* Amount */}
      <span className="text-[var(--text-1)] font-bold text-sm tabular-nums shrink-0">
        {formatINR(p.amount)}
      </span>

      {/* Status / Pay button */}
      {isPaid ? (
        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full shrink-0 ${PAYMENT_STATUS_STYLES.PAID}`}>
          Paid
        </span>
      ) : readOnly ? (
        <button
          onClick={handlePay}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-xs font-semibold transition-colors shrink-0"
        >
          {loading ? "…" : "Pay Now"}
        </button>
      ) : (
        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full shrink-0 ${PAYMENT_STATUS_STYLES[p.status]}`}>
          {p.status}
        </span>
      )}
    </div>
  );
}
