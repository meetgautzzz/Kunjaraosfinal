"use client";

import { useState } from "react";
import { formatINR } from "@/lib/room";
import type { EventRoom, VendorEntry } from "@/lib/room";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:   "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  PENDING:  "bg-amber-500/15 text-amber-400 border-amber-500/20",
  INACTIVE: "bg-gray-500/15 text-gray-400 border-gray-500/20",
};

const CATEGORIES = ["Venue","Catering","AV & Technology","Décor & Design","Entertainment","Photography","Logistics","Security","Other"];

export default function RoomVendors({ room, readOnly, onChange }: {
  room: EventRoom; readOnly?: boolean;
  onChange?: (vendors: VendorEntry[]) => void;
}) {
  const [vendors, setVendors] = useState<VendorEntry[]>(room.vendorData ?? []);
  const [saved,   setSaved]   = useState(false);

  if (!vendors.length && readOnly) return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center text-xl mb-3">🏪</div>
      <p className="text-[var(--text-3)] text-sm">No vendors listed yet.</p>
    </div>
  );

  function update(id: string, patch: Partial<VendorEntry>) {
    const next = vendors.map((v) => v.id === id ? { ...v, ...patch } : v);
    setVendors(next); onChange?.(next);
  }

  function add() {
    const next: VendorEntry[] = [...vendors, {
      id: crypto.randomUUID(), name: "", category: "Venue", status: "PENDING", role: "", fee: 0,
    }];
    setVendors(next); onChange?.(next);
  }

  function remove(id: string) {
    const next = vendors.filter((v) => v.id !== id);
    setVendors(next); onChange?.(next);
  }

  function handleSave() {
    setSaved(true); setTimeout(() => setSaved(false), 2000);
    onChange?.(vendors);
  }

  // Group by category
  const grouped: Record<string, VendorEntry[]> = {};
  for (const v of vendors) {
    if (!grouped[v.category]) grouped[v.category] = [];
    grouped[v.category].push(v);
  }

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="flex items-center justify-between">
          <p className="text-[var(--text-3)] text-xs">{vendors.length} vendor{vendors.length !== 1 ? "s" : ""}</p>
          <div className="flex gap-2">
            <button onClick={add}
              className="px-3 py-1.5 rounded-lg border border-dashed border-[var(--border)] text-[var(--text-3)] hover:border-indigo-500/40 hover:text-indigo-400 text-xs transition-colors">
              + Add Vendor
            </button>
            <button onClick={handleSave}
              className="px-3 py-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/25 text-xs font-medium transition-colors">
              {saved ? "✓ Saved" : "Save"}
            </button>
          </div>
        </div>
      )}

      {Object.entries(grouped).map(([cat, cvs]) => (
        <div key={cat} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
          <div className="px-4 py-3 bg-[var(--bg-surface)] border-b border-[var(--border)] flex items-center justify-between">
            <span className="text-[var(--text-1)] text-sm font-semibold">{cat}</span>
            <span className="text-[var(--text-3)] text-xs">{cvs.length} vendor{cvs.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {cvs.map((v) => (
              <VendorRow key={v.id} vendor={v} readOnly={readOnly} onChange={(patch) => update(v.id, patch)} onRemove={() => remove(v.id)} />
            ))}
          </div>
        </div>
      ))}

      {!readOnly && vendors.length === 0 && (
        <button onClick={add}
          className="w-full py-8 rounded-xl border border-dashed border-[var(--border)] text-[var(--text-3)] hover:border-indigo-500/40 hover:text-indigo-400 text-sm transition-colors">
          + Add your first vendor
        </button>
      )}
    </div>
  );
}

function VendorRow({ vendor: v, readOnly, onChange, onRemove }: {
  vendor: VendorEntry; readOnly?: boolean;
  onChange: (patch: Partial<VendorEntry>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors group">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-indigo-300 text-sm font-bold shrink-0">
        {v.name ? v.name[0].toUpperCase() : "?"}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-3">
        {readOnly ? (
          <p className="text-[var(--text-1)] text-sm font-medium truncate">{v.name || "—"}</p>
        ) : (
          <input value={v.name} onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Vendor name..."
            className="text-[var(--text-1)] text-sm font-medium bg-transparent border-b border-transparent hover:border-[var(--border)] focus:border-indigo-500/60 outline-none transition-colors" />
        )}
        {readOnly ? (
          <p className="text-[var(--text-2)] text-xs truncate">{v.role || "—"}</p>
        ) : (
          <input value={v.role ?? ""} onChange={(e) => onChange({ role: e.target.value })}
            placeholder="Role / scope..."
            className="text-[var(--text-2)] text-xs bg-transparent border-b border-transparent hover:border-[var(--border)] focus:border-indigo-500/60 outline-none transition-colors" />
        )}
        {readOnly ? (
          <p className="text-[var(--text-2)] text-xs tabular-nums">{v.fee ? formatINR(v.fee) : "—"}</p>
        ) : (
          <input type="number" value={v.fee ?? 0} onChange={(e) => onChange({ fee: Number(e.target.value) })}
            className="text-[var(--text-2)] text-xs bg-transparent border-b border-transparent hover:border-[var(--border)] focus:border-indigo-500/60 outline-none transition-colors tabular-nums text-right sm:text-left" />
        )}
      </div>

      {/* Status */}
      {readOnly ? (
        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border shrink-0 ${STATUS_STYLES[v.status]}`}>
          {v.status}
        </span>
      ) : (
        <select value={v.status} onChange={(e) => onChange({ status: e.target.value as any })}
          className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg px-2 py-1 text-xs text-[var(--text-2)] outline-none focus:border-indigo-500/60 cursor-pointer shrink-0">
          <option value="ACTIVE">Active</option>
          <option value="PENDING">Pending</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      )}

      {!readOnly && (
        <button onClick={onRemove}
          className="text-[var(--text-3)] hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-all shrink-0">✕</button>
      )}
    </div>
  );
}
