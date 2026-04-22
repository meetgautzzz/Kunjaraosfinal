export default function VendorsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-1)]">Vendors</h2>
          <p className="text-[var(--text-2)] text-sm mt-1">{VENDORS.length} vendors registered in your workspace.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors">
          + Add Vendor
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] max-w-sm">
        <svg className="w-4 h-4 text-[var(--text-3)] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input placeholder="Search vendors..." className="flex-1 bg-transparent text-[var(--text-1)] text-sm placeholder:text-[var(--text-3)] outline-none" />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {["Vendor", "Category", "Events", "Rating", "Status"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[var(--text-3)] text-xs font-medium uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {VENDORS.map((v, i) => (
                <tr key={i} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center text-sm font-bold text-indigo-300 shrink-0">
                        {v.name[0]}
                      </div>
                      <div>
                        <p className="text-[var(--text-1)] font-medium">{v.name}</p>
                        <p className="text-[var(--text-3)] text-xs">{v.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[var(--text-2)]">{v.category}</td>
                  <td className="px-5 py-4 text-[var(--text-2)]">{v.events}</td>
                  <td className="px-5 py-4">
                    <span className="text-amber-400 font-medium">{"★".repeat(v.rating)}{"☆".repeat(5 - v.rating)}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${v.active ? "bg-emerald-500/15 text-emerald-400" : "bg-gray-500/15 text-gray-400"}`}>
                      {v.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const VENDORS = [
  { name: "Apex Events Co.",       email: "apex@events.com",    category: "Catering",    events: 14, rating: 5, active: true  },
  { name: "SoundWave Productions", email: "sw@sound.io",        category: "AV & Sound",  events: 9,  rating: 4, active: true  },
  { name: "Luxe Décor Studio",     email: "luxe@decor.co",      category: "Decoration",  events: 11, rating: 5, active: true  },
  { name: "Vertex Photography",    email: "vertex@photo.com",   category: "Photography", events: 7,  rating: 4, active: false },
  { name: "ZenSpace Venues",       email: "hello@zenspace.io",  category: "Venue",       events: 5,  rating: 3, active: true  },
  { name: "Gourmet Masters",       email: "info@gourmet.co",    category: "Catering",    events: 8,  rating: 4, active: true  },
];
