"use client";

import { useState } from "react";

type Vendor = {
  name:     string;
  email:    string;
  phone:    string;
  category: string;
  events:   number;
  rating:   number;
  active:   boolean;
  notes:    string;
};

const SEED: Vendor[] = [
  { name: "Apex Events Co.",       email: "apex@events.com",    phone: "+91 98200 00001", category: "Catering",    events: 14, rating: 5, active: true,  notes: "" },
  { name: "SoundWave Productions", email: "sw@sound.io",        phone: "+91 98200 00002", category: "AV & Sound",  events: 9,  rating: 4, active: true,  notes: "" },
  { name: "Luxe Décor Studio",     email: "luxe@decor.co",      phone: "+91 98200 00003", category: "Decoration",  events: 11, rating: 5, active: true,  notes: "" },
  { name: "Vertex Photography",    email: "vertex@photo.com",   phone: "+91 98200 00004", category: "Photography", events: 7,  rating: 4, active: false, notes: "" },
  { name: "ZenSpace Venues",       email: "hello@zenspace.io",  phone: "+91 98200 00005", category: "Venue",       events: 5,  rating: 3, active: true,  notes: "" },
  { name: "Gourmet Masters",       email: "info@gourmet.co",    phone: "+91 98200 00006", category: "Catering",    events: 8,  rating: 4, active: true,  notes: "" },
];

const CATEGORIES = [
  "Catering", "Venue", "AV & Sound", "Decoration", "Photography",
  "Entertainment", "Logistics", "Security", "Flowers", "Other",
];

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>(SEED);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = vendors.filter((v) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      v.name.toLowerCase().includes(q) ||
      v.email.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q)
    );
  });

  function handleAdd(v: Vendor) {
    setVendors((curr) => [v, ...curr]);
    setModalOpen(false);
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-1)]">Vendors</h2>
          <p className="text-[var(--text-2)] text-sm mt-1">
            {vendors.length} vendor{vendors.length === 1 ? "" : "s"} in your workspace.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors"
        >
          + Add Vendor
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] max-w-sm">
        <svg className="w-4 h-4 text-[var(--text-3)] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search vendors..."
          className="flex-1 bg-transparent text-[var(--text-1)] text-sm placeholder:text-[var(--text-3)] outline-none"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {["Vendor", "Category", "Phone", "Events", "Rating", "Status"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[var(--text-3)] text-xs font-medium uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((v, i) => (
                <tr key={`${v.email}-${i}`} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-hover)] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center text-sm font-bold text-indigo-300 shrink-0">
                        {v.name[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[var(--text-1)] font-medium truncate">{v.name}</p>
                        <p className="text-[var(--text-3)] text-xs truncate">{v.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[var(--text-2)]">{v.category}</td>
                  <td className="px-5 py-4 text-[var(--text-2)]">{v.phone || "—"}</td>
                  <td className="px-5 py-4 text-[var(--text-2)]">{v.events}</td>
                  <td className="px-5 py-4">
                    <span className="text-amber-400 font-medium">
                      {"★".repeat(v.rating)}
                      {"☆".repeat(5 - v.rating)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${v.active ? "bg-emerald-500/15 text-emerald-400" : "bg-gray-500/15 text-gray-400"}`}>
                      {v.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-[var(--text-3)] text-sm">
                    No vendors match &quot;{search}&quot;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[10px] text-[var(--text-3)]/70 text-center">
        Vendors are local to this session. Cloud sync is rolling out soon —
        your saved proposals are already persisted.
      </p>

      {modalOpen && <AddVendorModal onClose={() => setModalOpen(false)} onSubmit={handleAdd} />}
    </div>
  );
}

function AddVendorModal({
  onClose, onSubmit,
}: {
  onClose: () => void;
  onSubmit: (v: Vendor) => void;
}) {
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [phone,    setPhone]    = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [rating,   setRating]   = useState(4);
  const [active,   setActive]   = useState(true);
  const [notes,    setNotes]    = useState("");
  const [error,    setError]    = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Vendor name is required.");
    if (email && !/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Enter a valid email.");

    onSubmit({
      name:     name.trim(),
      email:    email.trim(),
      phone:    phone.trim(),
      category,
      events:   0,
      rating,
      active,
      notes:    notes.trim(),
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl shadow-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h3 className="text-[var(--text-1)] font-semibold text-base">Add Vendor</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-3)] hover:text-[var(--text-1)] text-lg leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[var(--text-2)] text-xs font-medium mb-1.5">
                Vendor Name <span className="text-red-400">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Apex Events Co."
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)]/70 focus:border-indigo-500/40 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-[var(--text-2)] text-xs font-medium mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-1)] focus:border-indigo-500/40 focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[var(--text-2)] text-xs font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@vendor.com"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)]/70 focus:border-indigo-500/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[var(--text-2)] text-xs font-medium mb-1.5">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98xxx xxxxx"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)]/70 focus:border-indigo-500/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[var(--text-2)] text-xs font-medium mb-1.5">Rating</label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-1)] focus:border-indigo-500/40 focus:outline-none"
              >
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>
                    {"★".repeat(r)}{"☆".repeat(5 - r)} ({r})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[var(--text-2)] text-xs font-medium mb-1.5">Status</label>
              <select
                value={active ? "active" : "inactive"}
                onChange={(e) => setActive(e.target.value === "active")}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-1)] focus:border-indigo-500/40 focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[var(--text-2)] text-xs font-medium mb-1.5">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                placeholder="Rate card, specialities, past events…"
                rows={3}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)]/70 focus:border-indigo-500/40 focus:outline-none resize-none"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-2)] text-sm hover:text-[var(--text-1)] hover:border-[var(--border-mid)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors"
            >
              Add Vendor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
