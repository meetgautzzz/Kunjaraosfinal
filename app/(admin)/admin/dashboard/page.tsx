"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

// ── Constants ──────────────────────────────────────────────────────────────────
const OWNER_EMAIL = "meetgautzzz@gmail.com";

const C = {
  bg:       "#0a0e27",
  card:     "#0d1335",
  cardHigh: "#0f1640",
  border:   "rgba(0,212,255,0.12)",
  borderHi: "rgba(0,212,255,0.35)",
  glow:     "#00d4ff",
  glowG:    "#00ff88",
  glowA:    "#ffb800",
  glowR:    "#ff4040",
  text1:    "#e0f7ff",
  text2:    "rgba(224,247,255,0.6)",
  text3:    "rgba(224,247,255,0.3)",
  mono:     "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)",
};

// ── Mock data ──────────────────────────────────────────────────────────────────
const GROWTH_DATA = [
  { week: "W1",  users: 920,  signups: 28 },
  { week: "W2",  users: 954,  signups: 34 },
  { week: "W3",  users: 988,  signups: 34 },
  { week: "W4",  users: 1024, signups: 36 },
  { week: "W5",  users: 1063, signups: 39 },
  { week: "W6",  users: 1098, signups: 35 },
  { week: "W7",  users: 1133, signups: 35 },
  { week: "W8",  users: 1162, signups: 29 },
  { week: "W9",  users: 1188, signups: 26 },
  { week: "W10", users: 1205, signups: 17 },
  { week: "W11", users: 1229, signups: 24 },
  { week: "W12", users: 1245, signups: 47 },
];

const REVENUE_DATA = [
  { week: "W1",  mrr: 62400  },
  { week: "W2",  mrr: 68100  },
  { week: "W3",  mrr: 72800  },
  { week: "W4",  mrr: 78500  },
  { week: "W5",  mrr: 83200  },
  { week: "W6",  mrr: 89700  },
  { week: "W7",  mrr: 94300  },
  { week: "W8",  mrr: 101000 },
  { week: "W9",  mrr: 107500 },
  { week: "W10", mrr: 113800 },
  { week: "W11", mrr: 118900 },
  { week: "W12", mrr: 123450 },
];

const PLAN_DATA = [
  { name: "Free",  value: 934,  color: C.text3 },
  { name: "Basic", value: 187,  color: C.glowA },
  { name: "Pro",   value: 124,  color: C.glow  },
];

const RECENT_SIGNUPS = [
  { name: "Priya Sharma",      email: "priya.sharma@eventsco.in",    plan: "Pro",   city: "Mumbai",    date: "2026-05-12" },
  { name: "Rahul Mehta",       email: "rahul@weddingwala.com",       plan: "Basic", city: "Delhi",     date: "2026-05-12" },
  { name: "Anjali Nair",       email: "anjali.nair@indovents.in",    plan: "Pro",   city: "Bangalore", date: "2026-05-11" },
  { name: "Kiran Patel",       email: "kpatel@celebrationsindia.in", plan: "Free",  city: "Ahmedabad", date: "2026-05-11" },
  { name: "Suresh Iyer",       email: "suresh@eventmaster.in",       plan: "Pro",   city: "Chennai",   date: "2026-05-11" },
  { name: "Meena Joshi",       email: "meena.j@royalevents.in",      plan: "Basic", city: "Pune",      date: "2026-05-10" },
  { name: "Arjun Khanna",      email: "arjun@occasionspro.in",       plan: "Free",  city: "Hyderabad", date: "2026-05-10" },
  { name: "Deepika Reddy",     email: "deepika@grandgala.in",        plan: "Pro",   city: "Mumbai",    date: "2026-05-10" },
  { name: "Vikram Singhania",  email: "vikram.s@festiveplanner.in",  plan: "Basic", city: "Jaipur",    date: "2026-05-09" },
  { name: "Neha Agarwal",      email: "neha@agarwalevents.in",       plan: "Free",  city: "Lucknow",   date: "2026-05-09" },
];

const FEEDBACK = [
  { name: "Priya Sharma",     rating: 5, text: "Cut my proposal time from 3 days to 20 minutes. The GST breakdown alone is worth it.", plan: "Pro",   date: "May 11" },
  { name: "Rahul Mehta",      rating: 5, text: "Clients love the Event Room. No more email chains at midnight before the wedding.", plan: "Basic", date: "May 10" },
  { name: "Anjali Nair",      rating: 4, text: "The AI suggestions are surprisingly accurate for Bangalore venues. Very impressed.", plan: "Pro",   date: "May 9"  },
  { name: "Kiran Patel",      rating: 5, text: "Finally something built for Indian events. The ₹ formatting and GST logic is perfect.", plan: "Pro",   date: "May 8"  },
  { name: "Meena Joshi",      rating: 4, text: "Good product. Would love Hindi interface. Customer support responded in 2 hours.", plan: "Basic", date: "May 7"  },
];

