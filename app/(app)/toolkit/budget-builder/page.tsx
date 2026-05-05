export default function BudgetBuilderPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(212,168,95,0.08)", border: "1px solid rgba(212,168,95,0.15)" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D4A85F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 7H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3" />
          <rect x="9" y="3" width="6" height="5" rx="1" />
          <path d="M9 14h.01M12 14h.01M15 14h.01M9 17h.01M12 17h.01" />
        </svg>
      </div>
      <div>
        <h1 className="text-xl font-semibold text-[var(--text-1)] mb-1">Budget Builder</h1>
        <p className="text-sm text-[var(--text-3)] max-w-sm">
          Build detailed event budgets with category breakdowns, vendor estimates, and contingency planning.
        </p>
      </div>
      <p className="text-xs text-[var(--text-3)] opacity-50 mt-2">Coming soon</p>
    </div>
  );
}
