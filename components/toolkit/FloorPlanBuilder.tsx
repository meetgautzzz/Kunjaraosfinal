"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// ── Types (exported — do not rename) ─────────────────────────────────────────

export type ElementKind = "stage" | "chair" | "table" | "booth" | "entry";
type Tool = "select" | ElementKind;

export interface FpElement {
  id:       string;
  kind:     ElementKind;
  x:        number;   // meters, left edge
  y:        number;   // meters, top edge
  w:        number;   // meters, width
  h:        number;   // meters, height
  rotation: number;   // degrees
  label:    string;
}

// ── Constants (exported) ──────────────────────────────────────────────────────

export const CELL = 50;   // px per meter (1 m = 50 px)
export const GW   = 30;   // default canvas width  in meters
export const GH   = 22;   // default canvas height in meters
const MIN_SIZE    = 0.5;  // minimum element dimension in meters

export const KINDS: Record<ElementKind, {
  label: string; w: number; h: number; fill: string; stroke: string;
}> = {
  stage: { label: "Stage", w: 6,   h: 4,   fill: "rgba(124,58,237,0.15)", stroke: "#7C3AED" },
  table: { label: "Table", w: 1.5, h: 1.5, fill: "rgba(212,168,95,0.2)",  stroke: "#D4A85F" },
  chair: { label: "Chair", w: 0.5, h: 0.5, fill: "rgba(47,122,120,0.22)", stroke: "#2F7A78" },
  booth: { label: "Booth", w: 2,   h: 2,   fill: "rgba(201,120,95,0.2)",  stroke: "#C9785F" },
  entry: { label: "Entry", w: 2,   h: 0.5, fill: "rgba(34,197,94,0.2)",   stroke: "#22C55E" },
};

const TOOL_ICONS: Record<ElementKind, string> = {
  stage: "🎪", table: "⬜", chair: "💺", booth: "🏪", entry: "🚪",
};

// ── Drag state ────────────────────────────────────────────────────────────────

type DragState =
  | { type: "move";   id: string; ox: number; oy: number; gx0: number; gy0: number }
  | { type: "resize"; id: string; corner: "se"|"sw"|"ne"|"nw"; ox: number; oy: number; ow: number; oh: number; gx0: number; gy0: number }
  | { type: "rotate"; id: string; cx: number; cy: number; r0: number }
  | { type: "pan";    px0: number; py0: number; sx0: number; sy0: number };

// ── Helpers ───────────────────────────────────────────────────────────────────

function newId()   { return `fp_${Math.random().toString(36).slice(2, 8)}`; }
function snapG(v: number) { return Math.round(v * 2) / 2; }
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }
function toSqft(m: number) { return (m * 10.764).toFixed(1); }
function degToRad(d: number) { return (d * Math.PI) / 180; }

// ── Setup modal ───────────────────────────────────────────────────────────────

function SetupModal({ onConfirm }: { onConfirm: (w: number, h: number) => void }) {
  const [w, setW] = useState("30");
  const [h, setH] = useState("20");

  const wn = parseFloat(w) || 0;
  const hn = parseFloat(h) || 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (wn < 5 || hn < 5) return;
    onConfirm(wn, hn);
  }

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.72)", backdropFilter: "blur(10px)",
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          width: 400, borderRadius: 18,
          border: "1px solid var(--border-mid)",
          background: "var(--bg-raised)",
          padding: "32px 28px",
          display: "flex", flexDirection: "column", gap: 22,
          boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
        }}
      >
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 8 }}>
            Floor Plan Builder
          </p>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-1)", marginBottom: 4, lineHeight: 1.3 }}>
            Set Venue Dimensions
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.6 }}>
            Enter the size of your event space. Each grid square = 1 meter.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[
            { label: "Width (meters)", val: w, set: setW },
            { label: "Depth (meters)", val: h, set: setH },
          ].map(({ label, val, set }) => (
            <div key={label}>
              <label style={{
                display: "block", marginBottom: 7,
                fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "var(--text-3)",
              }}>
                {label}
              </label>
              <input
                type="number" value={val}
                onChange={(e) => set(e.target.value)}
                min={5} max={300} step={1}
                style={{
                  width: "100%", padding: "10px 14px",
                  borderRadius: 10, fontSize: 22, fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                  border: "1px solid var(--border)",
                  background: "var(--bg-surface)",
                  color: "var(--text-1)", outline: "none",
                  boxSizing: "border-box",
                }}
                autoFocus
              />
            </div>
          ))}
        </div>

        {wn >= 5 && hn >= 5 && (
          <div style={{
            padding: "12px 16px", borderRadius: 10,
            background: "rgba(212,168,95,0.06)",
            border: "1px solid rgba(212,168,95,0.18)",
          }}>
            <p style={{ fontSize: 12, color: "#D4A85F", fontFamily: "monospace" }}>
              {wn}m × {hn}m · {(wn * hn).toFixed(0)} m² · {(wn * 3.281 * hn * 3.281).toFixed(0)} sqft
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={wn < 5 || hn < 5}
          style={{
            padding: "13px", borderRadius: 11, fontSize: 14, fontWeight: 700,
            background: wn >= 5 && hn >= 5 ? "var(--accent)" : "var(--bg-surface)",
            border: "none",
            color: wn >= 5 && hn >= 5 ? "#fff" : "var(--text-3)",
            cursor: wn >= 5 && hn >= 5 ? "pointer" : "not-allowed",
            transition: "all 0.15s",
            letterSpacing: "0.01em",
          }}
        >
          Start Designing →
        </button>
      </form>
    </div>
  );
}

