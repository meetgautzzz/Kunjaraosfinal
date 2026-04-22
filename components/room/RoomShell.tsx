"use client";

import { useState } from "react";
import type { EventRoom, TimelinePhase, VendorEntry, RoomTask } from "@/lib/room";
import { APPROVAL_STYLES, APPROVAL_LABELS, formatINR } from "@/lib/room";
import RoomProposal  from "./RoomProposal";
import RoomBudget    from "./RoomBudget";
import RoomTimeline  from "./RoomTimeline";
import RoomVendors   from "./RoomVendors";
import RoomTasks     from "./RoomTasks";
import RoomPayments  from "./RoomPayments";
import RoomApprovals from "./RoomApprovals";

type Tab = "proposal" | "budget" | "timeline" | "vendors" | "tasks" | "payments" | "approvals";

type Props = {
  room:         EventRoom;
  readOnly?:    boolean;  // client view
  onRoomChange?:(room: EventRoom) => void;
};

export default function RoomShell({ room: initialRoom, readOnly, onRoomChange }: Props) {
  const [room, setRoom] = useState<EventRoom>(initialRoom);
  const [tab,  setTab]  = useState<Tab>("proposal");

  function updateRoom(patch: Partial<EventRoom>) {
    const next = { ...room, ...patch };
    setRoom(next);
    onRoomChange?.(next);
  }

  // Build visible tabs
  const ALL_TABS: { id: Tab; label: string; icon: string; show: boolean }[] = [
    { id: "proposal",  label: "Proposal",  icon: "✦", show: room.showProposal  },
    { id: "budget",    label: "Budget",    icon: "₹", show: room.showBudget    },
    { id: "timeline",  label: "Timeline",  icon: "⏱", show: room.showTimeline  },
    { id: "vendors",   label: "Vendors",   icon: "🏪", show: room.showVendors  },
    { id: "tasks",     label: "Tasks",     icon: "✓", show: room.showTasks     },
    { id: "payments",  label: "Payments",  icon: "💳", show: room.showPayments },
    { id: "approvals", label: "Approvals", icon: "📋", show: room.showApprovals},
  ];
  const TABS = ALL_TABS.filter((t) => t.show);

  const paidAmt  = room.payments.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0);
  const totalAmt = room.totalAmount ?? room.payments.reduce((s, p) => s + p.amount, 0);
  const doneTasks= room.tasks.filter((t) => t.status === "DONE").length;

  return (
    <div className="space-y-0">
      {/* ── Room header ──────────────────────────────────────────────────── */}
      <div className={`${readOnly ? "border-b border-[var(--border)] bg-[var(--bg-surface)] px-6 py-6" : "mb-6"}`}>
        {readOnly && (
          <div className="max-w-5xl mx-auto">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-md bg-indigo-500 flex items-center justify-center text-white text-xs font-black">K</div>
                  <span className="text-[var(--text-3)] text-sm">KUNJARA OS · Event Room</span>
                </div>
                <h1 className="text-[var(--text-1)] text-2xl font-black">{room.title}</h1>
                {room.clientName && <p className="text-[var(--text-2)] text-sm mt-1">Prepared for {room.clientName}</p>}
              </div>
              <div className="flex items-center gap-3">
                {/* Approval badge */}
                <span className={`text-xs font-medium px-3 py-1.5 rounded-full border ${APPROVAL_STYLES[room.approvalStatus]}`}>
                  {APPROVAL_LABELS[room.approvalStatus]}
                </span>
              </div>
            </div>

            {/* Stats row */}
            {totalAmt > 0 && (
              <div className="flex gap-6 mt-5 flex-wrap">
                <Stat label="Total Value"   value={formatINR(totalAmt)}                      />
                <Stat label="Amount Paid"   value={formatINR(paidAmt)}  accent="emerald"     />
                <Stat label="Balance Due"   value={formatINR(totalAmt - paidAmt)} accent="amber" />
                {room.tasks.length > 0 && (
                  <Stat label="Tasks"       value={`${doneTasks}/${room.tasks.length} done`} />
                )}
              </div>
            )}
          </div>
        )}

        {!readOnly && (
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-1)]">{room.title}</h2>
              <p className="text-[var(--text-2)] text-sm mt-0.5">
                {room.clientName && <span>Client: <strong>{room.clientName}</strong> · </span>}
                <span className="font-mono text-indigo-400 select-all">/room/{room.token}</span>
                <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/room/${room.token}`)}
                  className="ml-2 text-[var(--text-3)] hover:text-indigo-400 text-xs transition-colors">
                  Copy link
                </button>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium px-3 py-1.5 rounded-full border ${APPROVAL_STYLES[room.approvalStatus]}`}>
                {APPROVAL_LABELS[room.approvalStatus]}
              </span>
              <span className="text-[var(--text-3)] text-xs border border-[var(--border)] px-2.5 py-1 rounded-lg">
                {room.viewCount} views
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      <div className={`${readOnly ? "max-w-5xl mx-auto px-6 pt-4" : ""}`}>
        <div className="flex gap-1 overflow-x-auto pb-1 border-b border-[var(--border)]">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id as Tab)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                tab === t.id
                  ? "border-indigo-500 text-[var(--text-1)]"
                  : "border-transparent text-[var(--text-3)] hover:text-[var(--text-2)]"
              }`}>
              <span className="text-xs">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ──────────────────────────────────────────────────── */}
      <div className={`${readOnly ? "max-w-5xl mx-auto px-6 py-8" : "py-6"}`}>
        {tab === "proposal"  && <RoomProposal  room={room} readOnly={readOnly} />}
        {tab === "budget"    && <RoomBudget    room={room} readOnly={readOnly} />}
        {tab === "timeline"  && (
          <RoomTimeline room={room} readOnly={readOnly}
            onChange={(phases) => updateRoom({ timelineData: phases })} />
        )}
        {tab === "vendors"   && (
          <RoomVendors  room={room} readOnly={readOnly}
            onChange={(vendors) => updateRoom({ vendorData: vendors })} />
        )}
        {tab === "tasks"     && (
          <RoomTasks    room={room} readOnly={readOnly}
            onChange={(tasks) => updateRoom({ tasks })} />
        )}
        {tab === "payments"  && (
          <RoomPayments room={room} readOnly={readOnly}
            onPay={async (paymentId) => {
              // Real: initiate Razorpay payment here
              console.log("Pay:", paymentId);
            }} />
        )}
        {tab === "approvals" && (
          <RoomApprovals room={room} readOnly={readOnly}
            onApprove={async (data) => {
              // Real: POST /api/rooms/public/:token/approve
              updateRoom({ approvalStatus: data.approved ? "APPROVED" : "REVISION_REQUESTED" });
            }} />
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: "emerald" | "amber" }) {
  return (
    <div>
      <p className="text-[var(--text-3)] text-xs">{label}</p>
      <p className={`text-base font-bold tabular-nums ${
        accent === "emerald" ? "text-emerald-400" :
        accent === "amber"   ? "text-amber-400"   : "text-[var(--text-1)]"
      }`}>{value}</p>
    </div>
  );
}
