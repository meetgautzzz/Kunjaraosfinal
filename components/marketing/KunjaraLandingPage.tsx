"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const ACCENT = "#D4A85F";

// ── KunjaraMark ──────────────────────────────────────────────────────────────
function KunjaraMark({ size = 40, color = "currentColor", glow = false }: { size?: number; color?: string; glow?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: glow ? `drop-shadow(0 0 18px ${color}88)` : "none" }}
    >
      <circle cx="32" cy="32" r="29" stroke={color} strokeWidth="1.25" opacity="0.35" />
      <circle cx="32" cy="32" r="29" stroke={color} strokeWidth="1.25" strokeDasharray="2 6" opacity="0.5" transform="rotate(-30 32 32)" />
      <g stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M16 38 C 16 22, 48 22, 48 38" />
        <path d="M22 38 C 22 48, 32 50, 34 42 C 35 38, 30 36, 30 40" />
        <path d="M40 40 L 44 46" />
        <circle cx="40" cy="32" r="1.4" fill={color} stroke="none" />
      </g>
      <circle cx="58" cy="22" r="1.6" fill={color} />
    </svg>
  );
}

function KunjaraLogo({ size = 28, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: size * 0.6, color }}>
      <KunjaraMark size={size * 1.5} color={color} />
      <div style={{ display: "flex", alignItems: "baseline", gap: 4, lineHeight: 1 }}>
        <span style={{ fontFamily: "var(--font-instrument-serif, serif)", fontSize: size, fontStyle: "italic", letterSpacing: "-0.01em", fontWeight: 400 }}>Kunjara</span>
        <span style={{ fontFamily: "var(--font-space-grotesk, system-ui)", fontSize: size * 0.78, fontWeight: 500, letterSpacing: "0.04em" }}>OS</span>
        <span style={{ fontFamily: "var(--font-space-grotesk, system-ui)", fontSize: size * 0.32, fontWeight: 500, opacity: 0.6, marginLeft: 2, alignSelf: "flex-start", marginTop: size * 0.1 }}>™</span>
      </div>
    </div>
  );
}

// ── Nav ──────────────────────────────────────────────────────────────────────
function Nav({ scrolled }: { scrolled: boolean }) {
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      padding: "16px 6vw",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: scrolled ? "rgba(10,10,12,0.88)" : "transparent",
      backdropFilter: scrolled ? "blur(20px)" : "none",
      borderBottom: scrolled ? "1px solid rgba(255,255,255,0.07)" : "1px solid transparent",
      transition: "background 400ms, backdrop-filter 400ms, border-color 400ms",
    }}>
      <KunjaraLogo size={22} color="#F4F1EA" />
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <Link href="/pricing" style={{
          padding: "8px 16px", borderRadius: 8,
          color: "rgba(244,241,234,0.65)", fontSize: 13, textDecoration: "none",
          transition: "color 200ms",
        }}>Pricing</Link>
        <Link href="/features" style={{
          padding: "8px 16px", borderRadius: 8,
          color: "rgba(244,241,234,0.65)", fontSize: 13, textDecoration: "none",
        }}>Features</Link>
        <Link href="/login" style={{
          padding: "8px 16px", borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.12)",
          color: "rgba(244,241,234,0.75)", fontSize: 13, textDecoration: "none",
          marginLeft: 4,
        }}>Log in</Link>
        <Link href="/signup" style={{
          padding: "9px 20px", borderRadius: 999,
          background: ACCENT, color: "#0A0A0C",
          fontSize: 13, fontWeight: 600, textDecoration: "none",
          boxShadow: `0 4px 20px -6px ${ACCENT}80`,
        }}>Get started →</Link>
      </div>
    </nav>
  );
}