// ── Toolbar button ────────────────────────────────────────────────────────────

function ToolBtn({
  active, onClick, title, icon, label, color,
}: {
  active: boolean; onClick: () => void; title: string;
  icon: string; label: string; color?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 56, padding: "8px 4px 6px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
        borderRadius: 10, fontSize: 18, cursor: "pointer",
        border: active
          ? `1px solid ${color ?? "var(--accent)"}40`
          : "1px solid transparent",
        background: active
          ? `${color ?? "var(--accent)"}12`
          : "transparent",
        color: active ? (color ?? "var(--accent)") : "var(--text-3)",
        transition: "all 0.12s",
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      <span style={{ lineHeight: 1 }}>{icon}</span>
      <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.04em" }}>{label}</span>
    </button>
  );
}

// ── Canvas rulers ─────────────────────────────────────────────────────────────

function CanvasRulers({ gridW, gridH, unit }: { gridW: number; gridH: number; unit: "m" | "sqft" }) {
  const step = gridW <= 20 ? 2 : gridW <= 60 ? 5 : 10;
  const xTicks: number[] = [];
  const yTicks: number[] = [];
  for (let m = 0; m <= gridW; m += step) xTicks.push(m);
  for (let m = 0; m <= gridH; m += step) yTicks.push(m);

  function label(m: number) {
    return unit === "m" ? `${m}m` : `${(m * 3.281).toFixed(0)}ft`;
  }

  return (
    <g pointerEvents="none">
      {xTicks.map((m) => (
        <g key={`x${m}`} transform={`translate(${m * CELL}, 0)`}>
          <line y1={0} y2={-8} stroke="#3a3f4a" strokeWidth="0.8" />
          <text y={-11} fill="#3a4050" fontSize={8} textAnchor="middle" fontFamily="monospace">
            {label(m)}
          </text>
        </g>
      ))}
      {yTicks.map((m) => (
        <g key={`y${m}`} transform={`translate(0, ${m * CELL})`}>
          <line x1={0} x2={-8} stroke="#3a3f4a" strokeWidth="0.8" />
          <text x={-10} fill="#3a4050" fontSize={8} textAnchor="end" dominantBaseline="middle" fontFamily="monospace">
            {label(m)}
          </text>
        </g>
      ))}
    </g>
  );
}

// ── FloorPlanBuilder ──────────────────────────────────────────────────────────

interface BuilderProps {
  initialElements?: FpElement[];
  onElementsChange?: (elements: FpElement[]) => void;
}

