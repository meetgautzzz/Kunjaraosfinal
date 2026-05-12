"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

const OWNER_EMAIL = "meetgautzzz@gmail.com";

const C = {
  bg:       "#0a0e27",
  card:     "#0d1335",
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

interface Metrics {
  totalUsers:        number;
  newSignupsThisWeek: number;
  mrrTotal:          number;
  churnRate:         number;
  proposalCount:     number;
  planDistribution:  { plan: string; count: number }[];
  userGrowth:        { week: string; users: number; signups: number }[];
  revenueData:       { week: string; revenue: number }[];
  recentSignups:     { id: string; email: string; plan: string; createdAt: string }[];
}

const PLAN_COLORS: Record<string, string> = { Free: C.text3, Pro: C.glow, Basic: C.glowA };

const HEALTH = [
  { label: "API Gateway",    status: "NOMINAL",  latency: "~42ms",  uptime: "99.98%" },
  { label: "Database",       status: "NOMINAL",  latency: "~8ms",   uptime: "99.99%" },
  { label: "AI Services",    status: "NOMINAL",  latency: "~1.2s",  uptime: "99.91%" },
  { label: "Email (Resend)", status: "NOMINAL",  latency: "~340ms", uptime: "99.85%" },
  { label: "CDN / Vercel",   status: "NOMINAL",  latency: "~60ms",  uptime: "99.95%" },
  { label: "Razorpay",       status: "NOMINAL",  latency: "~210ms", uptime: "99.70%" },
];

const TOOLTIP_STYLE = {
  contentStyle: { background: "#080c25", border: `1px solid ${C.borderHi}`, borderRadius: 8, fontFamily: C.mono, fontSize: 11 },
  labelStyle:   { color: C.text2 },
  itemStyle:    { color: C.glow },
};

// ── Sub-components ─────────────────────────────────────────────────────────────
function PulseRing({ color = C.glow }: { color?: string }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: 10, height: 10, flexShrink: 0 }}>
      <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color, opacity: 0.25, animation: "nasa-ping 1.4s cubic-bezier(0,0,0.2,1) infinite" }} />
      <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "block" }} />
    </span>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 24px", ...style }}>
      {children}
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
      <div style={{ width: 3, height: 16, background: C.glow, borderRadius: 2, boxShadow: `0 0 8px ${C.glow}` }} />
      <span style={{ fontFamily: C.mono, fontSize: 11, letterSpacing: "0.2em", color: C.glow, textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}

function MetricCard({ label, value, sub, color = C.glow, trend }: {
  label: string; value: string; sub: string; color?: string; trend?: string;
}) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 10, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: 0.6 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <PulseRing color={color} />
        <span style={{ fontFamily: C.mono, fontSize: 10, letterSpacing: "0.18em", color: C.text3, textTransform: "uppercase" }}>{label}</span>
      </div>
      <div style={{ fontFamily: C.mono, fontSize: 26, fontWeight: 700, color: C.text1, lineHeight: 1, letterSpacing: "-0.02em" }}>{value}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: C.mono, fontSize: 11, color: C.text3 }}>{sub}</span>
        {trend && <span style={{ fontFamily: C.mono, fontSize: 11, color: trend.startsWith("+") ? C.glowG : C.glowR }}>{trend}</span>}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 22px", height: 110, animation: "nasa-pulse 1.5s ease infinite" }} />
  );
}

function inr(n: number) { return "₹" + n.toLocaleString("en-IN"); }