// ── ProposalMock ─────────────────────────────────────────────────────────────
function ProposalMock({ tilt = true }: { tilt?: boolean }) {
  const [hover, setHover] = useState(false);
  const transform = tilt
    ? `perspective(1800px) rotateY(${hover ? -4 : -7}deg) rotateX(${hover ? 1 : 3}deg) translateZ(0)`
    : "none";

  const rows = [
    { label: "Venue · Grand Hyatt BKC", sub: "Ballroom + Pre-function", price: "₹ 12.2L", color: ACCENT },
    { label: "F&B · 500 pax · multi-cuisine", sub: "Live counters + dessert lounge", price: "₹ 7.7L", color: "#2F7A78" },
    { label: "Decor · Modern India theme", sub: "Terracotta · Teal · Champagne", price: "₹ 6.3L", color: "#C9785F" },
  ];

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        transform,
        transition: "transform 700ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        transformStyle: "preserve-3d",
        width: "100%",
        maxWidth: 580,
        borderRadius: 18,
        overflow: "hidden",
        background: "linear-gradient(180deg, #0E0E10 0%, #15151A 100%)",
        boxShadow: "0 60px 120px -40px rgba(0,0,0,0.8), 0 30px 60px -30px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.05)",
        color: "#E8E6E1",
        fontFamily: "var(--font-space-grotesk, system-ui)",
      }}
    >
      {/* Window chrome */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
        <div style={{ display: "flex", gap: 6 }}>
          <span style={{ width: 11, height: 11, borderRadius: 999, background: "#FF5F57", display: "block" }} />
          <span style={{ width: 11, height: 11, borderRadius: 999, background: "#FEBC2E", display: "block" }} />
          <span style={{ width: 11, height: 11, borderRadius: 999, background: "#28C840", display: "block" }} />
        </div>
        <div style={{ marginLeft: 10, fontSize: 11, color: "rgba(232,230,225,0.5)", fontFamily: "var(--font-jetbrains-mono, monospace)", letterSpacing: "0.02em" }}>
          kunjaraos.com/event-room/aurora-corp-2026
        </div>
        <div style={{ marginLeft: "auto" }}>
          <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 999, background: "rgba(193,154,91,0.15)", color: ACCENT, border: "1px solid rgba(193,154,91,0.3)", fontFamily: "var(--font-jetbrains-mono, monospace)", letterSpacing: "0.06em" }}>DRAFT</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "22px 24px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.18em", color: "rgba(212,168,95,0.85)", fontFamily: "var(--font-jetbrains-mono, monospace)", marginBottom: 8 }}>PROPOSAL · 0042</div>
            <div style={{ fontFamily: "var(--font-instrument-serif, serif)", fontSize: 26, lineHeight: 1.05, fontStyle: "italic", color: "#F4F1EA" }}>
              Aurora Corp · Annual Gala<br />
              <span style={{ fontStyle: "normal", fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 17, color: "rgba(244,241,234,0.7)", fontWeight: 400 }}>
                Mumbai · 500 pax · Mar 2026
              </span>
            </div>
          </div>
          <div style={{ fontSize: 11, fontFamily: "var(--font-jetbrains-mono, monospace)", color: "rgba(232,230,225,0.5)", textAlign: "right", lineHeight: 1.6 }}>
            <div>500 pax</div>
            <div>+18% GST</div>
            <div style={{ color: "#7AD4A0" }}>● client viewing</div>
          </div>
        </div>

        <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
          {rows.map((row) => (
            <div key={row.label} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto", alignItems: "center", gap: 12, padding: "10px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10 }}>
              <span style={{ width: 5, height: 22, background: row.color, borderRadius: 2, display: "block" }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#F4F1EA" }}>{row.label}</div>
                <div style={{ fontSize: 11, color: "rgba(232,230,225,0.5)" }}>{row.sub}</div>
              </div>
              <div style={{ fontSize: 11, color: "rgba(232,230,225,0.4)", fontFamily: "var(--font-jetbrains-mono, monospace)" }}>▦ moodboard</div>
              <div style={{ fontSize: 12, fontFamily: "var(--font-jetbrains-mono, monospace)", color: "#F4F1EA" }}>{row.price}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px dashed rgba(255,255,255,0.1)" }}>
          <div style={{ fontSize: 11, color: "rgba(232,230,225,0.5)", fontFamily: "var(--font-jetbrains-mono, monospace)", letterSpacing: "0.08em" }}>GRAND TOTAL · INCL. 18% GST</div>
          <div style={{ fontFamily: "var(--font-instrument-serif, serif)", fontSize: 24, fontStyle: "italic", color: ACCENT }}>₹ 30.84 L</div>
        </div>

        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, background: "linear-gradient(90deg, rgba(212,168,95,0.08), transparent)", border: "1px solid rgba(212,168,95,0.2)" }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: ACCENT, boxShadow: `0 0 10px ${ACCENT}`, display: "block", flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontFamily: "var(--font-jetbrains-mono, monospace)", color: "rgba(212,168,95,0.9)", letterSpacing: "0.04em" }}>
            architected in 6m 12s · proposal intelligence: high intent
          </span>
        </div>
      </div>
    </div>
  );
}

