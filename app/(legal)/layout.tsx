import Link from "next/link";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", color: "var(--text-1)" }}>
      {/* Nav */}
      <header style={{
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-surface)",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 13, fontWeight: 900,
            }}>K</div>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.01em" }}>Kunjara OS</span>
          </Link>
          <Link href="/dashboard" style={{ fontSize: 13, color: "var(--text-3)", textDecoration: "none" }}>
            ← Back to app
          </Link>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px 80px" }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "32px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          {/* Row 1 — Primary legal */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 20px", fontSize: 12, color: "var(--text-3)", marginBottom: 10 }}>
            <Link href="/terms"         style={{ color: "inherit", textDecoration: "none" }}>Terms of Service</Link>
            <Link href="/privacy"       style={{ color: "inherit", textDecoration: "none" }}>Privacy Policy</Link>
            <Link href="/refund"        style={{ color: "inherit", textDecoration: "none" }}>Refund Policy</Link>
            <Link href="/credits"       style={{ color: "inherit", textDecoration: "none" }}>Credit Usage</Link>
            <Link href="/dpdp"          style={{ color: "inherit", textDecoration: "none" }}>DPDP Compliance</Link>
            <Link href="/data-deletion" style={{ color: "inherit", textDecoration: "none" }}>Data Deletion</Link>
          </div>
          {/* Row 2 — Secondary */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 20px", fontSize: 11, color: "var(--text-3)", opacity: 0.7, marginBottom: 14 }}>
            <Link href="/about"        style={{ color: "inherit", textDecoration: "none" }}>About</Link>
            <Link href="/contact"      style={{ color: "inherit", textDecoration: "none" }}>Contact</Link>
            <Link href="/support"      style={{ color: "inherit", textDecoration: "none" }}>Support</Link>
            <Link href="/nda"          style={{ color: "inherit", textDecoration: "none" }}>NDA &amp; IP</Link>
            <Link href="/api-security" style={{ color: "inherit", textDecoration: "none" }}>API Security</Link>
          </div>
          <p style={{ fontSize: 11, color: "var(--text-3)", opacity: 0.5 }}>
            © {new Date().getFullYear()} Kunjara Technologies. Kunjara OS™ is a registered trademark. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