export default function FloorPlanBuilder({ initialElements, onElementsChange }: BuilderProps = {}) {
  const hasInitial = !!(initialElements?.length);

  // ── State ──────────────────────────────────────────────────────────────────
  const [elements,   setElements]   = useState<FpElement[]>(initialElements ?? []);
  const [tool,       setTool]       = useState<Tool>("select");
  const [selId,      setSelId]      = useState<string | null>(null);
  const [unit,       setUnit]       = useState<"m" | "sqft">("m");
  const [gridW,      setGridW]      = useState(GW);
  const [gridH,      setGridH]      = useState(GH);
  const [showModal,  setShowModal]  = useState(!hasInitial);
  const [ready,      setReady]      = useState(hasInitial);
  const [zoomPct,    setZoomPct]    = useState(100);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const svgRef   = useRef<SVGSVGElement>(null);
  const vpRef    = useRef<SVGGElement>(null);
  const drag     = useRef<DragState | null>(null);
  const zoomR    = useRef(1);
  const panR     = useRef({ x: 20, y: 20 });
  const didPan   = useRef(false);   // suppress click after pan-drag

  // ── Notify parent ─────────────────────────────────────────────────────────
  const update = useCallback((next: FpElement[] | ((p: FpElement[]) => FpElement[])) => {
    setElements((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      onElementsChange?.(resolved);
      return resolved;
    });
  }, [onElementsChange]);

  useEffect(() => {
    if (initialElements) setElements(initialElements);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Viewport (zoom/pan without React re-renders) ──────────────────────────
  function applyViewport(z: number, p: { x: number; y: number }) {
    zoomR.current = z;
    panR.current = p;
    vpRef.current?.setAttribute("transform", `translate(${p.x},${p.y}) scale(${z})`);
    setZoomPct(Math.round(z * 100));
  }

  function fitToScreen() {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const cw = gridW * CELL;
    const ch = gridH * CELL;
    const z = clamp(Math.min(rect.width / cw, rect.height / ch) * 0.88, 0.15, 4);
    applyViewport(z, {
      x: (rect.width  - cw * z) / 2,
      y: (rect.height - ch * z) / 2,
    });
  }

  // Wheel zoom (passive: false required)
  useEffect(() => {
    if (!ready) return;
    const svg = svgRef.current;
    if (!svg) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const rect  = svg.getBoundingClientRect();
      const mx    = e.clientX - rect.left;
      const my    = e.clientY - rect.top;
      const delta = e.deltaY < 0 ? 1.09 : 0.917;
      const newZ  = clamp(zoomR.current * delta, 0.15, 5);
      const gx    = (mx - panR.current.x) / zoomR.current;
      const gy    = (my - panR.current.y) / zoomR.current;
      applyViewport(newZ, { x: mx - gx * newZ, y: my - gy * newZ });
    };
    svg.addEventListener("wheel", handler, { passive: false });
    return () => svg.removeEventListener("wheel", handler);
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fit once when canvas becomes visible
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(fitToScreen, 60);
    return () => clearTimeout(t);
  }, [ready, gridW, gridH]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Coordinate helper: screen → group-space pixels ────────────────────────
  function groupPt(e: React.MouseEvent | MouseEvent) {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left  - panR.current.x) / zoomR.current,
      y: (e.clientY - rect.top - panR.current.y) / zoomR.current,
    };
  }

  const sel = elements.find((e) => e.id === selId) ?? null;

  // ── Canvas interactions ───────────────────────────────────────────────────
  function onCanvasMouseDown(e: React.MouseEvent) {
    // Middle mouse or left-click in select mode → pan
    if (e.button === 1 || (e.button === 0 && tool === "select")) {
      e.preventDefault();
      drag.current = { type: "pan", px0: panR.current.x, py0: panR.current.y, sx0: e.clientX, sy0: e.clientY };
    }
  }

  function onCanvasClick(e: React.MouseEvent) {
    if (didPan.current) { didPan.current = false; return; }
    if (tool === "select") { setSelId(null); return; }
    const gp  = groupPt(e);
    const cfg = KINDS[tool as ElementKind];
    const el: FpElement = {
      id: newId(), kind: tool as ElementKind,
      x: clamp(snapG(gp.x / CELL - cfg.w / 2), 0, gridW - cfg.w),
      y: clamp(snapG(gp.y / CELL - cfg.h / 2), 0, gridH - cfg.h),
      w: cfg.w, h: cfg.h, rotation: 0, label: cfg.label,
    };
    update((prev) => [...prev, el]);
    setSelId(el.id);
    setTool("select");
  }

  const onElementDown = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (tool !== "select") return;
    setSelId(id);
    const el = elements.find((el) => el.id === id)!;
    const gp = groupPt(e);
    drag.current = { type: "move", id, ox: el.x, oy: el.y, gx0: gp.x, gy0: gp.y };
  }, [elements, tool]); // eslint-disable-line react-hooks/exhaustive-deps

  const onResizeDown = useCallback((e: React.MouseEvent, id: string, corner: "se"|"sw"|"ne"|"nw") => {
    e.stopPropagation();
    const el = elements.find((el) => el.id === id)!;
    const gp = groupPt(e);
    drag.current = { type: "resize", id, corner, ox: el.x, oy: el.y, ow: el.w, oh: el.h, gx0: gp.x, gy0: gp.y };
  }, [elements]); // eslint-disable-line react-hooks/exhaustive-deps

  const onRotateDown = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const el = elements.find((el) => el.id === id)!;
    const cx = (el.x + el.w / 2) * CELL;
    const cy = (el.y + el.h / 2) * CELL;
    const gp = groupPt(e);
    drag.current = { type: "rotate", id, cx, cy, r0: Math.atan2(gp.y - cy, gp.x - cx) - degToRad(el.rotation) };
  }, [elements]); // eslint-disable-line react-hooks/exhaustive-deps

  function onMouseMove(e: React.MouseEvent) {
    const d = drag.current;
    if (!d) return;

    if (d.type === "pan") {
      applyViewport(zoomR.current, {
        x: d.px0 + (e.clientX - d.sx0),
        y: d.py0 + (e.clientY - d.sy0),
      });
      return;
    }

    const gp = groupPt(e);
    const dx = (gp.x - (d as { gx0: number }).gx0) / CELL;
    const dy = (gp.y - (d as { gy0: number }).gy0) / CELL;

    if (d.type === "move") {
      update((prev) => prev.map((el) => el.id !== d.id ? el : {
        ...el,
        x: clamp(snapG(d.ox + dx), 0, gridW - el.w),
        y: clamp(snapG(d.oy + dy), 0, gridH - el.h),
      }));
    } else if (d.type === "resize") {
      update((prev) => prev.map((el) => {
        if (el.id !== d.id) return el;
        let { x, y, w, h } = { x: d.ox, y: d.oy, w: d.ow, h: d.oh };
        if (d.corner === "se") {
          w = snapG(clamp(d.ow + dx, MIN_SIZE, gridW - d.ox));
          h = snapG(clamp(d.oh + dy, MIN_SIZE, gridH - d.oy));
        } else if (d.corner === "sw") {
          const nw = snapG(clamp(d.ow - dx, MIN_SIZE, d.ox + d.ow));
          x = d.ox + d.ow - nw; w = nw;
          h = snapG(clamp(d.oh + dy, MIN_SIZE, gridH - d.oy));
        } else if (d.corner === "ne") {
          w = snapG(clamp(d.ow + dx, MIN_SIZE, gridW - d.ox));
          const nh = snapG(clamp(d.oh - dy, MIN_SIZE, d.oy + d.oh));
          y = d.oy + d.oh - nh; h = nh;
        } else {
          const nw = snapG(clamp(d.ow - dx, MIN_SIZE, d.ox + d.ow));
          const nh = snapG(clamp(d.oh - dy, MIN_SIZE, d.oy + d.oh));
          x = d.ox + d.ow - nw; y = d.oy + d.oh - nh; w = nw; h = nh;
        }
        return { ...el, x, y, w, h };
      }));
    } else if (d.type === "rotate") {
      const angle = Math.atan2(gp.y - d.cy, gp.x - d.cx);
      const rot   = Math.round((angle - d.r0) * 180 / Math.PI / 5) * 5;
      update((prev) => prev.map((el) => el.id !== d.id ? el : { ...el, rotation: rot }));
    }
  }

  function onMouseUp(e: React.MouseEvent) {
    if (drag.current?.type === "pan") {
      const d = drag.current as Extract<DragState, { type: "pan" }>;
      const moved = Math.abs(e.clientX - d.sx0) + Math.abs(e.clientY - d.sy0);
      if (moved > 6) didPan.current = true;
    }
    drag.current = null;
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if ((e.key === "Delete" || e.key === "Backspace") && selId) {
      update((prev) => prev.filter((el) => el.id !== selId));
      setSelId(null);
    }
    if (e.key === "Escape") { setTool("select"); setSelId(null); }
    if (e.key === "f" || e.key === "F") fitToScreen();
  }

  function handleModalConfirm(w: number, h: number) {
    setGridW(w); setGridH(h);
    setShowModal(false); setReady(true);
  }

  // ── Zoom controls ─────────────────────────────────────────────────────────
  function zoomStep(factor: number) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const newZ = clamp(zoomR.current * factor, 0.15, 5);
    const gx = (cx - panR.current.x) / zoomR.current;
    const gy = (cy - panR.current.y) / zoomR.current;
    applyViewport(newZ, { x: cx - gx * newZ, y: cy - gy * newZ });
  }

  const canvasW = gridW * CELL;
  const canvasH = gridH * CELL;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      style={{ display: "flex", height: "100%", position: "relative", userSelect: "none", outline: "none" }}
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      {showModal && <SetupModal onConfirm={handleModalConfirm} />}

      {/* ── Left toolbar ──────────────────────────────────────────────────── */}
      <div style={{
        width: 72, flexShrink: 0,
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "10px 6px 10px",
        gap: 4,
        borderRight: "1px solid var(--border)",
        background: "var(--bg-card)",
        overflowY: "auto",
      }}>
        <ToolBtn active={tool === "select"} onClick={() => setTool("select")} title="Select / Move (Esc)" icon="↖" label="Select" />

        <div style={{ width: "70%", height: 1, background: "var(--border)", margin: "4px 0" }} />

        {(Object.keys(KINDS) as ElementKind[]).map((kind) => (
          <ToolBtn
            key={kind}
            active={tool === kind}
            onClick={() => setTool(kind)}
            title={`Add ${KINDS[kind].label}`}
            icon={TOOL_ICONS[kind]}
            label={KINDS[kind].label}
            color={KINDS[kind].stroke}
          />
        ))}

        <div style={{ width: "70%", height: 1, background: "var(--border)", margin: "4px 0" }} />

        {/* Unit */}
        <button
          onClick={() => setUnit((u) => u === "m" ? "sqft" : "m")}
          title="Toggle units"
          style={{
            width: 56, padding: "7px 4px", borderRadius: 9, fontSize: 10, fontWeight: 700,
            border: "1px solid var(--border)", background: "var(--bg-surface)",
            color: "var(--text-3)", cursor: "pointer", textAlign: "center",
          }}
        >
          {unit === "m" ? "m²" : "ft²"}
        </button>

        {/* Fit */}
        <button
          onClick={fitToScreen}
          title="Fit to screen (F)"
          style={{
            width: 56, padding: "7px 4px", borderRadius: 9, fontSize: 14,
            border: "1px solid var(--border)", background: "var(--bg-surface)",
            color: "var(--text-3)", cursor: "pointer", textAlign: "center",
          }}
        >
          ⊡
        </button>

        {/* Resize venue */}
        <button
          onClick={() => setShowModal(true)}
          title="Change venue size"
          style={{
            width: 56, padding: "7px 4px", borderRadius: 9, fontSize: 9, fontWeight: 600,
            lineHeight: 1.4,
            border: "1px solid var(--border)", background: "var(--bg-surface)",
            color: "var(--text-3)", cursor: "pointer", textAlign: "center",
          }}
        >
          ⬜<br/>Resize
        </button>

        <div style={{ flex: 1 }} />

        {/* Clear */}
        {elements.length > 0 && (
          <button
            onClick={() => { update([]); setSelId(null); }}
            title="Clear all"
            style={{
              width: 56, padding: "6px 4px", borderRadius: 9, fontSize: 9, fontWeight: 700,
              border: "1px solid rgba(239,68,68,0.25)",
              background: "transparent",
              color: "rgba(239,68,68,0.55)", cursor: "pointer", textAlign: "center",
            }}
          >
            Clear All
          </button>
        )}
      </div>

      {/* ── Canvas column ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>

        {/* Mini top bar */}
        <div style={{
          height: 34, flexShrink: 0,
          display: "flex", alignItems: "center", gap: 10, padding: "0 14px",
          borderBottom: "1px solid var(--border)", background: "var(--bg-card)",
          fontSize: 11, color: "var(--text-3)",
        }}>
          <span style={{ fontFamily: "monospace", color: "var(--text-2)" }}>
            {gridW}m × {gridH}m
          </span>
          <span>·</span>
          {/* Zoom controls */}
          <button
            onClick={() => zoomStep(0.833)}
            style={{ padding: "2px 7px", borderRadius: 5, border: "1px solid var(--border)", background: "transparent", color: "var(--text-3)", cursor: "pointer", fontSize: 12 }}
          >−</button>
          <span style={{ fontFamily: "monospace", minWidth: 36, textAlign: "center" }}>{zoomPct}%</span>
          <button
            onClick={() => zoomStep(1.2)}
            style={{ padding: "2px 7px", borderRadius: 5, border: "1px solid var(--border)", background: "transparent", color: "var(--text-3)", cursor: "pointer", fontSize: 12 }}
          >+</button>
          <button
            onClick={fitToScreen}
            style={{ padding: "2px 8px", borderRadius: 5, border: "1px solid var(--border)", background: "transparent", color: "var(--text-3)", cursor: "pointer", fontSize: 10, fontWeight: 600 }}
          >Fit</button>
          <span>·</span>
          <span>{elements.length} element{elements.length !== 1 ? "s" : ""}</span>
          <span style={{ marginLeft: "auto", opacity: 0.45 }}>
            Scroll = zoom · Drag = pan · Del = delete · F = fit
          </span>
        </div>

        {/* SVG canvas */}
        <div style={{ flex: 1, overflow: "hidden", background: "#080910", position: "relative" }}>
          <svg
            ref={svgRef}
            width="100%" height="100%"
            style={{
              display: "block",
              cursor: drag.current?.type === "pan" ? "grabbing" : tool === "select" ? "grab" : "crosshair",
            }}
            onMouseDown={onCanvasMouseDown}
            onClick={onCanvasClick}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            {/* Viewport group — all content lives here, transform = pan + zoom */}
            <g ref={vpRef} transform={`translate(${panR.current.x},${panR.current.y}) scale(${zoomR.current})`}>
              {/* Grid pattern defs inside the group so they scale with zoom */}
              <defs>
                <pattern id="fp-cell" width={CELL} height={CELL} patternUnits="userSpaceOnUse">
                  <path d={`M ${CELL} 0 L 0 0 0 ${CELL}`} fill="none" stroke="#17191f" strokeWidth="0.5" />
                </pattern>
                <pattern id="fp-major" width={CELL * 5} height={CELL * 5} patternUnits="userSpaceOnUse">
                  <rect width={CELL * 5} height={CELL * 5} fill="url(#fp-cell)" />
                  <path d={`M ${CELL * 5} 0 L 0 0 0 ${CELL * 5}`} fill="none" stroke="#1f2230" strokeWidth="1" />
                </pattern>
              </defs>

              {/* Canvas area */}
              <rect x={0} y={0} width={canvasW} height={canvasH} fill="#0d0e11" />
              <rect x={0} y={0} width={canvasW} height={canvasH} fill="url(#fp-major)" />
              {/* Canvas border */}
              <rect x={0} y={0} width={canvasW} height={canvasH} fill="none" stroke="#252835" strokeWidth={2} rx={2} />

              {/* Rulers */}
              <CanvasRulers gridW={gridW} gridH={gridH} unit={unit} />

              {/* Elements */}
              {elements.map((el) => (
                <ElementShape
                  key={el.id}
                  el={el}
                  selected={el.id === selId}
                  unit={unit}
                  onDown={(e) => onElementDown(e, el.id)}
                  onResizeDown={(e, c) => onResizeDown(e, el.id, c)}
                  onRotateDown={(e) => onRotateDown(e, el.id)}
                />
              ))}

              {/* Empty hint */}
              {elements.length === 0 && ready && (
                <text
                  x={canvasW / 2} y={canvasH / 2}
                  fill="#25293a" fontSize={13}
                  textAnchor="middle" fontFamily="sans-serif" pointerEvents="none"
                >
                  Pick an element on the left, then click to place it
                </text>
              )}
            </g>
          </svg>
        </div>
      </div>

      {/* ── Properties panel (always visible) ────────────────────────────────── */}
      <PropsPanel
        el={sel}
        gridW={gridW}
        gridH={gridH}
        unit={unit}
        onChange={(patch) => update((prev) => prev.map((e) => e.id === sel!.id ? { ...e, ...patch } : e))}
        onDelete={() => { update((prev) => prev.filter((e) => e.id !== sel!.id)); setSelId(null); }}
        onDuplicate={() => {
          if (!sel) return;
          const copy = { ...sel, id: newId(), x: sel.x + 0.5, y: sel.y + 0.5 };
          update((prev) => [...prev, copy]);
          setSelId(copy.id);
        }}
      />
    </div>
  );
}

