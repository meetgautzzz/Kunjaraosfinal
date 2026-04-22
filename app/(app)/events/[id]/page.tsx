import Link from "next/link";

export default function EventDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/events" className="text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors text-sm">← Events</Link>
        <span className="text-[var(--text-3)]">/</span>
        <span className="text-[var(--text-2)] text-sm">Event #{params.id}</span>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[var(--text-1)]">Event Details</h2>
          <Link
            href={`/events/${params.id}/room`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors"
          >
            Open Room →
          </Link>
        </div>
        <p className="text-[var(--text-2)] text-sm">Event details for ID: {params.id}</p>
      </div>
    </div>
  );
}
