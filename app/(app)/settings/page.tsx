import BrandingSection from "@/components/settings/BrandingSection";

export const metadata = { title: "Settings · Kunjara OS" };

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto" style={{ paddingBottom: 64 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 className="t-display">Settings</h1>
        <p className="t-body" style={{ marginTop: 6 }}>
          Manage your account and proposal branding.
        </p>
      </div>

      <div
        className="card"
        style={{ padding: "28px 24px" }}
      >
        <BrandingSection />
      </div>
    </div>
  );
}
