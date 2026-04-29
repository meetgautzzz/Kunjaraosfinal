"use client";

import { useEffect, useState } from "react";

const STEPS = [
  "Analyzing Requirements",
  "Structuring Proposal",
  "Writing Content",
  "Calculating Pricing",
  "Finalizing",
];

const CARDS = [
  { label: "Executive Summary", dx: -148, dy: -55, dur: 3.6, delay: 0.0 },
  { label: "Scope of Work",     dx:  138, dy: -75, dur: 4.0, delay: 0.5 },
  { label: "Pricing",           dx: -120, dy:  55, dur: 3.8, delay: 1.0 },
  { label: "Timeline",          dx:  118, dy:  48, dur: 4.2, delay: 1.5 },
];

/* Tiny building-window positions */
const WIN = [
  [292,80],[295,95],[292,110],[295,125],
  [318,65],[328,65],[318,80],[328,80],[318,95],
  [353,55],[363,55],[353,70],[363,70],
  [383,75],[393,75],[383,90],[393,90],[383,105],
  [421,60],[433,60],[421,75],[433,75],
];

/* Particle paths from laptop */
const PARTICLES = [
  { px: "-28px", py: "-52px", delay: "0.0s" },
  { px:  "38px", py: "-58px", delay: "0.7s" },
  { px: "-48px", py: "-32px", delay: "1.4s" },
  { px:  "22px", py: "-44px", delay: "2.1s" },
  { px: "-18px", py: "-68px", delay: "2.8s" },
];

