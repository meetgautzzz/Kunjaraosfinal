import { formatINR } from "@/lib/room";
import type { EventRoom } from "@/lib/room";

const GST_RATE_DEFAULT = 18;

type Item = {
  id: string; category: string; description: string;
  quantity: number; unitCost: number; gstRate: number; margin: number; visible: boolean;
};

function calcItem(item: Item, globalMargin = 0) {
  const margin    = globalMargin > 0 ? globalMargin : item.margin;
  const base      = item.quantity * item.unitCost;
  const marginAmt = base * (margin / 100);
  const withMargin= base + marginAmt;
  const gstAmt    = withMargin * (item.gstRate / 100);
  return { base, marginAmt, withMargin, gstAmt, total: withMargin + gstAmt };
}

const COLORS = ["bg-indigo-500","bg-purple-500","bg-emerald-500","bg-amber-500","bg-rose-500","bg-cyan-500"];

export default function RoomBudget({ room, readOnly }: { room: EventRoom; readOnly?: boolean }) {
  const data = room.budgetData;
  if (!data?.items?.length) return <Empty />;

  const items: Item[]  = data.items;
  const globalMargin   = data.meta?.globalMargin ?? 0;
  const hideClientCosts= readOnly && (data.meta?.hideClientCosts ?? false);

  // Group by category
  const grouped: Record<string, Item[]> = {};
  for (const item of items) {
    if (readOnly && !item.visible) continue;
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }

  const cats = Object.keys(grouped);

  // Totals
  let subtotal = 0, totalGST = 0, grandTotal = 0;
  const gstBreakdown: Record<number, number> = {};
  for (const item of items) {
    if (readOnly && !item.visible) continue;
    const c = calcItem(item, globalMargin);
    subtotal   += c.withMargin;
    totalGST   += c.gstAmt;
    grandTotal += c.total;
    gstBreakdown[item.gstRate] = (gstBreakdown[item.gstRate] ?? 0) + c.gstAmt;
  }

  // Stack bar widths
  const catTotals = cats.map((cat) =>
    grouped[cat].reduce((s, it) => s + calcItem(it, globalMargin).total, 0)
  );

  return (
    <div className="space-y-6">
      {/* Allocation bar */}
      {!hideClientCosts && (
        <div className="space-y-2">
          <div className="h-3 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] overflow-hidden flex">
            {catTotals.map((t, i) => (
              <div key={i} className={`${COLORS[i % COLORS.length]} h-full`}
                style={{ width: `${(t / grandTotal) * 100}%` }} title={cats[i]} />
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {cats.map((cat, i) => (
              <div key={cat} className="flex items-center gap-1.5 text-xs text-[var(--text-3)]">
                <div className={`w-2 h-2 rounded-full ${COLORS[i % COLORS.length]}`} />
                {cat}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Line items */}
      <div className="space-y-3">
        {cats.map((cat, ci) => (
          <div key={cat} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-surface)] border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${COLORS[ci % COLORS.length]}`} />
                <span className="text-[var(--text-1)] text-sm font-semibold">{cat}</span>
              </div>
              {!hideClientCosts && (
                <span className="text-[var(--text-1)] text-sm font-bold tabular-nums">
                  {formatINR(catTotals[ci])}
                </span>
              )}
            </div>
            <div className="divide-y divide-[var(--border)]">
              {grouped[cat].map((item) => {
                const c = calcItem(item, globalMargin);
                return (
                  <div key={item.id} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-[var(--text-1)] text-sm">{item.description || "—"}</p>
                      {!hideClientCosts && (
                        <p className="text-[var(--text-3)] text-xs mt-0.5">
                          {item.quantity} × {formatINR(item.unitCost)}
                          {item.gstRate > 0 && <span className="ml-2 text-amber-400/70">GST {item.gstRate}%</span>}
                        </p>
                      )}
                    </div>
                    {!hideClientCosts && (
                      <div className="text-right shrink-0">
                        <p className="text-[var(--text-1)] text-sm font-semibold tabular-nums">{formatINR(c.total)}</p>
                        {item.gstRate > 0 && (
                          <p className="text-[var(--text-3)] text-xs tabular-nums">incl. {formatINR(c.gstAmt)} GST</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      {!hideClientCosts && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
          <div className="max-w-xs ml-auto space-y-2">
            <Row label="Subtotal (excl. GST)" value={formatINR(subtotal)} />
            {Object.entries(gstBreakdown).filter(([,v]) => v > 0).map(([rate, amt]) => (
              <Row key={rate} label={`GST @ ${rate}%`} value={formatINR(amt)} muted />
            ))}
            <Row label="Total GST" value={formatINR(totalGST)} />
            <div className="border-t border-[var(--border)] pt-3">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-1)] font-bold">Grand Total</span>
                <span className="text-[var(--text-1)] text-xl font-black tabular-nums">{formatINR(grandTotal)}</span>
              </div>
              <p className="text-[var(--text-3)] text-xs mt-1 text-right">All amounts inclusive of applicable GST</p>
            </div>
          </div>
        </div>
      )}
      {hideClientCosts && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 text-center">
          <p className="text-[var(--text-3)] text-sm">Detailed pricing will be shared separately. Contact us for a full cost breakdown.</p>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={muted ? "text-[var(--text-3)]" : "text-[var(--text-2)]"}>{label}</span>
      <span className={`tabular-nums ${muted ? "text-[var(--text-3)]" : "text-[var(--text-2)]"}`}>{value}</span>
    </div>
  );
}

function Empty() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center text-xl mb-3">₹</div>
      <p className="text-[var(--text-3)] text-sm">No budget data attached yet.</p>
    </div>
  );
}
