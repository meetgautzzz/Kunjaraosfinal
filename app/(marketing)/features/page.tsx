import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Features | Kunjara OS™",
  description: "AI-powered event planning features: proposals, budgets, floor plans, 3D renders, client portal, and more.",
};

const FEATURES = [
  { icon: "✦", title: "AI Proposal Generator",  desc: "Answer 5 questions. Get a complete proposal with concept, budget, timeline, and vendors in 2 minutes." },
  { icon: "₹", title: "Smart Budgets",           desc: "GST-compliant, automatic calculations, itemised breakdowns, and PDF export ready for clients." },
  { icon: "🎭", title: "Visual Design Studio",   desc: "Beautiful mood boards, color palettes, DALL-E 3D renders, and stage design — all in one tab." },
  { icon: "📐", title: "Floor Plan Builder",     desc: "AI-suggested layouts based on your event type and guest count. Drag-and-drop to customise." },
  { icon: "📋", title: "Client Portal",          desc: "Share a link. Clients view, approve, and comment — no login required. Track responses in real time." },
  { icon: "⏱", title: "Project Timeline",        desc: "Phase-by-phase project planning with milestones, task lists, and deadline tracking." },
  { icon: "🏪", title: "Vendor Management",      desc: "Curated vendor lists, category tracking, notes, and budget allocation per supplier." },
  { icon: "⚖", title: "Compliance Tracker",      desc: "Auto-generated checklist for permits, licenses, and safety requirements based on event type." },
  { icon: "📄", title: "Export Options",         desc: "Download as PDF, share as a live client link, or export data for your team." },
];

export default function FeaturesPage() {
  return (
    <div style={{ padding: "60px 24px", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 60 }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: "var(--text-1)", marginBottom: 12 }}>
          Everything your event business needs
        </h1>
        <p style={{ fontSize: 16, color: "var(--text-2)" }}>
          One platform. No more juggling spreadsheets, WhatsApp, and Canva.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 20 }}>
        {FEATURES.map((f) => (
          <div key={f.title} style={{
            padding: 24, border: "1px solid var(--border)",
            borderRadius: 12, background: "var(--bg-card)",
          }}>
            <span style={{ fontSize: 24, marginBottom: 12, display: "block" }}>{f.icon}</span>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 8 }}>{f.title}</h3>
            <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.65 }}>{f.desc}</p>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: 64, padding: 40, borderRadius: 16, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-1)", marginBottom: 12 }}>
          Ready to try it?
        </h2>
        <p style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 24 }}>Free to start — no credit card required.</p>
        <Link href="/signup" style={{
          display: "inline-block", padding: "14px 36px",
          background: "#6366f1", color: "#fff",
          borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: "none",
        }}>
          Create your first proposal →
        </Link>
      </div>
    </div>
  );
}