export default function AtlasThinkingAnimation() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % STEPS.length), 2400);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <style>{`
        @keyframes atlasFloat {
          0%,100% { transform: translate(var(--dx), calc(var(--dy) + 0px)); }
          50%      { transform: translate(var(--dx), calc(var(--dy) - 9px)); }
        }
        @keyframes atlasCardIn {
          from { opacity:0; transform:translate(var(--dx), calc(var(--dy) + 14px)) scale(0.9); }
          to   { opacity:1; transform:translate(var(--dx), calc(var(--dy) + 0px))  scale(1);   }
        }
        @keyframes atlasPulse {
          0%,100% { opacity:.35; }
          50%      { opacity:.85; }
        }
        @keyframes atlasScreenPulse {
          0%,100% { opacity:.55; }
          50%      { opacity:1;   }
        }
        @keyframes atlasCursor {
          0%,100% { opacity:1; }
          50%      { opacity:0; }
        }
        @keyframes atlasNeuron {
          0%   { stroke-dashoffset:220; opacity:0; }
          18%  { opacity:.55; }
          82%  { opacity:.55; }
          100% { stroke-dashoffset:0;   opacity:0; }
        }
        @keyframes atlasParticle {
          0%   { transform:translate(0,0) scale(1);   opacity:0; }
          15%  { opacity:.85; }
          100% { transform:translate(var(--px),var(--py)) scale(0); opacity:0; }
        }
        @keyframes atlasBadgePulse {
          0%,100% { box-shadow:0 0 0 0 rgba(136,102,255,0); }
          50%      { box-shadow:0 0 0 5px rgba(136,102,255,0.12); }
        }
      `}</style>

      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:28, padding:"24px 12px" }}>

        {/* ── Scene ─────────────────────────────────────────────────────────── */}
        <div style={{ position:"relative", width:480, maxWidth:"100%", height:330 }}>

          <svg width="480" height="330" viewBox="0 0 480 330" fill="none"
            style={{ position:"absolute", inset:0, width:"100%", height:"100%" }}>
            <defs>
              <radialGradient id="atScreenGlow" cx="50%" cy="60%">
                <stop offset="0%"   stopColor="#7755EE" stopOpacity="0.65"/>
                <stop offset="100%" stopColor="#7755EE" stopOpacity="0"/>
              </radialGradient>
              <radialGradient id="atLampGlow" cx="50%" cy="10%">
                <stop offset="0%"   stopColor="#FFB84D" stopOpacity="0.22"/>
                <stop offset="100%" stopColor="#FFB84D" stopOpacity="0"/>
              </radialGradient>
              <filter id="atBlur" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6"/>
              </filter>
            </defs>

            {/* Room */}
            <rect width="480" height="330" fill="#07070F"/>

            {/* Window frame */}
            <rect x="278" y="18" width="186" height="165" rx="3"
              fill="#0C0C1A" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>

            {/* City ambient glow */}
            <ellipse cx="370" cy="100" rx="90" ry="70" fill="#3355BB" opacity="0.06" filter="url(#atBlur)"/>

            {/* Buildings */}
            {[
              [287,72,20,108],[314,56,28,124],[349,46,22,134],[379,66,30,114],[417,50,25,130],
            ].map(([x,y,w,h],i) => (
              <rect key={i} x={x} y={y} width={w} height={h}
                fill="#09091A" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
            ))}

            {/* City lights */}
            {[
              [308,102,7,"#4488FF",0.2],[329,132,4,"#FF8844",0.15],
              [362,79,11,"#8866FF",0.14],[391,121,6,"#44FFAA",0.12],
              [416,88,8,"#FF4488",0.13],[441,138,6,"#4488FF",0.18],
              [309,61,4,"#FFCC44",0.16],[450,61,5,"#44BBFF",0.13],
            ].map(([x,y,r,c,o],i) => (
              <circle key={i} cx={x as number} cy={y as number} r={r as number}
                fill={c as string} opacity={o as number}/>
            ))}

            {/* Building windows */}
            {WIN.map(([x,y],i) => (
              <rect key={i} x={x} y={y} width="4" height="3" rx="0.5"
                fill="rgba(255,218,96,0.22)"/>
            ))}

            {/* Wall / floor */}
            <rect x="0"   y="0"   width="278" height="330" fill="#09090F"/>
            <rect x="0"   y="198" width="480" height="132" fill="#07070E"/>

            {/* Desk */}
            <rect x="58" y="208" width="336" height="11" rx="3"
              fill="#19172A" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5"/>
            <rect x="78"  y="219" width="7" height="82" rx="2" fill="#141422"/>
            <rect x="367" y="219" width="7" height="82" rx="2" fill="#141422"/>

            {/* Lamp */}
            <line x1="76" y1="208" x2="76" y2="162" stroke="#26243A" strokeWidth="2"/>
            <path d="M58 162 L94 162 L87 138 L65 138 Z"
              fill="#222036" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"/>
            <ellipse cx="76" cy="178" rx="38" ry="28" fill="url(#atLampGlow)"/>

            {/* Mug */}
            <rect x="306" y="191" width="18" height="17" rx="2"
              fill="#19172A" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5"/>
            <path d="M324 198 Q333 198 333 205 Q333 212 324 212"
              stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" fill="none"/>
            <path d="M311 190 Q313 185 311 180" stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="none" strokeLinecap="round"/>
            <path d="M317 190 Q319 184 317 179" stroke="rgba(255,255,255,0.08)" strokeWidth="1" fill="none" strokeLinecap="round"/>

            {/* Plant */}
            <rect x="332" y="184" width="9" height="24" rx="2" fill="#19172A"/>
            <ellipse cx="336" cy="182" rx="13" ry="9" fill="#192818"/>
            <path d="M336 182 Q325 170 320 163" stroke="#1E3020" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <path d="M336 182 Q347 170 352 163" stroke="#1E3020" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <ellipse cx="321" cy="162" rx="9" ry="6" fill="#182618"/>
            <ellipse cx="350" cy="162" rx="9" ry="6" fill="#182618"/>

            {/* Notebook */}
            <rect x="262" y="197" width="36" height="11" rx="1.5"
              fill="#19172A" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>
            <line x1="267" y1="201" x2="292" y2="201" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>
            <line x1="267" y1="204" x2="290" y2="204" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>
            <line x1="267" y1="207" x2="291" y2="207" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>

            {/* Chair seat + back */}
            <rect x="142" y="254" width="78" height="13" rx="4" fill="#19172A" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"/>
            <rect x="152" y="223" width="58" height="33" rx="4" fill="#19172A" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"/>
            <line x1="156" y1="267" x2="149" y2="300" stroke="#121220" strokeWidth="3" strokeLinecap="round"/>
            <line x1="206" y1="267" x2="213" y2="300" stroke="#121220" strokeWidth="3" strokeLinecap="round"/>
            <rect x="138" y="246" width="12" height="20" rx="3" fill="#151522"/>
            <rect x="212" y="246" width="12" height="20" rx="3" fill="#151522"/>

            {/* Person — body */}
            <rect x="160" y="194" width="42" height="32" rx="8" fill="#1E1B30"/>
            {/* Neck */}
            <rect x="176" y="184" width="10" height="13" rx="3" fill="#28263C"/>
            {/* Head */}
            <ellipse cx="181" cy="174" rx="18" ry="19" fill="#28263C"/>
            {/* Hair */}
            <path d="M163 167 Q167 148 181 148 Q195 148 199 167" fill="#19172A"/>
            {/* Eyes (subtle) */}
            <ellipse cx="175" cy="174" rx="2.5" ry="1.8" fill="#1C1A2E" opacity="0.7"/>
            <ellipse cx="187" cy="174" rx="2.5" ry="1.8" fill="#1C1A2E" opacity="0.7"/>
            {/* Left arm — thinking, hand near chin */}
            <path d="M162 210 Q152 214 147 220 Q142 226 148 230 Q152 232 156 228"
              stroke="#28263C" strokeWidth="5" fill="none" strokeLinecap="round"/>
            <ellipse cx="147" cy="226" rx="8" ry="6" fill="#28263C"/>
            {/* Right arm toward laptop */}
            <path d="M200 214 Q216 218 222 210"
              stroke="#1E1B30" strokeWidth="6" fill="none" strokeLinecap="round"/>

            {/* ── Laptop ── */}
            {/* Base */}
            <rect x="188" y="204" width="78" height="6" rx="2"
              fill="#13111F" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>
            {/* Screen body */}
            <path d="M193 204 L195 152 L265 152 L268 204 Z"
              fill="#0F0E1E" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5"/>
            {/* Screen display area */}
            <rect x="199" y="158" width="58" height="41" rx="2" fill="#090916"/>
            {/* Code lines */}
            {[
              [202,162,28,"rgba(130,100,255,0.55)"],
              [202,167,44,"rgba(100,150,255,0.45)"],
              [202,172,22,"rgba(130,100,255,0.4)" ],
              [202,177,40,"rgba(100,150,255,0.35)"],
              [202,182,33,"rgba(130,100,255,0.45)"],
              [202,187,48,"rgba(100,150,255,0.3)" ],
            ].map(([x,y,w,c],i) => (
              <rect key={i} x={x as number} y={y as number} width={w as number} height="2" rx="1" fill={c as string}/>
            ))}
            {/* Blinking cursor */}
            <rect x="202" y="193" width="2" height="5" rx="0.5"
              fill="rgba(160,120,255,0.95)"
              style={{ animation:"atlasCursor 1s ease-in-out infinite" }}/>

            {/* Screen glow */}
            <ellipse cx="228" cy="168" rx="48" ry="32" fill="url(#atScreenGlow)"
              style={{ animation:"atlasScreenPulse 3s ease-in-out infinite" }}/>

            {/* Neural arcs from screen */}
            <path d="M225 152 Q198 128 168 108"
              stroke="#8866FF" strokeWidth="0.9" strokeDasharray="5 4" fill="none"
              style={{ animation:"atlasNeuron 4.2s ease-in-out infinite 0.0s" }}/>
            <path d="M240 152 Q262 118 292 98"
              stroke="#6699FF" strokeWidth="0.9" strokeDasharray="5 4" fill="none"
              style={{ animation:"atlasNeuron 4.2s ease-in-out infinite 0.9s" }}/>
            <path d="M214 152 Q188 112 158 103"
              stroke="#AA77FF" strokeWidth="0.9" strokeDasharray="4 5" fill="none"
              style={{ animation:"atlasNeuron 4.2s ease-in-out infinite 1.8s" }}/>

            {/* Neural endpoint dots */}
            <circle cx="168" cy="108" r="2.5" fill="#8866FF"
              style={{ animation:"atlasPulse 2.2s ease-in-out infinite 0.0s" }}/>
            <circle cx="292" cy="98"  r="2.5" fill="#6699FF"
              style={{ animation:"atlasPulse 2.2s ease-in-out infinite 0.7s" }}/>
            <circle cx="158" cy="103" r="2"   fill="#AA77FF"
              style={{ animation:"atlasPulse 2.2s ease-in-out infinite 1.4s" }}/>

            {/* Energy particles */}
            {PARTICLES.map((p, i) => (
              <circle key={i} cx="228" cy="152" r="2.2" fill="#9977FF"
                style={{ "--px":p.px, "--py":p.py,
                  animation:`atlasParticle 3.2s ease-out ${p.delay} infinite`,
                } as React.CSSProperties}/>
            ))}
          </svg>

          {/* Floating holographic cards */}
          {CARDS.map((card) => (
            <div key={card.label}
              style={{
                position:"absolute",
                top:"50%", left:"50%",
                "--dx": `calc(-50% + ${card.dx}px)`,
                "--dy": `calc(-50% + ${card.dy}px)`,
                animation:`atlasCardIn 0.7s cubic-bezier(0.2,0.8,0.2,1) ${card.delay}s both,
                  atlasFloat ${card.dur}s ease-in-out ${card.delay}s infinite`,
                background:"rgba(16,14,34,0.8)",
                backdropFilter:"blur(14px)",
                WebkitBackdropFilter:"blur(14px)",
                border:"1px solid rgba(136,102,255,0.28)",
                borderRadius:9,
                padding:"5px 11px",
                fontSize:10,
                fontFamily:"'JetBrains Mono', ui-monospace, monospace",
                color:"rgba(176,156,255,0.92)",
                letterSpacing:"0.05em",
                whiteSpace:"nowrap",
                boxShadow:"0 0 22px rgba(110,80,255,0.18), 0 2px 10px rgba(0,0,0,0.5)",
                display:"flex",
                alignItems:"center",
                gap:6,
                pointerEvents:"none",
              } as React.CSSProperties}
            >
              <span style={{
                width:5, height:5, borderRadius:999,
                background:"#9977FF",
                boxShadow:"0 0 7px #9977FF",
                flexShrink:0,
              }}/>
              {card.label}
            </div>
          ))}

          {/* Atlas badge */}
          <div style={{
            position:"absolute", bottom:10, left:"50%", transform:"translateX(-50%)",
            display:"flex", alignItems:"center", gap:7,
            background:"rgba(10,8,24,0.88)",
            backdropFilter:"blur(10px)",
            WebkitBackdropFilter:"blur(10px)",
            border:"1px solid rgba(110,80,255,0.22)",
            borderRadius:999,
            padding:"4px 12px",
            fontSize:10,
            color:"rgba(150,130,210,0.85)",
            fontFamily:"'JetBrains Mono', ui-monospace, monospace",
            letterSpacing:"0.08em",
            animation:"atlasBadgePulse 2.8s ease-in-out infinite",
          }}>
            <span style={{
              width:6, height:6, borderRadius:999,
              background:"#8866FF",
              boxShadow:"0 0 10px #8866FF",
              animation:"atlasPulse 1.6s ease-in-out infinite",
            }}/>
            ATLAS IS THINKING
          </div>
        </div>

        {/* ── Progress steps ────────────────────────────────────────────────── */}
        <div style={{ width:"100%", maxWidth:380, display:"flex", flexDirection:"column", gap:6 }}>
          <p style={{
            textAlign:"center", fontSize:13, fontWeight:500,
            color:"var(--text-primary, #f4f1ea)", marginBottom:4, lineHeight:1.4,
          }}>
            Atlas is crafting your proposal...
          </p>

          {STEPS.map((label, i) => {
            const done   = i < step;
            const active = i === step;
            return (
              <div key={label} style={{
                display:"flex", alignItems:"center", gap:10,
                opacity: done ? 0.4 : 1,
                transition:"opacity 500ms",
              }}>
                {/* Step indicator */}
                <div style={{
                  width:18, height:18, borderRadius:999, flexShrink:0,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  background: done   ? "rgba(110,80,255,0.22)"
                             : active ? "rgba(110,80,255,0.12)"
                             : "rgba(255,255,255,0.04)",
                  border:`1px solid ${
                    done   ? "rgba(140,100,255,0.55)"
                  : active ? "rgba(140,100,255,0.4)"
                  : "rgba(255,255,255,0.08)"}`,
                  transition:"all 400ms",
                }}>
                  {done ? (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1 4L3 6L7 2" stroke="rgba(160,120,255,0.9)"
                        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : active ? (
                    <div style={{
                      width:5, height:5, borderRadius:999, background:"#9977FF",
                      animation:"atlasPulse 1s ease-in-out infinite",
                    }}/>
                  ) : (
                    <div style={{
                      width:4, height:4, borderRadius:999,
                      background:"rgba(255,255,255,0.1)",
                    }}/>
                  )}
                </div>

                <span style={{
                  fontSize:12,
                  fontWeight: active ? 500 : 400,
                  color: done   ? "var(--text-tertiary, rgba(244,241,234,0.38))"
                       : active ? "var(--text-primary, #f4f1ea)"
                       : "var(--text-secondary, rgba(244,241,234,0.58))",
                  transition:"color 400ms",
                  flex:1,
                }}>
                  {label}
                </span>

                {active && (
                  <svg style={{ flexShrink:0, animation:"spin 1s linear infinite" }}
                    width="11" height="11" viewBox="0 0 24 24" fill="none"
                    stroke="rgba(130,90,255,0.7)" strokeWidth={2.5}>
                    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity={0.15}/>
                    <path d="M21 12a9 9 0 00-9-9"/>
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
