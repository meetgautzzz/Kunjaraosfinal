import type { EventRoom } from "@/lib/room";

export default function RoomProposal({ room, readOnly }: { room: EventRoom; readOnly?: boolean }) {
  const concept = room.proposalData?.concept;
  if (!concept) return <Empty label="No proposal data attached to this room yet." />;

  return (
    <div className="space-y-6">
      {/* Concept hero */}
      <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/8 to-purple-500/4 p-8 text-center space-y-3">
        <p className="text-indigo-400 text-sm font-medium uppercase tracking-widest">Event Concept</p>
        <h2 className="text-[var(--text-1)] text-3xl font-black">{concept.title}</h2>
        <p className="text-indigo-400 text-base italic">{concept.tagline}</p>
        <p className="text-[var(--text-2)] text-sm leading-relaxed max-w-2xl mx-auto">{concept.description}</p>
        {concept.theme && (
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium">
            ✦ {concept.theme}
          </span>
        )}
      </div>

      {/* Highlights */}
      {concept.highlights?.length > 0 && (
        <div>
          <h4 className="text-[var(--text-1)] text-sm font-semibold mb-3">Event Highlights</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {concept.highlights.map((h: string, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)]">
                <span className="text-indigo-400 font-bold text-xs mt-0.5 shrink-0 w-5">0{i + 1}</span>
                <p className="text-[var(--text-1)] text-sm">{h}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center text-xl mb-3">📄</div>
      <p className="text-[var(--text-3)] text-sm">{label}</p>
    </div>
  );
}
