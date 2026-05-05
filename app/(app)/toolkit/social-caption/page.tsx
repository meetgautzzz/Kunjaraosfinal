export default function SocialCaptionPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(212,168,95,0.08)", border: "1px solid rgba(212,168,95,0.15)" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D4A85F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 2L11 13" />
          <path d="M22 2L15 22l-4-9-9-4 20-7z" />
        </svg>
      </div>
      <div>
        <h1 className="text-xl font-semibold text-[var(--text-1)] mb-1">Social Caption</h1>
        <p className="text-sm text-[var(--text-3)] max-w-sm">
          Generate platform-optimised captions for Instagram, LinkedIn, and Twitter from your event brief.
        </p>
      </div>
      <p className="text-xs text-[var(--text-3)] opacity-50 mt-2">Coming soon</p>
    </div>
  );
}