// ── CinematicHero ────────────────────────────────────────────────────────────
function CinematicHero({ opacity, scale, blur }: { opacity: number; scale: number; blur: number }) {
  return (
    <div style={{ position: "absolute", inset: 0, width: "100%", height: "100vh", pointerEvents: blur > 4 ? "none" : "auto", zIndex: 1, opacity, transform: `scale(${scale})`, filter: blur > 0 ? `blur(${blur}px)` : "none", transition: "none" }}>
      {/* Background */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=2400&q=85)`,
        backgroundSize: "cover", backgroundPosition: "center",
        transform: "scale(1.05)",
        animation: "slowZoom 22s ease-in-out infinite alternate",
      }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 40%, rgba(120,60,20,0.25) 0%, rgba(0,0,0,0.65) 50%, rgba(0,0,0,0.95) 100%)", mixBlendMode: "multiply" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 40%, rgba(10,10,12,0.85) 90%, #0A0A0C 100%)" }} />

      {/* Particles */}
      <div className="lp-particles" style={{ position: "absolute", inset: 0, overflow: "hidden" }} aria-hidden>
        {Array.from({ length: 18 }).map((_, i) => (
          <span key={i} style={{
            ["--i" as string]: i,
            ["--delay" as string]: `${(i * 0.7) % 8}s`,
            ["--duration" as string]: `${8 + (i % 5) * 2}s`,
            ["--x" as string]: `${(i * 53) % 100}%`,
            ["--size" as string]: `${2 + (i % 3)}px`,
          }} />
        ))}
      </div>

      {/* Vignette */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 100%)", pointerEvents: "none" }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 2, height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "0 6vw", textAlign: "center", color: "#F4F1EA" }}>
        <div className="lp-fade-up" style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, letterSpacing: "0.4em", color: ACCENT, opacity: 0.9, marginBottom: 32, animationDelay: "0.2s" }}>
          ◆ &nbsp;ACT&nbsp;I&nbsp; ◆
        </div>

        {/* Canonical h1 — one per page, owned here */}
        <h1
          className="lp-fade-up"
          style={{
            fontFamily: "var(--font-instrument-serif, serif)",
            fontSize: "clamp(48px, 7.5vw, 112px)",
            lineHeight: 1.0,
            fontWeight: 400,
            margin: 0,
            maxWidth: 1100,
            letterSpacing: "-0.02em",
            animationDelay: "0.5s",
          }}
        >
          Every great event<br />
          <span style={{ fontStyle: "italic", color: ACCENT }}>starts with a plan.</span>
        </h1>

        <p
          className="lp-fade-up"
          style={{
            marginTop: 28,
            fontFamily: "var(--font-space-grotesk, sans-serif)",
            fontSize: "clamp(15px, 1.3vw, 19px)",
            lineHeight: 1.65,
            color: "rgba(244,241,234,0.7)",
            letterSpacing: "0.01em",
            maxWidth: 560,
            animationDelay: "0.9s",
          }}
        >
          Generate proposals, collaborate in real time, and close events faster with{" "}
          <em style={{ fontFamily: "var(--font-instrument-serif, serif)", fontStyle: "italic", color: ACCENT, fontWeight: 400 }}>Event Rooms™</em>.
        </p>

        <div
          className="lp-fade-up"
          style={{ marginTop: 44, display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", animationDelay: "1.15s" }}
        >
          <Link
            href="/signup"
            aria-label="Start planning your event with Kunjara OS"
            className="lp-cta-primary"
            style={{
              padding: "15px 30px",
              borderRadius: 999,
              fontFamily: "var(--font-space-grotesk, sans-serif)",
              fontSize: 15, fontWeight: 600,
              color: "#0A0A0C",
              background: `linear-gradient(135deg, ${ACCENT} 0%, #E5C07B 50%, ${ACCENT} 100%)`,
              boxShadow: `0 14px 40px -10px ${ACCENT}70, inset 0 1px 0 rgba(255,255,255,0.4)`,
              display: "inline-flex", alignItems: "center", gap: 10,
              textDecoration: "none",
            }}
          >
            Start Planning
            <span style={{ fontSize: 17, lineHeight: 1 }}>→</span>
          </Link>
        </div>

        <div className="lp-fade-up" style={{ position: "absolute", bottom: 50, fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 10, letterSpacing: "0.3em", color: "rgba(244,241,234,0.4)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, animationDelay: "1.6s" }}>
          <span>SCROLL</span>
          <span className="lp-scroll-line" />
        </div>
      </div>
    </div>
  );
}

// ── ProductHero ──────────────────────────────────────────────────────────────
function ProductHero() {
  return (
    <div style={{ position: "relative", minHeight: "100vh", padding: "120px 6vw 100px", display: "flex", alignItems: "center", background: "transparent" }}>
      <div className="lp-product-grid" style={{ width: "100%", maxWidth: 1400, margin: "0 auto", display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 80, alignItems: "center" }}>
        {/* Left — copy */}
        <div>
          <div style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, letterSpacing: "0.25em", color: ACCENT, marginBottom: 26, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 28, height: 1, background: ACCENT, display: "block" }} />
            ACT II · THE SOFTWARE
          </div>

          <h2 style={{ fontFamily: "var(--font-instrument-serif, serif)", fontSize: "clamp(44px, 6.2vw, 88px)", lineHeight: 0.98, margin: 0, fontWeight: 400, color: "#F4F1EA", letterSpacing: "-0.025em" }}>
            Client-ready proposals.<br />
            <span style={{ fontStyle: "italic", color: ACCENT }}>In minutes.</span>
          </h2>

          <p style={{ marginTop: 36, fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 18, lineHeight: 1.6, color: "rgba(244,241,234,0.7)", maxWidth: 500 }}>
            Generate client-ready proposals in minutes.
          </p>
          <p style={{ marginTop: 16, fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 15, lineHeight: 1.7, color: "rgba(244,241,234,0.5)", maxWidth: 500 }}>
            AI-powered event proposals. GST-compliant budgets. Professional timelines. Stop spending hours on proposals. Let Kunjara OS do it in minutes.
          </p>

          <div style={{ marginTop: 44, display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
            <Link
              href="/signup"
              className="lp-cta-primary"
              aria-label="Start planning with Kunjara OS"
              style={{
                padding: "16px 30px",
                borderRadius: 999,
                fontFamily: "var(--font-space-grotesk, sans-serif)",
                fontSize: 15, fontWeight: 600,
                color: "#0A0A0C",
                background: `linear-gradient(135deg, ${ACCENT} 0%, #E5C07B 50%, ${ACCENT} 100%)`,
                boxShadow: `0 14px 40px -10px ${ACCENT}80, inset 0 1px 0 rgba(255,255,255,0.4)`,
                display: "inline-flex", alignItems: "center", gap: 10,
                textDecoration: "none",
              }}
            >
              Start Planning
              <span style={{ fontSize: 18, lineHeight: 1 }}>→</span>
            </Link>
          </div>
        </div>

        {/* Right — proposal mock */}
        <div style={{ position: "relative" }}>
          <div aria-hidden style={{ position: "absolute", inset: -40, background: `radial-gradient(ellipse at 70% 40%, ${ACCENT}20 0%, transparent 60%)`, filter: "blur(40px)", pointerEvents: "none" }} />
          <ProposalMock tilt={true} />
        </div>
      </div>
    </div>
  );
}

// ── PillarsStrip ─────────────────────────────────────────────────────────────
function PillarsStrip() {
  const pillars = [
    { n: "01", label: "Plan",        desc: "Proposal Architect™ · Budget · GST · Run-of-Show", icon: "◎" },
    { n: "02", label: "Execute",     desc: "Event Day Live · QR check-in · Mobile ops",         icon: "◈" },
    { n: "03", label: "Market",      desc: "Social AI · Microsites · Sponsorship",               icon: "◇" },
    { n: "04", label: "Communicate", desc: "Email · Surveys · Auto reports",                     icon: "◉" },
  ];

  return (
    <div style={{ background: "#0A0A0C", borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
        {pillars.map((p, i) => (
          <div key={p.label} style={{ padding: "52px 40px", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none", display: "flex", flexDirection: "column", gap: 16, transition: "background 300ms" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(212,168,95,0.03)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, color: "rgba(212,168,95,0.5)", letterSpacing: "0.1em" }}>{p.n}</span>
              <span style={{ fontSize: 16, color: "rgba(212,168,95,0.4)" }}>{p.icon}</span>
            </div>
            <div style={{ fontFamily: "var(--font-instrument-serif, serif)", fontSize: 36, fontStyle: "italic", color: "#F4F1EA", lineHeight: 1 }}>{p.label}</div>
            <div style={{ width: 32, height: 1, background: `rgba(212,168,95,0.35)` }} />
            <div style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, color: "rgba(244,241,234,0.45)", lineHeight: 1.7, letterSpacing: "0.04em" }}>{p.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── EventsSection ────────────────────────────────────────────────────────────
function EventCard({ title, kicker, img, accent }: { title: string; kicker: string; img: string; accent: string }) {
  const [hover, setHover] = useState(false);
  return (
    <a
      href="#"
      onClick={(e) => e.preventDefault()}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative", display: "block", aspectRatio: "3/4",
        borderRadius: 14, overflow: "hidden", textDecoration: "none", color: "inherit",
        background: "#0E0E10",
        boxShadow: hover
          ? "0 30px 60px -25px rgba(0,0,0,0.7), 0 0 0 1px rgba(212,168,95,0.3)"
          : "0 12px 30px -15px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
        transform: hover ? "translateY(-6px)" : "translateY(0)",
        transition: "transform 500ms cubic-bezier(0.2,0.8,0.2,1), box-shadow 500ms",
      }}
    >
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${img})`,
        backgroundSize: "cover", backgroundPosition: "center",
        transform: hover ? "scale(1.08)" : "scale(1.02)",
        transition: "transform 1200ms cubic-bezier(0.2,0.8,0.2,1)",
        filter: hover ? "saturate(1.05) brightness(0.95)" : "saturate(0.9) brightness(0.8)",
      }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.85) 100%)" }} />

      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 10, letterSpacing: "0.2em", color: accent, opacity: 0.9, marginBottom: 6 }}>{kicker}</div>
        <div style={{ fontFamily: "var(--font-instrument-serif, serif)", fontSize: 28, fontStyle: "italic", lineHeight: 1, color: "#F4F1EA" }}>{title}</div>
        <div style={{ marginTop: 8, height: 1, background: `linear-gradient(90deg, ${accent}aa, transparent)`, width: hover ? "60%" : "30%", transition: "width 600ms cubic-bezier(0.2,0.8,0.2,1)" }} />
      </div>

      <div style={{ position: "absolute", top: 14, right: 14, fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 10, letterSpacing: "0.1em", color: "rgba(244,241,234,0.55)" }}>↗</div>
    </a>
  );
}

function EventsSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const children = el.querySelectorAll<HTMLElement>(".lp-reveal");
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { (e.target as HTMLElement).classList.add("in"); obs.unobserve(e.target); } });
    }, { threshold: 0.12 });
    children.forEach((c) => obs.observe(c));
    return () => obs.disconnect();
  }, []);

  const events = [
    { title: "Wedding",      kicker: "01 / CEREMONY",    accent: ACCENT,   img: "https://images.unsplash.com/photo-1519741497674-611481863552?w=900&q=80" },
    { title: "Corporate",    kicker: "02 / ANNUAL GALA", accent: "#2F7A78", img: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&q=80" },
    { title: "Brand Launch", kicker: "03 / LAUNCH",      accent: "#C9785F", img: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=900&q=80" },
    { title: "Concert",      kicker: "04 / LIVE",        accent: "#B89BD9", img: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=900&q=80" },
    { title: "Social",       kicker: "05 / GATHERING",   accent: "#7B8C5F", img: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=900&q=80" },
  ];

  return (
    <section ref={sectionRef} style={{ position: "relative", padding: "140px 6vw", background: "#F5F1E8", color: "#1A1612" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div className="lp-reveal" style={{ marginBottom: 70 }}>
          <div style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, letterSpacing: "0.25em", color: "#8B6F3D", marginBottom: 22 }}>◆ EVERY EVENT TYPE · ONE PLATFORM</div>
          <h2 style={{ fontFamily: "var(--font-instrument-serif, serif)", fontSize: "clamp(44px, 6vw, 84px)", lineHeight: 1.0, margin: 0, fontWeight: 400, letterSpacing: "-0.025em", maxWidth: 900 }}>
            Proposals for <span style={{ fontStyle: "italic", color: "#8B6F3D" }}>every kind</span><br />of celebration.
          </h2>
          <p style={{ marginTop: 24, fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 16, lineHeight: 1.6, color: "rgba(26,22,18,0.62)", maxWidth: 580 }}>
            From the most intimate gatherings to the largest stage productions — the OS reads each brief and drafts accordingly.
          </p>
        </div>

        <div className="lp-events-grid lp-reveal" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 18 }}>
          {events.map((e) => <EventCard key={e.title} {...e} />)}
        </div>
      </div>
    </section>
  );
}

// ── PhilosophySection ────────────────────────────────────────────────────────
function PhilosophySection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const children = el.querySelectorAll<HTMLElement>(".lp-reveal");
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { (e.target as HTMLElement).classList.add("in"); obs.unobserve(e.target); } });
    }, { threshold: 0.15 });
    children.forEach((c) => obs.observe(c));
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={sectionRef} style={{ position: "relative", padding: "180px 6vw", background: "linear-gradient(180deg, #0A0A0C 0%, #15110A 100%)", color: "#F4F1EA", overflow: "hidden" }}>
      <div aria-hidden style={{ position: "absolute", left: "-2vw", top: "8%", fontFamily: "var(--font-instrument-serif, serif)", fontSize: "clamp(120px, 22vw, 360px)", fontStyle: "italic", color: "rgba(212,168,95,0.04)", lineHeight: 0.85, pointerEvents: "none", letterSpacing: "-0.04em" }}>
        Lex<br />Mercatoria
      </div>

      <div className="lp-philosophy-grid" style={{ maxWidth: 1100, margin: "0 auto", position: "relative", display: "grid", gridTemplateColumns: "auto 1fr", gap: "min(8vw, 100px)", alignItems: "start" }}>
        <div style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, letterSpacing: "0.25em", color: ACCENT, whiteSpace: "nowrap", paddingTop: 18 }}>
          ◆ FOUNDING<br />&nbsp;&nbsp;PRINCIPLE
        </div>

        <div className="lp-reveal">
          <div style={{ fontFamily: "var(--font-instrument-serif, serif)", fontSize: "clamp(20px, 2vw, 28px)", fontStyle: "italic", color: ACCENT, marginBottom: 32, letterSpacing: "0.02em" }}>
            Lex Mercatoria
          </div>

          <blockquote style={{ fontFamily: "var(--font-instrument-serif, serif)", fontSize: "clamp(28px, 3.5vw, 52px)", lineHeight: 1.15, fontWeight: 400, margin: 0, color: "#F4F1EA", letterSpacing: "-0.01em" }}>
            <span style={{ color: ACCENT, fontSize: "1.2em", lineHeight: 0, verticalAlign: "-0.2em", marginRight: 4 }}>"</span>
            We grow only when <em style={{ color: ACCENT }}>you</em> grow. The planner succeeds, the client gets a better event, the vendor gets more work — and the entire ecosystem lifts.
          </blockquote>

          <div style={{ marginTop: 60, display: "flex", gap: 40, alignItems: "center", fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 13, color: "rgba(244,241,234,0.55)" }}>
            <div style={{ width: 60, height: 1, background: `rgba(212,168,95,0.5)`, flexShrink: 0 }} />
            <div>
              <div style={{ color: "#F4F1EA", fontWeight: 500, marginBottom: 2 }}>Gautam Shah</div>
              <div>Founder · Indigo EP · Mumbai</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── FinalCTA ─────────────────────────────────────────────────────────────────
function FinalCTA() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const children = el.querySelectorAll<HTMLElement>(".lp-reveal");
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { (e.target as HTMLElement).classList.add("in"); obs.unobserve(e.target); } });
    }, { threshold: 0.2 });
    children.forEach((c) => obs.observe(c));
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={sectionRef} style={{ position: "relative", padding: "160px 6vw", background: "#0A0A0C", textAlign: "center", overflow: "hidden" }}>
      <div aria-hidden style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 60%, ${ACCENT}08 0%, transparent 65%)`, pointerEvents: "none" }} />

      <div className="lp-reveal" style={{ position: "relative", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, letterSpacing: "0.25em", color: ACCENT, marginBottom: 32 }}>◆ GET STARTED · FREE</div>
        <h2 style={{ fontFamily: "var(--font-instrument-serif, serif)", fontSize: "clamp(40px, 6vw, 80px)", lineHeight: 1.05, margin: 0, fontWeight: 400, color: "#F4F1EA", letterSpacing: "-0.025em" }}>
          Your next event<br />is <span style={{ fontStyle: "italic", color: ACCENT }}>already planned.</span>
        </h2>
        <p style={{ marginTop: 28, fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 17, lineHeight: 1.6, color: "rgba(244,241,234,0.6)", maxWidth: 520, margin: "28px auto 0" }}>
          From brief to client-ready proposal in minutes. GST-compliant. On your letterhead. Free to start.
        </p>

        <div style={{ marginTop: 48, display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/signup"
            className="lp-cta-primary"
            aria-label="Start planning your event with Kunjara OS"
            style={{
              padding: "18px 36px", borderRadius: 999,
              fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 16, fontWeight: 600,
              color: "#0A0A0C",
              background: `linear-gradient(135deg, ${ACCENT} 0%, #E5C07B 50%, ${ACCENT} 100%)`,
              boxShadow: `0 14px 40px -10px ${ACCENT}80, inset 0 1px 0 rgba(255,255,255,0.4)`,
              display: "inline-flex", alignItems: "center", gap: 10,
              textDecoration: "none",
            }}
          >
            Start Planning
            <span style={{ fontSize: 20, lineHeight: 1 }}>→</span>
          </Link>
        </div>

        <div style={{ marginTop: 40, display: "flex", gap: 32, justifyContent: "center", flexWrap: "wrap" }}>
          {["GST-ready from day one", "Made in Bharat 🇮🇳"].map((f) => (
            <div key={f} style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, color: "rgba(244,241,234,0.4)", letterSpacing: "0.05em" }}>✓ {f}</div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── India Flag SVG ───────────────────────────────────────────────────────────
function IndiaFlag({ width = 28 }: { width?: number }) {
  const h = Math.round(width * 0.667);
  const stripeH = Math.round(h / 3);
  const cx = Math.round(width / 2);
  const cy = Math.round(h / 2);
  const r = Math.round(stripeH * 0.45);
  const spokeCount = 24;
  return (
    <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} fill="none" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 2, flexShrink: 0 }}>
      <rect width={width} height={stripeH} fill="#FF9933" />
      <rect y={stripeH} width={width} height={stripeH} fill="#FFFFFF" />
      <rect y={stripeH * 2} width={width} height={stripeH} fill="#138808" />
      <circle cx={cx} cy={cy} r={r} stroke="#000080" strokeWidth="0.8" fill="none" />
      <circle cx={cx} cy={cy} r={1.2} fill="#000080" />
      {Array.from({ length: spokeCount }).map((_, i) => {
        const angle = (i / spokeCount) * Math.PI * 2 - Math.PI / 2;
        return (
          <line key={i}
            x1={cx} y1={cy}
            x2={cx + Math.cos(angle) * r} y2={cy + Math.sin(angle) * r}
            stroke="#000080" strokeWidth="0.6"
          />
        );
      })}
    </svg>
  );
}

// ── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ position: "relative", padding: "80px 6vw 36px", background: "#08080A", color: "#F4F1EA", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div className="lp-footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 60, marginBottom: 64, alignItems: "start" }}>
          <div>
            <KunjaraLogo size={24} color="#F4F1EA" />
            <p style={{ marginTop: 24, fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 14, lineHeight: 1.65, color: "rgba(244,241,234,0.55)", maxWidth: 340 }}>
              The AI-powered event operating system for India. Built by event planners, for event planners — with 20+ years of field intelligence.
            </p>
            <div style={{ marginTop: 20, display: "inline-flex", alignItems: "center", gap: 10, fontFamily: "var(--font-instrument-serif, serif)", fontStyle: "italic", fontSize: 15, color: ACCENT }}>
              <IndiaFlag width={26} />
              Made in Bharat · By Indigo EP
            </div>
            <a href="mailto:hello@kunjaraos.com" style={{ display: "block", marginTop: 18, fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, color: "rgba(244,241,234,0.4)", textDecoration: "none", letterSpacing: "0.04em" }}>hello@kunjaraos.com</a>
          </div>

          {[
            { title: "Platform", links: [["All Features", "/features"], ["AI Proposal Builder", "/features"], ["Pricing", "/pricing"]] },
            { title: "Company",  links: [["About Us", "/about"], ["Contact", "/contact"], ["Support", "/support"]] },
            { title: "Legal",    links: [["Privacy Policy", "/privacy"], ["Terms of Service", "/terms"], ["DPDP Compliance", "/dpdp-compliance"]] },
          ].map((col) => (
            <div key={col.title}>
              <div style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 10, letterSpacing: "0.2em", color: ACCENT, marginBottom: 20 }}>{col.title.toUpperCase()}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {col.links.map(([label, href]) => (
                  <Link key={label} href={href} style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 14, color: "rgba(244,241,234,0.65)", textDecoration: "none", transition: "color 200ms" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#F4F1EA")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(244,241,234,0.65)")}
                  >{label}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, color: "rgba(244,241,234,0.35)", letterSpacing: "0.06em", lineHeight: 1.7 }}>
            © 2026 Kunjara OS™ by Indigo Events & Promotions. All rights reserved.<br />
            Mumbai, Maharashtra, India · IT Act 2000 · DPDP Act 2023.
          </div>
          <div style={{ display: "flex", gap: 22 }}>
            {[["Privacy", "/privacy"], ["Terms", "/terms"], ["Support", "/support"]].map(([label, href]) => (
              <Link key={label} href={href} style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", fontSize: 12, color: "rgba(244,241,234,0.4)", textDecoration: "none" }}>{label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── ScrollStage ──────────────────────────────────────────────────────────────
function ScrollStage() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = wrapperRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      const p = Math.max(0, Math.min(1, scrolled / total));
      setProgress(p);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const cinemaOpacity = progress < 0.5 ? 1 : Math.max(0, 1 - (progress - 0.5) / 0.5);
  const cinemaScale = 1 + progress * 0.08;
  const cinemaBlur = progress > 0.5 ? (progress - 0.5) * 12 : 0;

  return (
    <div ref={wrapperRef} style={{ position: "relative", height: "150vh" }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden", background: "#0A0A0C" }}>
        <CinematicHero opacity={cinemaOpacity} scale={cinemaScale} blur={cinemaBlur} />
      </div>
      <div style={{ marginTop: "-50vh" }}>
        <ProductHero />
      </div>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────
export default function KunjaraLandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ background: "#0A0A0C", overflowX: "hidden" }}>
      <Nav scrolled={scrolled} />
      <ScrollStage />
      <PillarsStrip />
      <EventsSection />
      <PhilosophySection />
      <FinalCTA />
      <Footer />
    </div>
  );
}