const HEALTH = [
  { label: "API Gateway",    status: "NOMINAL",   latency: "42ms",  uptime: "99.98%" },
  { label: "Database",       status: "NOMINAL",   latency: "8ms",   uptime: "99.99%" },
  { label: "AI Services",    status: "NOMINAL",   latency: "1.2s",  uptime: "99.91%" },
  { label: "Email (Resend)", status: "NOMINAL",   latency: "340ms", uptime: "99.85%" },
  { label: "CDN / Vercel",   status: "DEGRADED",  latency: "120ms", uptime: "89.00%" },
  { label: "Razorpay",       status: "NOMINAL",   latency: "210ms", uptime: "99.70%" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function inr(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

function exportCSV() {
  const header = ["Name", "Email", "Plan", "City", "Date"];
  const rows = RECENT_SIGNUPS.map((r) => [r.name, r.email, r.plan, r.city, r.date]);
  const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kunjara-signups-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function PulseRing({ color = C.glow }: { color?: string }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: 10, height: 10, flexShrink: 0 }}>
      <span style={{
        position: "absolute", inset: 0, borderRadius: "50%", background: color, opacity: 0.25,
        animation: "nasa-ping 1.4s cubic-bezier(0,0,0.2,1) infinite",
      }} />
      <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "block" }} />
    </span>
  );
}

