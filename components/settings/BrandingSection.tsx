"use client";

import { useEffect, useRef, useState } from "react";
import type { Branding } from "@/lib/branding";

const EMPTY: Branding = { company_name: "", phone_number: "", address: "", logo_url: "", gst_number: "", website: "" };

export default function BrandingSection() {
  const [form,    setForm]    = useState<Branding>(EMPTY);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [err,     setErr]     = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/settings/profile")
      .then((r) => r.ok ? r.json() : {})
      .then((d) => setForm({ ...EMPTY, ...d }))
      .catch(() => {});
  }, []);

  function field(key: keyof Branding, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr("");
    setSaved(false);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: form.company_name || undefined,
          phone_number: form.phone_number || undefined,
          address:      form.address      || undefined,
          logo_url:     form.logo_url     || undefined,
          gst_number:   form.gst_number   || undefined,
          website:      form.website       || undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed.");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setErr(e.message ?? "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadErr("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/settings/logo", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed.");
      setForm((f) => ({ ...f, logo_url: json.logo_url }));
    } catch (e: any) {
      setUploadErr(e.message ?? "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleRemoveLogo() {
    setForm((f) => ({ ...f, logo_url: "" }));
    // Persist removal immediately
    await fetch("/api/settings/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logo_url: "" }),
    }).catch(() => {});
  }

  return (
    <form onSubmit={handleSave}>
      <div style={{ marginBottom: 28 }}>
        <p className="t-title">Branding</p>
        <p className="t-body" style={{ marginTop: 4 }}>
          Your logo and contact details appear on every client proposal.
        </p>
      </div>

      {/* Logo */}
      <div style={{ marginBottom: 24 }}>
        <span className="field-label">Company Logo</span>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
          {/* Preview / placeholder */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--bg-card)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {form.logo_url ? (
              <img
                src={form.logo_url}
                alt="Logo"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : (
              <span style={{ fontSize: 24, opacity: 0.25 }}>🏢</span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="btn-ghost"
              style={{ fontSize: 12, minHeight: 36 }}
            >
              {uploading ? "Uploading…" : form.logo_url ? "Replace logo" : "Upload logo"}
            </button>
            {form.logo_url && !uploading && (
              <button
                type="button"
                onClick={handleRemoveLogo}
                style={{
                  fontSize: 11,
                  color: "var(--text-3)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  textAlign: "left",
                }}
              >
                Remove
              </button>
            )}
            <p style={{ fontSize: 11, color: "var(--text-3)", margin: 0 }}>
              JPEG, PNG or WebP · max 2 MB
            </p>
          </div>
        </div>
        {uploadErr && (
          <p style={{ fontSize: 12, color: "#f87171", marginTop: 8 }}>{uploadErr}</p>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: "none" }}
          onChange={handleLogoChange}
        />
      </div>

      {/* Company name */}
      <div style={{ marginBottom: 16 }}>
        <label className="field-label" htmlFor="company_name">Company Name</label>
        <input
          id="company_name"
          className="input"
          type="text"
          placeholder="Acme Events Pvt Ltd"
          value={form.company_name}
          onChange={(e) => field("company_name", e.target.value)}
          maxLength={120}
        />
      </div>

      {/* Phone */}
      <div style={{ marginBottom: 16 }}>
        <label className="field-label" htmlFor="phone_number">Phone Number</label>
        <input
          id="phone_number"
          className="input"
          type="tel"
          placeholder="+91 98765 43210"
          value={form.phone_number}
          onChange={(e) => field("phone_number", e.target.value)}
          maxLength={30}
        />
      </div>

      {/* Address */}
      <div style={{ marginBottom: 16 }}>
        <label className="field-label" htmlFor="address">
          Address <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span>
        </label>
        <textarea
          id="address"
          className="input"
          placeholder="Mumbai, Maharashtra"
          value={form.address}
          onChange={(e) => field("address", e.target.value)}
          maxLength={300}
          rows={2}
          style={{ minHeight: 64 }}
        />
      </div>

      {/* GST Number */}
      <div style={{ marginBottom: 16 }}>
        <label className="field-label" htmlFor="gst_number">
          GST Number <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span>
        </label>
        <input
          id="gst_number"
          className="input"
          type="text"
          placeholder="22AAAAA0000A1Z5"
          value={form.gst_number}
          onChange={(e) => field("gst_number", e.target.value.toUpperCase())}
          maxLength={20}
        />
      </div>

      {/* Website */}
      <div style={{ marginBottom: 24 }}>
        <label className="field-label" htmlFor="website">
          Website <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span>
        </label>
        <input
          id="website"
          className="input"
          type="url"
          placeholder="https://yourevents.in"
          value={form.website}
          onChange={(e) => field("website", e.target.value)}
          maxLength={200}
        />
      </div>

      {/* Save */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          type="submit"
          className="btn-primary"
          disabled={saving}
        >
          {saving ? "Saving…" : saved ? "✓ Saved" : "Save Branding"}
        </button>
        {err && <p style={{ fontSize: 12, color: "#f87171" }}>{err}</p>}
      </div>
    </form>
  );
}
