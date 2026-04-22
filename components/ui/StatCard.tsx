type Props = {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down";
  icon: string;
};

export default function StatCard({ label, value, delta, trend, icon }: Props) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 flex flex-col gap-3 hover:border-indigo-500/30 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--text-2)] font-medium">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div>
        <p className="text-3xl font-bold text-[var(--text-1)] tracking-tight">{value}</p>
        <p className={`text-xs mt-1 font-medium ${trend === "up" ? "text-emerald-400" : "text-red-400"}`}>
          {trend === "up" ? "↑" : "↓"} {delta} vs last month
        </p>
      </div>
    </div>
  );
}
