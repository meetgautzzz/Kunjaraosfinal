export default function RunOfShowPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(212,168,95,0.08)", border: "1px solid rgba(212,168,95,0.15)" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D4A85F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
      </div>
      <div>
        <h1 className="text-xl font-semibold text-[var(--text-1)] mb-1">Run of Show</h1>
        <p className="text-sm text-[var(--text-3)] max-w-sm">
          Build minute-by-minute event schedules for flawless execution across all teams and vendors.
        </p>
      </div>
      <p className="text-xs text-[var(--text-3)] opacity-50 mt-2">Coming soon</p>
    </div>
  );
}