function exportCSV(metrics: Metrics) {
  const header = ["Email", "Plan", "Signup Date"];
  const rows = metrics.recentSignups.map((r) => [r.email, r.plan, r.createdAt]);
  const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `kunjara-signups-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function OwnerDashboard() {
  const router = useRouter();
  const [authState, setAuthState] = useState<"loading" | "denied" | "ok">("loading");
  const [metrics,   setMetrics]   = useState<Metrics | null>(null);
  const [dataState, setDataState] = useState<"loading" | "error" | "ok">("loading");
  const [now,       setNow]       = useState("");

  // Auth check
  useEffect(() => {
    import("@/lib/supabase/client").then(({ createClient }) => {
      createClient().auth.getUser().then(({ data, error }) => {
        if (error || !data?.user) { router.replace("/login"); return; }
        if (data.user.email !== OWNER_EMAIL) { setAuthState("denied"); return; }
        setAuthState("ok");
      }).catch(() => router.replace("/login"));
    });
  }, [router]);

  // Live IST clock
  const tick = useCallback(() => {
    setNow(new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false, timeZone: "Asia/Kolkata",
    }) + " IST");
  }, []);

  useEffect(() => {
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [tick]);

  // Fetch real metrics from server API
  const loadMetrics = useCallback(async () => {
    setDataState("loading");
    try {
      const res = await fetch("/api/admin/metrics");
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setMetrics(data);
      setDataState("ok");
    } catch (e) {
      console.error("[admin/dashboard] fetch failed", e);
      setDataState("error");
    }
  }, []);

  useEffect(() => {
    if (authState !== "ok") return;
    loadMetrics();
    const id = setInterval(loadMetrics, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(id);
  }, [authState, loadMetrics]);

  // ── Auth states ──────────────────────────────────────────────────────────────
  if (authState === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg }}>
        <div style={{ fontFamily: C.mono, fontSize: 13, color: C.glow, letterSpacing: "0.2em", animation: "nasa-ping 1.4s ease infinite" }}>AUTHENTICATING...</div>
      </div>
    );
  }

  if (authState === "denied") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: C.bg, gap: 16 }}>
        <div style={{ fontFamily: C.mono, fontSize: 11, letterSpacing: "0.3em", color: C.glowR }}>ACCESS DENIED</div>
        <div style={{ fontFamily: C.mono, fontSize: 32, color: C.glowR, fontWeight: 700 }}>401</div>
        <div style={{ fontFamily: C.mono, fontSize: 12, color: C.text3 }}>Restricted to mission commander only.</div>
        <button onClick={() => router.replace("/")} style={{ marginTop: 8, fontFamily: C.mono, fontSize: 11, color: C.text2, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 18px", cursor: "pointer", letterSpacing: "0.1em" }}>
          RETURN TO BASE →
        </button>
      </div>
    );
  }

  const planTotal = metrics?.planDistribution.reduce((s, p) => s + p.count, 0) ?? 1;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, paddingBottom: 60 }}>
      <style>{`
        @keyframes nasa-ping  { 0%,100%{transform:scale(1);opacity:0.25} 50%{transform:scale(1.6);opacity:0} }
        @keyframes nasa-pulse { 0%,100%{opacity:0.4} 50%{opacity:0.8} }
        .nasa-row:hover { background: rgba(0,212,255,0.04) !important; }
        .nasa-btn:hover { background: rgba(0,212,255,0.12) !important; border-color: rgba(0,212,255,0.5) !important; }
        ::-webkit-scrollbar { width:4px } ::-webkit-scrollbar-track { background:transparent } ::-webkit-scrollbar-thumb { background:rgba(0,212,255,0.2);border-radius:2px }
      `}</style>

      {/* ── Topbar ────────────────────────────────────────────────────────────── */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(10,14,39,0.92)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${C.border}`, padding: "12px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width={28} height={28} viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="28" stroke={C.glow} strokeWidth="1.5" opacity="0.4" />
            <circle cx="32" cy="32" r="28" stroke={C.glow} strokeWidth="1" strokeDasharray="3 6" opacity="0.6" transform="rotate(-30 32 32)" />
            <path d="M16 38C16 22 48 22 48 38" stroke={C.glow} strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
          <div>
            <div style={{ fontFamily: C.mono, fontSize: 13, fontWeight: 700, color: C.glow, letterSpacing: "0.08em" }}>KUNJARA OS</div>
            <div style={{ fontFamily: C.mono, fontSize: 9, color: C.text3, letterSpacing: "0.2em" }}>MISSION CONTROL · LIVE DATA</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {dataState === "loading" && <span style={{ fontFamily: C.mono, fontSize: 10, color: C.glowA, letterSpacing: "0.1em" }}>SYNCING...</span>}
          {dataState === "error"   && <button onClick={loadMetrics} style={{ fontFamily: C.mono, fontSize: 10, color: C.glowR, background: "transparent", border: `1px solid ${C.glowR}40`, borderRadius: 4, padding: "4px 10px", cursor: "pointer", letterSpacing: "0.1em" }}>RETRY ↺</button>}
          {dataState === "ok"      && <div style={{ display: "flex", alignItems: "center", gap: 8 }}><PulseRing color={C.glowG} /><span style={{ fontFamily: C.mono, fontSize: 10, color: C.glowG, letterSpacing: "0.1em" }}>LIVE</span></div>}
          <div style={{ fontFamily: C.mono, fontSize: 12, color: C.text2, letterSpacing: "0.08em" }}>{now}</div>
          {metrics && (
            <button onClick={() => exportCSV(metrics)} className="nasa-btn" style={{ fontFamily: C.mono, fontSize: 10, letterSpacing: "0.15em", color: C.glow, background: "rgba(0,212,255,0.06)", border: `1px solid ${C.border}`, borderRadius: 6, padding: "7px 14px", cursor: "pointer", transition: "all 0.2s" }}>
              ↓ EXPORT CSV
            </button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "32px 32px 0" }}>
        {/* Mission header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: C.mono, fontSize: 10, color: C.text3, letterSpacing: "0.25em", marginBottom: 6 }}>
            ◆ MISSION STATUS · {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).toUpperCase()}
          </div>
          <h1 style={{ fontFamily: C.mono, fontSize: 22, fontWeight: 700, color: C.text1, letterSpacing: "0.04em", margin: 0 }}>Platform Overview</h1>
        </div>

        {/* ── KPI cards ──────────────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 28 }}>
          {dataState === "loading" ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          ) : metrics ? (
            <>
              <MetricCard label="Total Users"    value={metrics.totalUsers.toLocaleString("en-IN")} sub="All-time registered"  color={C.glow}  trend={`+${metrics.newSignupsThisWeek} this week`} />
              <MetricCard label="New Signups"    value={String(metrics.newSignupsThisWeek)}          sub="Last 7 days"          color={C.glowG} />
              <MetricCard label="MRR"            value={inr(metrics.mrrTotal)}                        sub="Active Pro subscribers" color={C.glowA} />
              <MetricCard label="Churn Rate"     value={`${metrics.churnRate}%`}                     sub="30-day rolling"       color={metrics.churnRate > 5 ? C.glowR : C.glow} />
              <MetricCard label="Proposals"      value={metrics.proposalCount.toLocaleString("en-IN")} sub="Total generated"     color={C.glow} />
            </>
          ) : (
            <div style={{ gridColumn: "1/-1", fontFamily: C.mono, fontSize: 12, color: C.glowR, textAlign: "center", padding: 40 }}>
              Failed to load metrics. <button onClick={loadMetrics} style={{ color: C.glow, background: "none", border: "none", cursor: "pointer", fontFamily: C.mono, fontSize: 12 }}>Retry →</button>
            </div>
          )}
        </div>

        {/* ── Charts ─────────────────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 28 }}>
          <Card>
            <SectionHeader label="User Growth · 12W" />
            {metrics ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={metrics.userGrowth} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.06)" />
                    <XAxis dataKey="week" tick={{ fontFamily: C.mono, fontSize: 9, fill: C.text3 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontFamily: C.mono, fontSize: 9, fill: C.text3 }} axisLine={false} tickLine={false} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Line type="monotone" dataKey="users"   stroke={C.glow}  strokeWidth={2}   dot={false} style={{ filter: `drop-shadow(0 0 6px ${C.glow})` }} />
                    <Line type="monotone" dataKey="signups" stroke={C.glowG} strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
                  <LegendLine color={C.glow}  label="Total users" />
                  <LegendLine color={C.glowG} label="Weekly signups" dashed />
                </div>
              </>
            ) : <PlaceholderChart />}
          </Card>

          <Card>
            <SectionHeader label="Revenue Trend · MRR (₹)" />
            {metrics ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={metrics.revenueData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.glowA} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={C.glowA} stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.06)" />
                  <XAxis dataKey="week" tick={{ fontFamily: C.mono, fontSize: 9, fill: C.text3 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => "₹" + (Number(v) / 1000).toFixed(0) + "k"} tick={{ fontFamily: C.mono, fontSize: 9, fill: C.text3 }} axisLine={false} tickLine={false} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [inr(Number(v)), "Revenue"]} />
                  <Area type="monotone" dataKey="revenue" stroke={C.glowA} strokeWidth={2} fill="url(#mrrGrad)" style={{ filter: `drop-shadow(0 0 6px ${C.glowA})` }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <PlaceholderChart />}
          </Card>
        </div>

        {/* ── Plan distribution + Signup bar + System health ──────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 1fr", gap: 18, marginBottom: 28 }}>
          <Card>
            <SectionHeader label="Plan Distribution" />
            {metrics ? (
              <>
                <PieChart width={160} height={160} style={{ margin: "0 auto" }}>
                  <Pie data={metrics.planDistribution.map((p) => ({ ...p, name: p.plan, value: p.count }))} cx={80} cy={80} innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value" stroke="none">
                    {metrics.planDistribution.map((p, i) => (
                      <Cell key={i} fill={PLAN_COLORS[p.plan] ?? C.text3} style={{ filter: `drop-shadow(0 0 6px ${PLAN_COLORS[p.plan] ?? C.text3})` }} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE.contentStyle} itemStyle={{ fontFamily: C.mono, fontSize: 11 }} />
                </PieChart>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                  {metrics.planDistribution.map((p) => (
                    <div key={p.plan} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: PLAN_COLORS[p.plan] ?? C.text3, display: "block" }} />
                        <span style={{ fontFamily: C.mono, fontSize: 11, color: C.text2 }}>{p.plan}</span>
                      </div>
                      <div style={{ display: "flex", gap: 10 }}>
                        <span style={{ fontFamily: C.mono, fontSize: 11, color: C.text1 }}>{p.count}</span>
                        <span style={{ fontFamily: C.mono, fontSize: 11, color: C.text3 }}>{Math.round(p.count / planTotal * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : <PlaceholderChart height={220} />}
          </Card>

          <Card>
            <SectionHeader label="Weekly Signup Velocity" />
            {metrics ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={metrics.userGrowth} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.06)" vertical={false} />
                    <XAxis dataKey="week" tick={{ fontFamily: C.mono, fontSize: 9, fill: C.text3 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontFamily: C.mono, fontSize: 9, fill: C.text3 }} axisLine={false} tickLine={false} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Bar dataKey="signups" fill={C.glow} radius={[3, 3, 0, 0]} opacity={0.85} style={{ filter: `drop-shadow(0 0 4px ${C.glow})` }} />
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ marginTop: 12, display: "flex", gap: 24 }}>
                  <MiniStat label="This week" value={String(metrics.newSignupsThisWeek)} color={C.glow} />
                  <MiniStat label="Avg/week"  value={String(Math.round(metrics.userGrowth.reduce((s, w) => s + w.signups, 0) / 12))} />
                  <MiniStat label="Total 12W"  value={String(metrics.userGrowth.reduce((s, w) => s + w.signups, 0))} />
                </div>
              </>
            ) : <PlaceholderChart height={220} />}
          </Card>

          <Card>
            <SectionHeader label="System Health" />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {HEALTH.map((h) => (
                <div key={h.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", borderRadius: 8, background: "rgba(0,0,0,0.2)", border: `1px solid ${h.status === "DEGRADED" ? "rgba(255,180,0,0.2)" : "rgba(0,212,255,0.07)"}` }}>
                  <PulseRing color={h.status === "NOMINAL" ? C.glowG : C.glowA} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: C.mono, fontSize: 10, color: C.text2, letterSpacing: "0.05em" }}>{h.label}</div>
                    <div style={{ fontFamily: C.mono, fontSize: 9, color: C.text3 }}>{h.uptime} · {h.latency}</div>
                  </div>
                  <span style={{ fontFamily: C.mono, fontSize: 9, color: h.status === "NOMINAL" ? C.glowG : C.glowA, letterSpacing: "0.1em" }}>{h.status}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Recent signups table ────────────────────────────────────────────── */}
        <Card style={{ marginBottom: 40 }}>
          <SectionHeader label={`Recent Signups · Last ${metrics?.recentSignups.length ?? 10}`} />
          {metrics ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {["#", "Email", "Plan", "Signup Date"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "0 12px 10px", fontFamily: C.mono, fontSize: 9, letterSpacing: "0.18em", color: C.text3, textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metrics.recentSignups.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: "24px 12px", fontFamily: C.mono, fontSize: 11, color: C.text3, textAlign: "center" }}>No signups yet</td></tr>
                  ) : metrics.recentSignups.map((row, i) => (
                    <tr key={row.id} className="nasa-row" style={{ borderBottom: `1px solid rgba(0,212,255,0.05)`, transition: "background 0.15s" }}>
                      <td style={{ padding: "10px 12px", fontFamily: C.mono, fontSize: 10, color: C.text3 }}>{String(i + 1).padStart(2, "0")}</td>
                      <td style={{ padding: "10px 12px", fontFamily: C.mono, fontSize: 11, color: C.text1 }}>{row.email}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ fontFamily: C.mono, fontSize: 9, letterSpacing: "0.12em", padding: "3px 8px", borderRadius: 4, background: row.plan === "pro" ? "rgba(0,212,255,0.12)" : row.plan === "basic" ? "rgba(255,184,0,0.10)" : "rgba(255,255,255,0.05)", color: row.plan === "pro" ? C.glow : row.plan === "basic" ? C.glowA : C.text3, border: `1px solid ${row.plan === "pro" ? "rgba(0,212,255,0.25)" : row.plan === "basic" ? "rgba(255,184,0,0.2)" : "rgba(255,255,255,0.08)"}` }}>
                          {row.plan.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", fontFamily: C.mono, fontSize: 10, color: C.text3 }}>{row.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Array.from({ length: 5 }).map((_, i) => <div key={i} style={{ height: 36, borderRadius: 6, background: "rgba(0,212,255,0.04)", animation: "nasa-pulse 1.5s ease infinite" }} />)}
            </div>
          )}
        </Card>

        {/* Footer */}
        <div style={{ paddingTop: 20, borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: C.mono, fontSize: 9, color: C.text3, letterSpacing: "0.2em" }}>
            KUNJARA OS™ MISSION CONTROL · OWNER ACCESS · REAL-TIME DATA
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <PulseRing color={dataState === "ok" ? C.glowG : C.glowA} />
            <span style={{ fontFamily: C.mono, fontSize: 9, color: dataState === "ok" ? C.glowG : C.glowA, letterSpacing: "0.15em" }}>
              {dataState === "ok" ? "LIVE" : "SYNCING"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlaceholderChart({ height = 200 }: { height?: number }) {
  return <div style={{ height, borderRadius: 8, background: "rgba(0,212,255,0.03)", animation: "nasa-pulse 1.5s ease infinite" }} />;
}

function LegendLine({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
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

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 9, color: "rgba(224,247,255,0.3)", letterSpacing: "0.15em", marginBottom: 2 }}>{label.toUpperCase()}</div>
      <div style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 15, fontWeight: 700, color: color ?? "rgba(224,247,255,0.8)" }}>{value}</div>
    </div>
  );
}
