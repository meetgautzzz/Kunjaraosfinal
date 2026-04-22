"use client";

import { useState } from "react";
import { generateChecklist, ComplianceItem } from "@/lib/compliance";

const EVENT_TYPES = [
  "Corporate Gala", "Conference", "Product Launch", "Wedding",
  "Concert", "Brand Activation", "Awards Night", "Team Retreat",
  "Exhibition", "Fundraiser", "Sports Event", "Workshop",
];

interface Props {
  onGenerate: (items: ComplianceItem[]) => void;
  onClose: () => void;
}

export default function GenerateModal({ onGenerate, onClose }: Props) {
  const [eventType, setEventType] = useState("Corporate Gala");
  const [eventDate, setEventDate] = useState("");
  const [eventName, setEventName] = useState("");

  function handleGenerate() {
    const items = generateChecklist(eventType, eventDate || null);
    onGenerate(items);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="px-6 py-5 border-b border-[var(--border)]">
          <h3 className="text-[var(--text-1)] font-bold text-base">Generate Compliance Checklist</h3>
          <p className="text-[var(--text-3)] text-xs mt-0.5">Auto-select required permits based on your event type.</p>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Event name */}
          <div>
            <label className="text-[var(--text-2)] text-xs font-medium mb-1.5 block">Event Name (optional)</label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g. Gala Night 2025"
              className="w-full bg-[var(--bg-surface)] border border-[var(--border)] focus:border-indigo-500/60 rounded-lg px-3 py-2 text-sm text-[var(--text-1)] outline-none placeholder:text-[var(--text-3)]"
            />
          </div>

          {/* Event type */}
          <div>
            <label className="text-[var(--text-2)] text-xs font-medium mb-1.5 block">Event Type <span className="text-red-400">*</span></label>
            <div className="flex flex-wrap gap-1.5">
              {EVENT_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setEventType(t)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                    eventType === t
                      ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400"
                      : "border-[var(--border)] text-[var(--text-3)] hover:text-[var(--text-2)]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Event date */}
          <div>
            <label className="text-[var(--text-2)] text-xs font-medium mb-1.5 block">Event Date (for deadline calculation)</label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full bg-[var(--bg-surface)] border border-[var(--border)] focus:border-indigo-500/60 rounded-lg px-3 py-2 text-sm text-[var(--text-1)] outline-none"
              style={{ colorScheme: "dark" }}
            />
            <p className="text-[var(--text-3)] text-[11px] mt-1">Deadlines are calculated backward from this date using processing times.</p>
          </div>

          {/* Preview */}
          <PermitPreview eventType={eventType} />
        </div>

        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors"
          >
            Generate Checklist
          </button>
        </div>
      </div>
    </div>
  );
}

function PermitPreview({ eventType }: { eventType: string }) {
  const COMPLIANCE_MAP: Record<string, string[]> = {
    "Corporate Gala":    ["Police NOC","Fire NOC","Sound Permission","Municipal","FSSAI","Traffic","Health Dept","IPRS","PPL"],
    "Conference":        ["Police NOC","Fire NOC","Municipal","Health Dept"],
    "Product Launch":    ["Police NOC","Fire NOC","Sound","Municipal","FSSAI","IPRS"],
    "Wedding":           ["Police NOC","Fire NOC","Excise","Sound","Municipal","FSSAI","Health","IPRS","PPL","Novex"],
    "Concert":           ["Police NOC","Fire NOC","Sound","Municipal","Traffic","IPRS","PPL","Novex","Excise"],
    "Brand Activation":  ["Police NOC","Fire NOC","Sound","Municipal","Traffic","FSSAI"],
    "Awards Night":      ["Police NOC","Fire NOC","Sound","Municipal","FSSAI","Excise","IPRS","PPL"],
    "Team Retreat":      ["Police NOC","Fire NOC","FSSAI","Health Dept"],
    "Exhibition":        ["Police NOC","Fire NOC","Municipal","Traffic","Health Dept"],
    "Fundraiser":        ["Police NOC","Fire NOC","Sound","Municipal","FSSAI","Excise"],
    "Sports Event":      ["Police NOC","Fire NOC","Municipal","Traffic","Health Dept","FSSAI"],
    "Workshop":          ["Fire NOC","Municipal"],
  };
  const permits = COMPLIANCE_MAP[eventType] ?? ["Police NOC","Fire NOC","Municipal"];
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3.5 py-3">
      <p className="text-[var(--text-3)] text-[11px] uppercase tracking-wide font-medium mb-2">{permits.length} permits required</p>
      <div className="flex flex-wrap gap-1.5">
        {permits.map((p) => (
          <span key={p} className="text-[11px] text-[var(--text-2)] bg-[var(--bg-card)] border border-[var(--border)] px-2 py-0.5 rounded font-medium">{p}</span>
        ))}
      </div>
    </div>
  );
}
