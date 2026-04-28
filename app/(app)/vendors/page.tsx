"use client";

import { useState, useEffect, useMemo } from "react";

type Vendor = {
  id:          string;
  name:        string;
  email:       string;
  phone:       string;
  city:        string;
  category:    string;
  events_done: number;
  rating:      number;
  active:      boolean;
  notes:       string;
};

const CATEGORIES = [
  "Catering", "Venue", "AV & Sound", "Decoration", "Photography",
  "Entertainment", "Logistics", "Security", "Flowers", "Other",
];

export default function VendorsPage() {
  const [vendors,   setVendors]   = useState<Vendor[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting,  setDeleting]  = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/vendors");
      if (res.ok) setVendors(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    vendors.forEach((v) => seen.add(v.category));
    return ["All", ...CATEGORIES.filter((c) => seen.has(c)), ...([...seen].filter((c) => !CATEGORIES.includes(c)))];
  }, [vendors]);

  const filtered = useMemo(() => {
    return vendors.filter((v) => {
      const q = search.toLowerCase();
      const matchSearch = !q || v.name.toLowerCase().includes(q) || v.email?.toLowerCase().includes(q) || v.category.toLowerCase().includes(q) || v.city?.toLowerCase().includes(q);
      const matchCat = catFilter === "All" || v.category === catFilter;
      return matchSearch && matchCat;
    });
  }, [vendors, search, catFilter]);

  async function handleAdd(data: Omit<Vendor, "id">) {
    const res = await fetch("/api/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const v = await res.json();
      setVendors((curr) => [v, ...curr]);
      setModalOpen(false);
    }
  }

  async function handleToggleActive(v: Vendor) {
    const res = await fetch(`/api/vendors/${v.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !v.active }),
    });
    if (res.ok) {
      const updated = await res.json();
      setVendors((curr) => curr.map((x) => x.id === v.id ? { ...x, ...updated } : x));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this vendor? This cannot be undone.")) return;
    setDeleting(id);
    const res = await fetch(`/api/vendors/${id}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      setVendors((curr) => curr.filter((v) => v.id !== id));
    }
    setDeleting(null);
  }

  const editingVendor = editingId ? vendors.find((v) => v.id === editingId) ?? null : null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-1)]">Vendors</h2>
          <p className="text-[var(--text-2)] text-sm mt-1">
            {vendors.length} vendor{vendors.length === 1 ? "" : "s"} saved to your workspace.
          </p>
        </div>
        <button
          onClick={() => { setEditingId(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors"
        >
          + Add Vendor
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] flex-1 min-w-[200px] max-w-sm">
          <svg className="w-4 h-4 text-[var(--text-3)] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendors…"
            className="flex-1 bg-transparent text-[var(--text-1)] text-sm placeholder:text-[var(--text-3)] outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                catFilter === c
                  ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400"
                  : "border-[var(--border)] text-[var(--text-2)] hover:border-indigo-500/30"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 animate-pulse h-36" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] p-16 text-center">
          <p className="text-3xl mb-3">🏪</p>
          <p className="text-[var(--text-1)] font-semibold text-sm mb-1">
            {vendors.length === 0 ? "No vendors yet" : "No vendors match your filters"}
          </p>
          <p className="text-[var(--text-3)] text-xs mb-4">
            {vendors.length === 0
              ? "Add your trusted caterers, AV teams, venues, and photographers."
              : "Try adjusting your search or category filter."}
          </p>
          {vendors.length === 0 && (
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors"
            >
              + Add your first vendor
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((v) => (
            <div
              key={v.id}
              className={`rounded-xl border bg-[var(--bg-card)] p-5 flex flex-col gap-3 transition-colors group ${
                v.active ? "border-[var(--border)] hover:border-indigo-500/30" : "border-[var(--border)] opacity-60"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-base font-bold text-indigo-300 shrink-0">
                  {v.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[var(--text-1)] font-semibold text-sm truncate">{v.name}</p>
                  <p className="text-[var(--text-3)] text-xs mt-0.5">
                    {v.category}{v.city ? ` · ${v.city}` : ""}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                  v.active ? "bg-emerald-500/15 text-emerald-400" : "bg-gray-500/15 text-gray-400"
                }`}>
                  {v.active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-[var(--text-3)]">
                <span className="text-amber-400">{"★".repeat(v.rating)}{"☆".repeat(5 - v.rating)}</span>
                {v.events_done > 0 && <span>· {v.events_done} event{v.events_done === 1 ? "" : "s"}</span>}
              </div>

              {v.notes && (
                <p className="text-[var(--text-3)] text-xs line-clamp-2 leading-relaxed">{v.notes}</p>
              )}

              <div className="flex items-center gap-2 mt-auto pt-1 border-t border-[var(--border)]">
                {v.phone && (
                  <a
                    href={`tel:${v.phone}`}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-[var(--border)] text-[var(--text-2)] hover:border-emerald-500/40 hover:text-emerald-400 transition-colors"
                  >
                    📞 Call
                  </a>
                )}
                {v.phone && (
                  <a
                    href={`https://wa.me/${v.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-[var(--border)] text-[var(--text-2)] hover:border-emerald-500/40 hover:text-emerald-400 transition-colors"
                  >
                    💬 WhatsApp
                  </a>
                )}
                <div className="flex-1" />
                <button
                  onClick={() => handleToggleActive(v)}
                  className="text-[var(--text-3)] hover:text-[var(--text-1)] text-xs px-2 py-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
                  title={v.active ? "Mark inactive" : "Mark active"}
                >
                  {v.active ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => handleDelete(v.id)}
                  disabled={deleting === v.id}
                  className="text-red-400/60 hover:text-red-400 text-xs px-2 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                >
                  {deleting === v.id ? "…" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(modalOpen || editingVendor) && (
        <VendorModal
          initial={editingVendor ?? undefined}
          onClose={() => { setModalOpen(false); setEditingId(null); }}
          onSubmit={handleAdd}
        />
      )}
    </div>
  );
}

function VendorModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: Partial<Vendor>;
  onClose: () => void;
  onSubmit: (v: Omit<Vendor, "id">) => Promise<void>;
}) {
  const [name,     setName]     = useState(initial?.name     ?? "");
  const [email,    setEmail]    = useState(initial?.email    ?? "");
  const [phone,    setPhone]    = useState(initial?.phone    ?? "");
  const [city,     setCity]     = useState(initial?.city     ?? "");
  const [category, setCategory] = useState(initial?.category ?? CATEGORIES[0]);
  const [rating,   setRating]   = useState(initial?.rating   ?? 4);
  const [active,   setActive]   = useState(initial?.active   ?? true);
  const [notes,    setNotes]    = useState(initial?.notes    ?? "");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Vendor name is required.");
    if (email && !/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Enter a valid email address.");
    setSaving(true);
    try {
      await onSubmit({ name: name.trim(), email: email.trim(), phone: phone.trim(), city: city.trim(), category, rating, active, notes: notes.trim(), events_done: initial?.events_done ?? 0 });
    } catch {
      setError("Failed to save vendor. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h3 className="text-[var(--text-1)] font-semibold">{initial ? "Edit Vendor" : "Add Vendor"}</h3>
          <button onClick={onClose} className="text-[var(--text-3)] hover:text-[var(--text-1)] text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[var(--text-2)] text-xs font-medium mb-1.5">Vendor Name <span className="text-red-400">*</span></label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Apex Events Co." required className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)]/60 focus:border-indigo-500/50 outline-none" />
            </div>
            <div>
              <label className="block text-[var(--text-2)] text-xs font-medium mb-1.5">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-1)] focus:border-indigo-500/50 outline-none">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[var(--text-2)] text-xs font-medium mb-1.5">City</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Mumbai, Delhi…" className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)]/60 focus:border-indigo-500/50 outline-none" />
            </div>
            <div>
              <label className="block text-[var(--text-2)] text-xs font-medium mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@vendor.com" className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)]/60 focus:border-indigo-500/50 outline-none" />
            </div>
            <div>
              <label className="block text-[var(--text-2)] text-xs font-medium mb-1.5">Phone / WhatsApp</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98xxx xxxxx" className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)]/60 focus:border-indigo-500/50 outline-none" />
            </div>
            <div>
              <label className="block text-[var(--text-2)] text-xs font-medium mb-1.5">Rating</label>
              <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-1)] focus:border-indigo-500/50 outline-none">
                {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{"★".repeat(r)}{"☆".repeat(5 - r)} ({r}/5)</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[var(--text-2)] text-xs font-medium mb-1.5">Status</label>
              <select value={active ? "active" : "inactive"} onChange={(e) => setActive(e.target.value === "active")} className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-1)] focus:border-indigo-500/50 outline-none">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[var(--text-2)] text-xs font-medium mb-1.5">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value.slice(0, 1000))} placeholder="Rate card, specialities, past events…" rows={3} className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)]/60 focus:border-indigo-500/50 outline-none resize-none" />
            </div>
          </div>
          {error && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-2)] text-sm hover:text-[var(--text-1)] transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors disabled:opacity-60">
              {saving ? "Saving…" : initial ? "Save Changes" : "Add Vendor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