function MetricCard({
  label, value, sub, color = C.glow, trend, alert,
}: {
  label: string; value: string; sub: string; color?: string; trend?: string; alert?: boolean;
}) {
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${alert ? "rgba(255,64,64,0.35)" : C.border}`,
      borderRadius: 12,
      padding: "20px 22px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      boxShadow: alert ? "0 0 20px rgba(255,64,64,0.08)" : `0 0 20px rgba(0,212,255,0.04)`,
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: 0.6 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <PulseRing color={alert ? C.glowR : color} />
        <span style={{ fontFamily: C.mono, fontSize: 10, letterSpacing: "0.18em", color: C.text3, textTransform: "uppercase" }}>{label}</span>
      </div>
      <div style={{ fontFamily: C.mono, fontSize: 28, fontWeight: 700, color: alert ? C.glowR : C.text1, lineHeight: 1, letterSpacing: "-0.02em" }}>
        {value}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: C.mono, fontSize: 11, color: C.text3 }}>{sub}</span>
        {trend && (
          <span style={{ fontFamily: C.mono, fontSize: 11, color: trend.startsWith("+") ? C.glowG : C.glowR }}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ label, action }: { label: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 3, height: 16, background: C.glow, borderRadius: 2, boxShadow: `0 0 8px ${C.glow}` }} />
        <span style={{ fontFamily: C.mono, fontSize: 11, letterSpacing: "0.2em", color: C.glow, textTransform: "uppercase" }}>{label}</span>
      </div>
      {action}
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: "22px 24px",
      ...style,
    }}>
      {children}
    </div>
  );
}

const TOOLTIP_STYLE = {
  contentStyle: { background: "#080c25", border: `1px solid ${C.borderHi}`, borderRadius: 8, fontFamily: C.mono, fontSize: 11 },
  labelStyle: { color: C.text2 },
  itemStyle: { color: C.glow },
};

// ── Main dashboard ─────────────────────────────────────────────────────────────
export default function OwnerDashboard() {
  const router = useRouter();
  const [authState, setAuthState] = useState<"loading" | "denied" | "ok">("loading");
  const [tick, setTick] = useState(0);
  const [now, setNow] = useState("");

  useEffect(() => {
    import("@/lib/supabase/client").then(({ createClient }) => {
      createClient().auth.getUser().then(({ data, error }) => {
        if (error || !data?.user) { router.replace("/login"); return; }
        if (data.user.email !== OWNER_EMAIL) { setAuthState("denied"); return; }
        setAuthState("ok");
      }).catch(() => router.replace("/login"));
    });
  }, [router]);

  const updateClock = useCallback(() => {
    setNow(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "Asia/Kolkata" }) + " IST");
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    updateClock();
    const id = setInterval(updateClock, 1000);
    return () => clearInterval(id);
  }, [updateClock]);

  if (authState === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg }}>
        <div style={{ fontFamily: C.mono, fontSize: 13, color: C.glow, letterSpacing: "0.2em", animation: "nasa-ping 1.4s ease infinite" }}>
          AUTHENTICATING...
        </div>
      </div>
    );
  }

  if (authState === "denied") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: C.bg, gap: 16 }}>
        <div style={{ fontFamily: C.mono, fontSize: 11, letterSpacing: "0.3em", color: C.glowR }}>ACCESS DENIED</div>
        <div style={{ fontFamily: C.mono, fontSize: 32, color: C.glowR, fontWeight: 700 }}>401</div>
        <div style={{ fontFamily: C.mono, fontSize: 12, color: C.text3 }}>Restricted to mission commander only.</div>
        <button
          onClick={() => router.replace("/")}
          style={{ marginTop: 8, fontFamily: C.mono, fontSize: 11, color: C.text2, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 18px", cursor: "pointer", letterSpacing: "0.1em" }}
        >
          RETURN TO BASE →
        </button>
      </div>
    );
  }

  const planTotal = PLAN_DATA.reduce((s, p) => s + p.value, 0);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "0 0 60px" }}>
      {/* Global keyframes */}
      <style>{`
        @keyframes nasa-ping { 0%,100%{transform:scale(1);opacity:0.25} 50%{transform:scale(1.6);opacity:0} }
        @keyframes nasa-scan { 0%{background-position:0 -100%} 100%{background-position:0 300%} }
        .nasa-row:hover { background: rgba(0,212,255,0.04) !important; }
        .nasa-btn:hover { background: rgba(0,212,255,0.12) !important; border-color: rgba(0,212,255,0.5) !important; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(0,212,255,0.2); border-radius: 2px; }
      `}</style>

      {/* ── Topbar ──────────────────────────────────────────────────────────── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(10,14,39,0.92)", backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${C.border}`,
        padding: "12px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width={28} height={28} viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="28" stroke={C.glow} strokeWidth="1.5" opacity="0.4" />
              <circle cx="32" cy="32" r="28" stroke={C.glow} strokeWidth="1" strokeDasharray="3 6" opacity="0.6" transform="rotate(-30 32 32)" />
              <path d="M16 38C16 22 48 22 48 38" stroke={C.glow} strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
            <div>
              <div style={{ fontFamily: C.mono, fontSize: 13, fontWeight: 700, color: C.glow, letterSpacing: "0.08em" }}>KUNJARA OS</div>
              <div style={{ fontFamily: C.mono, fontSize: 9, color: C.text3, letterSpacing: "0.2em" }}>MISSION CONTROL</div>
            </div>
          </div>
          <div style={{ width: 1, height: 28, background: C.border }} />
          <div style={{ fontFamily: C.mono, fontSize: 10, color: C.text3, letterSpacing: "0.1em" }}>
            OWNER DASHBOARD · v1.0
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <PulseRing color={C.glowG} />
            <span style={{ fontFamily: C.mono, fontSize: 10, color: C.glowG, letterSpacing: "0.1em" }}>ALL SYSTEMS</span>
          </div>
          <div style={{ fontFamily: C.mono, fontSize: 12, color: C.text2, letterSpacing: "0.08em" }}>{now}</div>
          <button
            onClick={exportCSV}
            className="nasa-btn"
            style={{
              fontFamily: C.mono, fontSize: 10, letterSpacing: "0.15em", color: C.glow,
              background: "rgba(0,212,255,0.06)", border: `1px solid ${C.border}`,
              borderRadius: 6, padding: "7px 14px", cursor: "pointer", transition: "all 0.2s",
            }}
          >
            ↓ EXPORT CSV
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "32px 32px 0" }}>

        {/* ── Mission header ─────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: C.mono, fontSize: 10, color: C.text3, letterSpacing: "0.25em", marginBottom: 6 }}>
            ◆ MISSION STATUS · {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).toUpperCase()}
          </div>
          <h1 style={{ fontFamily: C.mono, fontSize: 22, fontWeight: 700, color: C.text1, letterSpacing: "0.04em", margin: 0 }}>
            Platform Overview
          </h1>
        </div>

        {/* ── KPI cards ──────────────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 28 }}>
          <MetricCard label="Total Users"    value="1,245"     sub="All-time registered"   color={C.glow}  trend="+47 this week" />
          <MetricCard label="New Signups"    value="47"        sub="This week"              color={C.glowG} trend="+96% vs W11"   />
          <MetricCard label="MRR"            value="₹1,23,450" sub="Monthly recurring"      color={C.glowA} trend="+3.8% WoW"     />
          <MetricCard label="Churn Rate"     value="2.3%"      sub="30-day rolling"         color={C.glowR} alert={false}        />
          <MetricCard label="Uptime"         value="89.0%"     sub="CDN degraded"           color={C.glowA} alert trend="-11%"   />
        </div>

        {/* ── Charts row ─────────────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 28 }}>

          {/* User growth */}
          <Card>
            <SectionHeader label="User Growth · 12W" />
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={GROWTH_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.06)" />
                <XAxis dataKey="week" tick={{ fontFamily: C.mono, fontSize: 9, fill: C.text3 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontFamily: C.mono, fontSize: 9, fill: C.text3 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="users" stroke={C.glow} strokeWidth={2} dot={false}
                  style={{ filter: `drop-shadow(0 0 6px ${C.glow})` }} />
                <Line type="monotone" dataKey="signups" stroke={C.glowG} strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
              <Legend color={C.glow}  label="Total users" />
              <Legend color={C.glowG} label="Weekly signups" dashed />
            </div>
          </Card>

          {/* Revenue trend */}
          <Card>
            <SectionHeader label="Revenue Trend · MRR" />
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={REVENUE_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.glowA} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={C.glowA} stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.06)" />
                <XAxis dataKey="week" tick={{ fontFamily: C.mono, fontSize: 9, fill: C.text3 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => "₹" + (v / 1000).toFixed(0) + "k"} tick={{ fontFamily: C.mono, fontSize: 9, fill: C.text3 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [inr(v), "MRR"]} />
                <Area type="monotone" dataKey="mrr" stroke={C.glowA} strokeWidth={2} fill="url(#mrrGrad)"
                  style={{ filter: `drop-shadow(0 0 6px ${C.glowA})` }} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* ── Bottom row: plan breakdown + system health ──────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 1fr", gap: 18, marginBottom: 28 }}>

          {/* Plan distribution */}
          <Card>
            <SectionHeader label="Plan Distribution" />
            <div style={{ display: "flex", justifyContent: "center" }}>
              <PieChart width={160} height={160}>
                <Pie data={PLAN_DATA} cx={80} cy={80} innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value" stroke="none">
                  {PLAN_DATA.map((p, i) => (
                    <Cell key={i} fill={p.color} style={{ filter: `drop-shadow(0 0 6px ${p.color})` }} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE.contentStyle} itemStyle={{ fontFamily: C.mono, fontSize: 11 }} />
              </PieChart>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
              {PLAN_DATA.map((p) => (
                <div key={p.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color, display: "block" }} />
                    <span style={{ fontFamily: C.mono, fontSize: 11, color: C.text2 }}>{p.name}</span>
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <span style={{ fontFamily: C.mono, fontSize: 11, color: C.text1 }}>{p.value}</span>
                    <span style={{ fontFamily: C.mono, fontSize: 11, color: C.text3 }}>{Math.round(p.value / planTotal * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Signups weekly bar */}
          <Card>
            <SectionHeader label="Weekly Signup Velocity" />
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={GROWTH_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.06)" vertical={false} />
                <XAxis dataKey="week" tick={{ fontFamily: C.mono, fontSize: 9, fill: C.text3 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontFamily: C.mono, fontSize: 9, fill: C.text3 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="signups" fill={C.glow} radius={[3, 3, 0, 0]} opacity={0.85}
                  style={{ filter: `drop-shadow(0 0 4px ${C.glow})` }} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 12, display: "flex", gap: 24 }}>
              <Stat label="Peak week" value="47" color={C.glow} />
              <Stat label="Avg/week" value="33" />
              <Stat label="Total 12W" value="382" />
            </div>
          </Card>

          {/* System health */}
          <Card>
            <SectionHeader label="System Health" />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {HEALTH.map((h) => (
                <div key={h.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", borderRadius: 8, background: "rgba(0,0,0,0.2)", border: `1px solid ${h.status === "DEGRADED" ? "rgba(255,180,0,0.2)" : "rgba(0,212,255,0.07)"}` }}>
                  <PulseRing color={h.status === "NOMINAL" ? C.glowG : C.glowA} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: C.mono, fontSize: 10, color: C.text2, letterSpacing: "0.05em" }}>{h.label}</div>
                    <div style={{ fontFamily: C.mono, fontSize: 9, color: C.text3 }}>{h.uptime} · {h.latency}</div>
                  </div>
                  <span style={{ fontFamily: C.mono, fontSize: 9, color: h.status === "NOMINAL" ? C.glowG : C.glowA, letterSpacing: "0.1em" }}>
                    {h.status}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Signups table ──────────────────────────────────────────────────── */}
        <Card style={{ marginBottom: 28 }}>
          <SectionHeader
            label="Recent Signups · Last 10"
            action={
              <button onClick={exportCSV} className="nasa-btn" style={{ fontFamily: C.mono, fontSize: 9, letterSpacing: "0.15em", color: C.text3, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 4, padding: "5px 10px", cursor: "pointer", transition: "all 0.2s" }}>
                ↓ CSV
              </button>
            }
          />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["#", "Name", "Email", "Plan", "City", "Date"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "0 12px 10px", fontFamily: C.mono, fontSize: 9, letterSpacing: "0.18em", color: C.text3, textTransform: "uppercase", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RECENT_SIGNUPS.map((row, i) => (
                  <tr key={row.email} className="nasa-row" style={{ borderBottom: `1px solid rgba(0,212,255,0.05)`, transition: "background 0.15s" }}>
                    <td style={{ padding: "10px 12px", fontFamily: C.mono, fontSize: 10, color: C.text3 }}>{String(i + 1).padStart(2, "0")}</td>
                    <td style={{ padding: "10px 12px", fontFamily: C.mono, fontSize: 11, color: C.text1 }}>{row.name}</td>
                    <td style={{ padding: "10px 12px", fontFamily: C.mono, fontSize: 10, color: C.text2 }}>{row.email}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{
                        fontFamily: C.mono, fontSize: 9, letterSpacing: "0.12em", padding: "3px 8px", borderRadius: 4,
                        background: row.plan === "Pro" ? "rgba(0,212,255,0.12)" : row.plan === "Basic" ? "rgba(255,184,0,0.10)" : "rgba(255,255,255,0.05)",
                        color: row.plan === "Pro" ? C.glow : row.plan === "Basic" ? C.glowA : C.text3,
                        border: `1px solid ${row.plan === "Pro" ? "rgba(0,212,255,0.25)" : row.plan === "Basic" ? "rgba(255,184,0,0.2)" : "rgba(255,255,255,0.08)"}`,
                      }}>
                        {row.plan.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", fontFamily: C.mono, fontSize: 10, color: C.text2 }}>{row.city}</td>
                    <td style={{ padding: "10px 12px", fontFamily: C.mono, fontSize: 10, color: C.text3 }}>{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* ── Feedback ───────────────────────────────────────────────────────── */}
        <Card>
          <SectionHeader label="Recent Feedback" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {FEEDBACK.map((f) => (
              <div key={f.name} style={{ background: "#080c22", border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontFamily: C.mono, fontSize: 11, color: C.text1 }}>{f.name}</div>
                    <div style={{ fontFamily: C.mono, fontSize: 9, color: C.text3, letterSpacing: "0.1em" }}>{f.plan.toUpperCase()} · {f.date}</div>
                  </div>
                  <div style={{ display: "flex", gap: 2 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} style={{ fontSize: 12, color: s <= f.rating ? C.glowA : C.text3 }}>★</span>
                    ))}
                  </div>
                </div>
                <p style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 12, lineHeight: 1.65, color: C.text2, margin: 0, fontStyle: "italic" }}>
                  &ldquo;{f.text}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Footer ─────────────────────────────────────────────────────────── */}
        <div style={{ marginTop: 40, paddingTop: 20, borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: C.mono, fontSize: 9, color: C.text3, letterSpacing: "0.2em" }}>
            KUNJARA OS™ MISSION CONTROL · OWNER ACCESS · DATA AS OF {new Date().toLocaleDateString("en-IN").toUpperCase()}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <PulseRing color={C.glowG} />
            <span style={{ fontFamily: C.mono, fontSize: 9, color: C.glowG, letterSpacing: "0.15em" }}>LIVE</span>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Tiny helpers ───────────────────────────────────────────────────────────────
function Legend({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <svg width={20} height={2}>
        {dashed
          ? <line x1="0" y1="1" x2="20" y2="1" stroke={color} strokeWidth="1.5" strokeDasharray="4 2" />
          : <line x1="0" y1="1" x2="20" y2="1" stroke={color} strokeWidth="2" />}
      </svg>
      <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 10, color: "rgba(224,247,255,0.4)" }}>{label}</span>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 9, color: "rgba(224,247,255,0.3)", letterSpacing: "0.15em", marginBottom: 2 }}>{label.toUpperCase()}</div>
      <div style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 15, fontWeight: 700, color: color ?? "rgba(224,247,255,0.8)" }}>{value}</div>
    </div>
  );
}
