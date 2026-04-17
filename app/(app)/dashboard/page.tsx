import UpgradeBanner from "./UpgradeBanner";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <UpgradeBanner />
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Dashboard</h1>
        <p className="mt-1 text-sm text-text-secondary">Welcome to Kunjara OS™.</p>
      </div>
    </div>
  );
}
