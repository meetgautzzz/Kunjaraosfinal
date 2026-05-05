"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import BrandingSection from "@/components/settings/BrandingSection";
import ProfileSection  from "@/components/settings/ProfileSection";
import BillingSection  from "@/components/settings/BillingSection";

const TABS = [
  { id: "branding", label: "Branding" },
  { id: "account",  label: "Account"  },
  { id: "billing",  label: "Billing"  },
] as const;

type Tab = typeof TABS[number]["id"];

function isValidTab(v: string | null): v is Tab {
  return TABS.some((t) => t.id === v);
}

function SettingsInner() {
  const searchParams = useSearchParams();
  const raw = searchParams.get("tab");
  const [tab, setTab] = useState<Tab>(isValidTab(raw) ? raw : "branding");

  return (
    <div className="max-w-2xl mx-auto" style={{ paddingBottom: 64 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="t-display">Settings</h1>
        <p className="t-body" style={{ marginTop: 6 }}>Manage your account, branding, and billing.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid var(--border)", paddingBottom: 0 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 500,
              color: tab === t.id ? "var(--text-1)" : "var(--text-3)",
              background: "none",
              border: "none",
              borderBottom: tab === t.id ? "2px solid var(--accent)" : "2px solid transparent",
              cursor: "pointer",
              transition: "all 0.15s",
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: "28px 24px" }}>
        {tab === "branding" && <BrandingSection />}
        {tab === "account"  && <ProfileSection  />}
        {tab === "billing"  && <BillingSection  />}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsInner />
    </Suspense>
  );
}