// ── FloorPlanViewer (read-only, exported) ─────────────────────────────────────

interface ViewerProps {
  elements: FpElement[];
  height?:  number;
}

export function FloorPlanViewer({ elements, height = 360 }: ViewerProps) {
  if (elements.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-[var(--border)] bg-[#0d0e11]"
        style={{ height }}
      >
        <p className="text-[var(--text-3)] text-sm">No floor plan attached.</p>
      </div>
    );
  }

  // Compute viewBox from actual element extents + padding
  const maxX = Math.max(GW, ...elements.map((el) => el.x + el.w)) + 2;
  const maxY = Math.max(GH, ...elements.map((el) => el.y + el.h)) + 2;
  const vw   = maxX * CELL;
  const vh   = maxY * CELL;

  return (
    <div className="rounded-xl overflow-hidden border border-[var(--border)]" style={{ height, background: "#0d0e11" }}>
      <svg viewBox={`0 0 ${vw} ${vh}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
        <defs>
          <pattern id="fpv-cell" width={CELL} height={CELL} patternUnits="userSpaceOnUse">
            <path d={`M ${CELL} 0 L 0 0 0 ${CELL}`} fill="none" stroke="#17191f" strokeWidth="0.5" />
          </pattern>
          <pattern id="fpv-major" width={CELL * 5} height={CELL * 5} patternUnits="userSpaceOnUse">
            <rect width={CELL * 5} height={CELL * 5} fill="url(#fpv-cell)" />
            <path d={`M ${CELL * 5} 0 L 0 0 0 ${CELL * 5}`} fill="none" stroke="#1f2230" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="#0d0e11" />
        <rect width="100%" height="100%" fill="url(#fpv-major)" />
        {elements.map((el) => (
          <ElementShape
            key={el.id} el={el} selected={false} unit="m"
            onDown={() => {}} onResizeDown={() => {}} onRotateDown={() => {}}
          />
        ))}
      </svg>
    </div>
  );
}

// ── ElementShape ──────────────────────────────────────────────────────────────

const HANDLE_R   = 5;
const ROTATE_OFF = 20;

function ElementShape({
  el, selected, unit, onDown, onResizeDown, onRotateDown,
}: {
  el: FpElement; selected: boolean; unit: "m" | "sqft";
  onDown:       (e: React.MouseEvent) => void;
  onResizeDown: (e: React.MouseEvent, c: "se"|"sw"|"ne"|"nw") => void;
  onRotateDown: (e: React.MouseEvent) => void;
}) {
  const cfg    = KINDS[el.kind];
  const px     = el.x * CELL;
  const py     = el.y * CELL;
  const pw     = el.w * CELL;
  const ph     = el.h * CELL;
  const cx     = px + pw / 2;
  const cy     = py + ph / 2;
  const wLabel = unit === "m" ? `${el.w}m` : `${toSqft(el.w)}ft`;
  const hLabel = unit === "m" ? `${el.h}m` : `${toSqft(el.h)}ft`;

  return (
    <g transform={`rotate(${el.rotation}, ${cx}, ${cy})`}>
      <rect
        x={px} y={py} width={pw} height={ph}
        rx={el.kind === "table" ? Math.min(pw, ph) / 2 : 4}
        fill={cfg.fill}
        stroke={selected ? cfg.stroke : `${cfg.stroke}88`}
        strokeWidth={selected ? 1.5 : 1}
        style={{ cursor: "move" }}
        onMouseDown={onDown}
      />
      <text
        x={cx} y={cy - (ph > 32 ? 7 : 0)} dy="0.4em"
        fill={cfg.stroke} fontSize={Math.max(7, Math.min(12, pw / 4))}
        textAnchor="middle" fontFamily="sans-serif" fontWeight="600"
        pointerEvents="none"
      >
        {el.label}
      </text>
      {pw > 55 && ph > 28 && (
        <text x={cx} y={cy + 11} fill={`${cfg.stroke}70`} fontSize={8}
          textAnchor="middle" fontFamily="monospace" pointerEvents="none">
          {wLabel} × {hLabel}
        </text>
      )}

      {selected && (
        <>
          {/* Rotate handle */}
          <line x1={cx} y1={py} x2={cx} y2={py - ROTATE_OFF} stroke={cfg.stroke} strokeWidth={1} strokeDasharray="3 2" />
          <circle cx={cx} cy={py - ROTATE_OFF} r={HANDLE_R} fill={cfg.stroke} stroke="white" strokeWidth={1}
            style={{ cursor: "grab" }} onMouseDown={onRotateDown} />
          {/* Resize handles */}
          {([ ["nw", px, py], ["ne", px + pw, py], ["sw", px, py + ph], ["se", px + pw, py + ph] ] as [string, number, number][]).map(([c, hx, hy]) => (
            <rect
              key={c}
              x={hx - HANDLE_R} y={hy - HANDLE_R}
              width={HANDLE_R * 2} height={HANDLE_R * 2}
              rx={2} fill="white" stroke={cfg.stroke} strokeWidth={1.5}
              style={{ cursor: c === "se" || c === "nw" ? "nwse-resize" : "nesw-resize" }}
              onMouseDown={(e) => onResizeDown(e, c as "se"|"sw"|"ne"|"nw")}
            />
          ))}
        </>
      )}
    </g>
  );
}

// ── Properties panel ──────────────────────────────────────────────────────────

function PropsPanel({
  el, gridW, gridH, unit, onChange, onDelete, onDuplicate,
}: {
  el: FpElement | null;
  gridW: number; gridH: number; unit: "m" | "sqft";
  onChange:   (p: Partial<FpElement>) => void;
  onDelete:   () => void;
  onDuplicate: () => void;
}) {
  function numField(label: string, value: number, field: keyof FpElement, min: number, max: number, step = 0.5) {
    const display = unit === "sqft" && (field === "w" || field === "h") ? parseFloat(toSqft(value)) : value;
    return (
      <div key={label}>
        <label style={{ display: "block", fontSize: 10, color: "var(--text-3)", marginBottom: 4 }}>{label}</label>
        <input
          type="number" value={display}
          step={unit === "sqft" && (field === "w" || field === "h") ? 1 : step}
          min={min} max={max}
          onChange={(e) => {
            let v = parseFloat(e.target.value);
            if (isNaN(v)) return;
            if (unit === "sqft" && (field === "w" || field === "h")) v = v / 10.764;
            onChange({ [field]: snapG(clamp(v, min, max)) });
          }}
          style={{
            width: "100%", padding: "6px 8px", borderRadius: 7, fontSize: 12,
            border: "1px solid var(--border)", background: "var(--bg-surface)",
            color: "var(--text-1)", outline: "none", boxSizing: "border-box",
          }}
        />
      </div>
    );
  }

  const cfg = el ? KINDS[el.kind] : null;

  return (
    <div style={{
      width: 200, flexShrink: 0, display: "flex", flexDirection: "column",
      borderLeft: "1px solid var(--border)", background: "var(--bg-card)",
    }}>
      {/* Header */}
      <div style={{
        padding: "12px 14px 10px",
        borderBottom: "1px solid var(--border)",
        borderTop: cfg ? `3px solid ${cfg.stroke}` : "3px solid var(--border)",
        flexShrink: 0,
      }}>
        {el && cfg ? (
          <>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: cfg.stroke }}>
              {el.kind.toUpperCase()}
            </p>
            <p style={{ fontSize: 10, color: "var(--text-3)", marginTop: 2 }}>Selected element</p>
          </>
        ) : (
          <>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-3)" }}>
              PROPERTIES
            </p>
            <p style={{ fontSize: 10, color: "var(--text-3)", marginTop: 2, opacity: 0.6 }}>No element selected</p>
          </>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 14 }}>
        {!el ? (
          <div style={{ paddingTop: 12 }}>
            <p style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.7, marginBottom: 16 }}>
              Click an element on the canvas to select and edit its properties.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                ["← /→", "Pan canvas"],
                ["Scroll", "Zoom in/out"],
                ["F", "Fit to screen"],
                ["Del", "Delete selected"],
                ["Esc", "Deselect"],
              ].map(([key, desc]) => (
                <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                    background: "var(--bg-surface)", border: "1px solid var(--border)",
                    color: "var(--text-3)", fontFamily: "monospace",
                  }}>{key}</span>
                  <span style={{ fontSize: 10, color: "var(--text-3)", opacity: 0.7 }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Label */}
            <div>
              <label style={{ display: "block", fontSize: 10, color: "var(--text-3)", marginBottom: 4 }}>Label</label>
              <input
                value={el.label}
                onChange={(e) => onChange({ label: e.target.value })}
                style={{
                  width: "100%", padding: "6px 8px", borderRadius: 7, fontSize: 12,
                  border: "1px solid var(--border)", background: "var(--bg-surface)",
                  color: "var(--text-1)", outline: "none", boxSizing: "border-box",
                }}
              />
            </div>

            {/* Position */}
            <div>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-3)", marginBottom: 8 }}>
                Position
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {numField("X (m)", el.x, "x", 0, gridW - el.w)}
                {numField("Y (m)", el.y, "y", 0, gridH - el.h)}
              </div>
            </div>

            {/* Size */}
            <div>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-3)", marginBottom: 8 }}>
                Size ({unit === "m" ? "m" : "ft"})
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {numField("W", el.w, "w", MIN_SIZE, gridW)}
                {numField("H", el.h, "h", MIN_SIZE, gridH)}
              </div>
            </div>

            {/* Rotation */}
            <div>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-3)", marginBottom: 8 }}>
                Rotation
              </p>
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                <input
                  type="number" value={el.rotation} step={15}
                  onChange={(e) => onChange({ rotation: parseInt(e.target.value) || 0 })}
                  style={{
                    flex: 1, padding: "6px 8px", borderRadius: 7, fontSize: 12,
                    border: "1px solid var(--border)", background: "var(--bg-surface)",
                    color: "var(--text-1)", outline: "none",
                  }}
                />
                <span style={{ fontSize: 11, color: "var(--text-3)" }}>°</span>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {[0, 45, 90, 180, 270].map((r) => (
                  <button key={r} onClick={() => onChange({ rotation: r })}
                    style={{
                      flex: 1, padding: "4px 0", borderRadius: 5, fontSize: 9,
                      border: el.rotation === r ? `1px solid ${cfg!.stroke}55` : "1px solid var(--border)",
                      background: el.rotation === r ? `${cfg!.stroke}15` : "transparent",
                      color: el.rotation === r ? cfg!.stroke : "var(--text-3)",
                      cursor: "pointer",
                    }}
                  >{r}°</button>
                ))}
              </div>
            </div>

            {/* Area */}
            <div style={{
              padding: "8px 12px", borderRadius: 8,
              background: "var(--bg-surface)", border: "1px solid var(--border)",
            }}>
              <p style={{ fontSize: 9, color: "var(--text-3)" }}>Area</p>
              <p style={{ fontSize: 13, fontFamily: "monospace", color: "var(--text-1)", marginTop: 2 }}>
                {unit === "m"
                  ? `${(el.w * el.h).toFixed(2)} m²`
                  : `${toSqft(el.w * el.h)} sqft`}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      {el && (
        <div style={{ flexShrink: 0, padding: "10px 14px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 7 }}>
          <button onClick={onDuplicate}
            style={{
              padding: "7px", borderRadius: 8, fontSize: 11, fontWeight: 600,
              border: "1px solid var(--border)", background: "transparent",
              color: "var(--text-2)", cursor: "pointer",
            }}
          >
            Duplicate
          </button>
          <button onClick={onDelete}
            style={{
              padding: "7px", borderRadius: 8, fontSize: 11, fontWeight: 600,
              border: "1px solid rgba(239,68,68,0.25)", background: "transparent",
              color: "rgba(239,68,68,0.7)", cursor: "pointer",
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
