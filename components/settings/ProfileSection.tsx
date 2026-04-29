"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ProfileSection() {
  const [email,    setEmail]    = useState("");
  const [newPwd,   setNewPwd]   = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [err,      setErr]      = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
    });
  }, []);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!newPwd || !confirm) { setErr("Fill both fields."); return; }
    if (newPwd.length < 8)   { setErr("Password must be at least 8 characters."); return; }
    if (newPwd !== confirm)  { setErr("Passwords don't match."); return; }

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    setSaving(false);

    if (error) { setErr(error.message ?? "Failed to update password."); return; }
    setNewPwd("");
    setConfirm("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <p className="t-title">Account</p>
        <p className="t-body" style={{ marginTop: 4 }}>Your login email and password.</p>
      </div>

      {/* Email (read-only) */}
      <div style={{ marginBottom: 20 }}>
        <label className="field-label">Email</label>
        <input
          className="input"
          type="email"
          value={email}
          disabled
          style={{ opacity: 0.6 }}
        />
        <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>
          Email cannot be changed here. Contact support if needed.
        </p>
      </div>

      {/* Change password */}
      <form onSubmit={handleChangePassword}>
        <div style={{ marginBottom: 16 }}>
          <label className="field-label" htmlFor="new_pwd">New Password</label>
          <input
            id="new_pwd"
            className="input"
            type="password"
            placeholder="Min 8 characters"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            maxLength={128}
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label className="field-label" htmlFor="confirm_pwd">Confirm New Password</label>
          <input
            id="confirm_pwd"
            className="input"
            type="password"
            placeholder="Repeat password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            maxLength={128}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Updating…" : saved ? "✓ Password updated" : "Change Password"}
          </button>
          {err && <p style={{ fontSize: 12, color: "#f87171" }}>{err}</p>}
        </div>
      </form>
    </div>
  );
}
