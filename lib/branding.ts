"use client";

import { useEffect, useState } from "react";

export type Branding = {
  company_name: string;
  phone_number: string;
  address:      string;
  logo_url:     string;
};

const EMPTY: Branding = { company_name: "", phone_number: "", address: "", logo_url: "" };

export function useBranding() {
  const [branding, setBranding] = useState<Branding>(EMPTY);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    fetch("/api/settings/profile", { credentials: "same-origin" })
      .then((r) => r.ok ? r.json() : {})
      .then((d) => setBranding({ ...EMPTY, ...d }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { branding, loading, setBranding };
}
