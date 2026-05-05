"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// ── Types (exported for consumers) ────────────────────────────────────────────

export type ElementKind = "stage" | "chair" | "table" | "booth" | "entry";
type Tool = "select" | ElementKind;

export interface FpElement {
  id: string;
  kind: ElementKind;
  x: number;        // grid units (meters), left edge
  y: number;        // grid units, top edge
  w: number;        // width in grid units
  h: number;        // height in grid units
  rotation: number; // degrees, about element center
  label: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const CELL = 44;   // px per meter
export const GW   = 30;   // canvas width in meters
export const GH   = 22;   // canvas height in meters
const MIN_SIZE    = 0.5;  // min element dimension in meters

export const KINDS: Record<ElementKind, { label: string; w: number; h: number; fill: string; stroke: string }> = {
  stage: { label: "Stage",  w: 6,   h: 4,   fill: "rgba(124,58,237,0.15)",  stroke: "#7C3AED" },
  table: { label: "Table",  w: 1.5, h: 1.5, fill: "rgba(212,168,95,0.2)",   stroke: "#D4A85F" },
  chair: { label: "Chair",  w: 0.5, h: 0.5, fill: "rgba(47,122,120,0.22)",  stroke: "#2F7A78" },
  booth: { label: "Booth",  w: 2,   h: 2,   fill: "rgba(201,120,95,0.2)",   stroke: "#C9785F" },
  entry: { label: "Entry",  w: 2,   h: 0.5, fill: "rgba(34,197,94,0.2)",    stroke: "#22C55E" },
};

const TOOL_LABELS: Record<ElementKind, string> = {
  stage: "Stage", table: "Table", chair: "Chair", booth: "Booth", entry: "Entry/Door",
};

// ── Drag state ────────────────────────────────────────────────────────────────

type DragState =
  | { type: "move";   id: string; ox: number; oy: number; mx0: number; my0: number }
  | { type: "resize"; id: string; corner: "se" | "sw" | "ne" | "nw"; ox: number; oy: number; ow: number; oh: number; mx0: number; my0: number }
  | { type: "rotate"; id: string; cx: number; cy: number; r0: number };

// ── Helpers ───────────────────────────────────────────────────────────────────

function newId() { return `fp_${Math.random().toString(36).slice(2, 8)}`; }
function snapG(v: number): number { return Math.round(v * 2) / 2; }
function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }
function toSqft(m: number) { return (m * 10.764).toFixed(1); }
function degToRad(d: number) { return (d * Math.PI) / 180; }

// ── FloorPlanBuilder (editable) ───────────────────────────────────────────────

interface BuilderProps {
  /** Seed the canvas with these elements on first mount. */
  initialElements?: FpElement[];
  /** Called on every element change so the parent can persist. */
  onElementsChange?: (elements: FpElement[]) => void;
}

export default function FloorPlanBuilder({ initialElements, onElementsChange }: BuilderProps = {}) {
  const [elements, setElements] = useState<FpElement[]>(initialElements ?? []);
  const [tool,     setTool]     = useState<Tool>("select");
  const [selId,    setSelId]    = useState<string | null>(null);
  const [unit,     setUnit]     = useState<"m" | "sqft">("m");

  const svgRef = useRef<SVGSVGElement>(null);
  const drag   = useRef<DragState | null>(null);

  // Notify parent on every change
  const update = useCallback((next: FpElement[] | ((prev: FpElement[]) => FpElement[])) => {
    setElements((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      onElementsChange?.(resolved);
      return resolved;
    });
  }, [onElementsChange]);

  // Seed from initialElements when prop changes (e.g. loading a saved proposal)
  useEffect(() => {
    if (initialElements) setElements(initialElements);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sel = elements.find((e) => e.id === selId) ?? null;

  function svgPt(e: React.MouseEvent): { x: number; y: number } {
    const rect = svgRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onCanvasClick(e: React.MouseEvent) {
    if (drag.current) return;
    if (tool === "select") { setSelId(null); return; }
    const { x, y } = svgPt(e);
    const cfg = KINDS[tool as ElementKind];
    const gx  = snapG(x / CELL - cfg.w / 2);
    const gy  = snapG(y / CELL - cfg.h / 2);
    const el: FpElement = {
      id: newId(), kind: tool as ElementKind,
      x: clamp(gx, 0, GW - cfg.w),
      y: clamp(gy, 0, GH - cfg.h),
      w: cfg.w, h: cfg.h, rotation: 0, label: cfg.label,
    };
    update((prev) => [...prev, el]);
    setSelId(el.id);
    setTool("select");
  }

  const onElementDown = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelId(id);
    const el = elements.find((el) => el.id === id)!;
    const pt = svgPt(e);
    drag.current = { type: "move", id, ox: el.x, oy: el.y, mx0: pt.x, my0: pt.y };
  }, [elements]); // eslint-disable-line react-hooks/exhaustive-deps

  const onResizeDown = useCallback((e: React.MouseEvent, id: string, corner: "se" | "sw" | "ne" | "nw") => {
    e.stopPropagation();
    const el = elements.find((el) => el.id === id)!;
    const pt = svgPt(e);
    drag.current = { type: "resize", id, corner, ox: el.x, oy: el.y, ow: el.w, oh: el.h, mx0: pt.x, my0: pt.y };
  }, [elements]); // eslint-disable-line react-hooks/exhaustive-deps

  const onRotateDown = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const el = elements.find((el) => el.id === id)!;
    const cx = (el.x + el.w / 2) * CELL;
    const cy = (el.y + el.h / 2) * CELL;
    const pt = svgPt(e);
    const r0 = Math.atan2(pt.y - cy, pt.x - cx);
    drag.current = { type: "rotate", id, cx, cy, r0: r0 - degToRad(el.rotation) };
  }, [elements]); // eslint-disable-line react-hooks/exhaustive-deps

  function onMouseMove(e: React.MouseEvent) {
    const d = drag.current;
    if (!d) return;
    const pt = svgPt(e);
    const dx = (pt.x - (d as { mx0: number }).mx0) / CELL;
    const dy = (pt.y - (d as { my0: number }).my0) / CELL;

    if (d.type === "move") {
      update((prev) => prev.map((el) => el.id !== d.id ? el : {
        ...el,
        x: clamp(snapG(d.ox + dx), 0, GW - el.w),
        y: clamp(snapG(d.oy + dy), 0, GH - el.h),
      }));
    } else if (d.type === "resize") {
      update((prev) => prev.map((el) => {
        if (el.id !== d.id) return el;
        let { x, y, w, h } = { x: d.ox, y: d.oy, w: d.ow, h: d.oh };
        if (d.corner === "se") {
          w = snapG(clamp(d.ow + dx, MIN_SIZE, GW - d.ox));
          h = snapG(clamp(d.oh + dy, MIN_SIZE, GH - d.oy));
        } else if (d.corner === "sw") {
          const nw = snapG(clamp(d.ow - dx, MIN_SIZE, d.ox + d.ow));
          x = d.ox + d.ow - nw; w = nw;
          h = snapG(clamp(d.oh + dy, MIN_SIZE, GH - d.oy));
        } else if (d.corner === "ne") {
          w = snapG(clamp(d.ow + dx, MIN_SIZE, GW - d.ox));
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
      const angle = Math.atan2(pt.y - d.cy, pt.x - d.cx);
      const rot   = Math.round((angle - d.r0) * 180 / Math.PI / 5) * 5;
      update((prev) => prev.map((el) => el.id !== d.id ? el : { ...el, rotation: rot }));
    }
  }

  function onMouseUp() { drag.current = null; }

  function onKeyDown(e: React.KeyboardEvent) {
    if ((e.key === "Delete" || e.key === "Backspace") && selId) {
      update((prev) => prev.filter((el) => el.id !== selId));
      setSelId(null);
    }
    if (e.key === "Escape") { setTool("select"); setSelId(null); }
  }

  return (
    <div
      className="flex flex-col h-full outline-none"
      tabIndex={0}
      onKeyDown={onKeyDown}
      style={{ userSelect: "none" }}
    >
      {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-card)] flex-wrap shrink-0">
        <button
          onClick={() => setTool("select")}
          title="Select / Move (Esc)"
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            tool === "select"
              ? "bg-[var(--bg-hover)] border-[var(--border-mid)] text-[var(--text-1)]"
              : "border-[var(--border)] text-[var(--text-2)] hover:border-[var(--border-mid)]"
          }`}
        >
          ↖ Select
        </button>

        <div className="w-px h-5 bg-[var(--border)]" />

        {(Object.keys(KINDS) as ElementKind[]).map((kind) => {
          const cfg = KINDS[kind];
          return (
            <button
              key={kind}
              onClick={() => setTool(kind)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                tool === kind
                  ? "border-current text-[var(--text-1)] bg-[var(--bg-hover)]"
                  : "border-[var(--border)] text-[var(--text-2)] hover:border-[var(--border-mid)]"
              }`}
              style={tool === kind ? { borderColor: cfg.stroke, color: cfg.stroke } : undefined}
            >
              + {TOOL_LABELS[kind]}
            </button>
          );
        })}

        <div className="w-px h-5 bg-[var(--border)]" />

        <button
          onClick={() => setUnit((u) => u === "m" ? "sqft" : "m")}
          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border)] text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors"
        >
          {unit === "m" ? "m²" : "sqft"} →
        </button>

        {elements.length > 0 && (
          <button
            onClick={() => { update([]); setSelId(null); }}
            className="ml-auto px-3 py-1.5 rounded-lg text-xs border border-[var(--border)] text-[var(--text-3)] hover:text-red-400 hover:border-red-500/30 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* ── Canvas + Properties ───────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 overflow-auto bg-[#0d0e11]">
          <svg
            ref={svgRef}
            width={CELL * GW}
            height={CELL * GH}
            style={{ cursor: tool === "select" ? "default" : "crosshair", display: "block" }}
            onClick={onCanvasClick}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            <GridDefs />
            <rect width="100%" height="100%" fill="#0d0e11" />
            <rect width="100%" height="100%" fill="url(#fp-major)" />

            <g transform={`translate(12, ${CELL * GH - 18})`}>
              {[0, 5, 10, 15, 20, 25].map((m) => (
                <g key={m} transform={`translate(${m * CELL}, 0)`}>
                  <line x1={0} y1={0} x2={0} y2={6} stroke="#3a3f4a" strokeWidth="1" />
                  <text x={0} y={-2} fill="#4a4f5a" fontSize="9" textAnchor="middle" fontFamily="monospace">
                    {unit === "m" ? `${m}m` : `${(m * 3.28).toFixed(0)}ft`}
                  </text>
                </g>
              ))}
              <line x1={0} y1={0} x2={25 * CELL} y2={0} stroke="#3a3f4a" strokeWidth="1" />
            </g>

            {elements.map((el) => (
              <ElementShape
                key={el.id}
                el={el}
                selected={el.id === selId}
                unit={unit}
                onDown={(e) => { if (tool === "select") onElementDown(e, el.id); }}
                onResizeDown={(e, c) => onResizeDown(e, el.id, c)}
                onRotateDown={(e) => onRotateDown(e, el.id)}
              />
            ))}

            {elements.length === 0 && (
              <text x={CELL * GW / 2} y={CELL * GH / 2} fill="#2e3340" fontSize="14" textAnchor="middle" fontFamily="sans-serif">
                Select an element above and click to place it
              </text>
            )}
          </svg>
        </div>

        {sel && (
          <PropsPanel
            el={sel}
            unit={unit}
            onChange={(patch) => update((prev) => prev.map((e) => e.id === sel.id ? { ...e, ...patch } : e))}
            onDelete={() => { update((prev) => prev.filter((e) => e.id !== sel.id)); setSelId(null); }}
            onDuplicate={() => {
              const copy: FpElement = { ...sel, id: newId(), x: sel.x + 0.5, y: sel.y + 0.5 };
              update((prev) => [...prev, copy]);
              setSelId(copy.id);
            }}
          />
        )}
      </div>
    </div>
  );
}

// ── FloorPlanViewer (read-only) ───────────────────────────────────────────────

interface ViewerProps {
  elements: FpElement[];
  /** Override display height (default 360px) */
  height?: number;
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

  const vw = CELL * GW;
  const vh = CELL * GH;

  return (
    <div
      className="rounded-xl overflow-hidden border border-[var(--border)]"
      style={{ height, background: "#0d0e11" }}
    >
      <svg
        viewBox={`0 0 ${vw} ${vh}`}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        style={{ display: "block" }}
      >
        <GridDefs />
        <rect width="100%" height="100%" fill="#0d0e11" />
        <rect width="100%" height="100%" fill="url(#fp-major)" />

        {elements.map((el) => (
          <ElementShape
            key={el.id}
            el={el}
            selected={false}
            unit="m"
            onDown={() => {}}
            onResizeDown={() => {}}
            onRotateDown={() => {}}
          />
        ))}
      </svg>
    </div>
  );
}

// ── Shared SVG pieces ─────────────────────────────────────────────────────────

function GridDefs() {
  return (
    <defs>
      <pattern id="fp-cell" width={CELL} height={CELL} patternUnits="userSpaceOnUse">
        <path d={`M ${CELL} 0 L 0 0 0 ${CELL}`} fill="none" stroke="#1e2028" strokeWidth="1" />
      </pattern>
      <pattern id="fp-major" width={CELL * 5} height={CELL * 5} patternUnits="userSpaceOnUse">
        <rect width={CELL * 5} height={CELL * 5} fill="url(#fp-cell)" />
        <path d={`M ${CELL * 5} 0 L 0 0 0 ${CELL * 5}`} fill="none" stroke="#252830" strokeWidth="1.5" />
      </pattern>
    </defs>
  );
}

const HANDLE_R  = 5;
const ROTATE_OFF = 20;

function ElementShape({
  el, selected, unit, onDown, onResizeDown, onRotateDown,
}: {
  el: FpElement;
  selected: boolean;
  unit: "m" | "sqft";
  onDown: (e: React.MouseEvent) => void;
  onResizeDown: (e: React.MouseEvent, corner: "se" | "sw" | "ne" | "nw") => void;
  onRotateDown: (e: React.MouseEvent) => void;
}) {
  const cfg = KINDS[el.kind];
  const px  = el.x * CELL;
  const py  = el.y * CELL;
  const pw  = el.w * CELL;
  const ph  = el.h * CELL;
  const cx  = px + pw / 2;
  const cy  = py + ph / 2;
  const wLabel = unit === "m" ? `${el.w}m` : `${toSqft(el.w)}ft`;
  const hLabel = unit === "m" ? `${el.h}m` : `${toSqft(el.h)}ft`;

  return (
    <g transform={`rotate(${el.rotation}, ${cx}, ${cy})`}>
      <rect
        x={px} y={py} width={pw} height={ph}
        rx={el.kind === "table" ? pw / 2 : 4}
        fill={cfg.fill}
        stroke={selected ? cfg.stroke : `${cfg.stroke}99`}
        strokeWidth={selected ? 1.5 : 1}
        style={{ cursor: onDown !== undefined ? "move" : "default" }}
        onMouseDown={onDown}
      />
      <text
        x={cx} y={cy - (ph > 30 ? 6 : 0)} dy="0.4em"
        fill={cfg.stroke}
        fontSize={Math.max(8, Math.min(12, pw / 5))}
        textAnchor="middle"
        fontFamily="sans-serif"
        fontWeight="600"
        pointerEvents="none"
      >
        {el.label}
      </text>
      {pw > 60 && ph > 30 && (
        <text x={cx} y={cy + 10} fill={`${cfg.stroke}88`} fontSize={8} textAnchor="middle" fontFamily="monospace" pointerEvents="none">
          {wLabel} × {hLabel}
        </text>
      )}

      {selected && (
        <>
          <line x1={cx} y1={py} x2={cx} y2={py - ROTATE_OFF} stroke={cfg.stroke} strokeWidth={1} strokeDasharray="3 2" />
          <circle cx={cx} cy={py - ROTATE_OFF} r={HANDLE_R} fill={cfg.stroke} stroke="white" strokeWidth={1} style={{ cursor: "grab" }} onMouseDown={onRotateDown} />
          {([
            ["nw", px,      py     ],
            ["ne", px + pw, py     ],
            ["sw", px,      py + ph],
            ["se", px + pw, py + ph],
          ] as [string, number, number][]).map(([c, hx, hy]) => (
            <rect
              key={c}
              x={hx - HANDLE_R} y={hy - HANDLE_R}
              width={HANDLE_R * 2} height={HANDLE_R * 2}
              rx={2}
              fill="white"
              stroke={cfg.stroke}
              strokeWidth={1.5}
              style={{ cursor: c === "se" || c === "nw" ? "nwse-resize" : "nesw-resize" }}
              onMouseDown={(e) => onResizeDown(e, c as "se" | "sw" | "ne" | "nw")}
            />
          ))}
        </>
      )}
    </g>
  );
}

// ── Properties panel ──────────────────────────────────────────────────────────

function PropsPanel({ el, unit, onChange, onDelete, onDuplicate }: {
  el: FpElement;
  unit: "m" | "sqft";
  onChange: (patch: Partial<FpElement>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const cfg = KINDS[el.kind];

  function numField(label: string, value: number, field: keyof FpElement, min: number, max: number, step = 0.5) {
    const display = unit === "sqft" && (field === "w" || field === "h") ? parseFloat(toSqft(value)) : value;
    return (
      <div>
        <label className="text-[var(--text-3)] text-[10px] block mb-1">{label}</label>
        <input
          type="number"
          value={display}
          step={unit === "sqft" && (field === "w" || field === "h") ? 1 : step}
          min={min} max={max}
          onChange={(e) => {
            let v = parseFloat(e.target.value);
            if (isNaN(v)) return;
            if (unit === "sqft" && (field === "w" || field === "h")) v = v / 10.764;
            onChange({ [field]: snapG(clamp(v, min, max)) });
          }}
          className="w-full px-2 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-1)] focus:outline-none focus:border-amber-500/60"
        />
      </div>
    );
  }

  return (
    <div className="w-52 shrink-0 border-l border-[var(--border)] bg-[var(--bg-card)] flex flex-col">
      <div className="px-4 py-3 border-b border-[var(--border)]" style={{ borderTop: `3px solid ${cfg.stroke}` }}>
        <p className="text-sm font-semibold" style={{ color: cfg.stroke }}>{el.kind.toUpperCase()}</p>
        <p className="text-[var(--text-3)] text-[10px] mt-0.5">Selected element</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="text-[var(--text-3)] text-[10px] block mb-1">Label</label>
          <input
            value={el.label}
            onChange={(e) => onChange({ label: e.target.value })}
            className="w-full px-2 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-1)] focus:outline-none focus:border-amber-500/60"
          />
        </div>

        <div>
          <p className="text-[var(--text-3)] text-[10px] uppercase tracking-wide mb-2">Position</p>
          <div className="grid grid-cols-2 gap-2">
            {numField("X (m)", el.x, "x", 0, GW - el.w)}
            {numField("Y (m)", el.y, "y", 0, GH - el.h)}
          </div>
        </div>

        <div>
          <p className="text-[var(--text-3)] text-[10px] uppercase tracking-wide mb-2">Size ({unit === "m" ? "m" : "sqft"})</p>
          <div className="grid grid-cols-2 gap-2">
            {numField("Width",  el.w, "w", MIN_SIZE, GW)}
            {numField("Height", el.h, "h", MIN_SIZE, GH)}
          </div>
        </div>

        <div>
          <p className="text-[var(--text-3)] text-[10px] uppercase tracking-wide mb-2">Rotation</p>
          <div className="flex items-center gap-2">
            <input
              type="number" value={el.rotation} step={15}
              onChange={(e) => onChange({ rotation: parseInt(e.target.value) || 0 })}
              className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-1)] focus:outline-none focus:border-amber-500/60"
            />
            <span className="text-[var(--text-3)] text-xs">°</span>
          </div>
          <div className="flex gap-1 mt-1.5">
            {[-90, -45, 0, 45, 90].map((r) => (
              <button key={r} onClick={() => onChange({ rotation: r })}
                className={`flex-1 py-1 text-[10px] rounded border transition-colors ${
                  el.rotation === r ? "border-amber-500/40 text-amber-400 bg-amber-500/10" : "border-[var(--border)] text-[var(--text-3)] hover:text-[var(--text-1)]"
                }`}
              >
                {r}°
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2">
          <p className="text-[var(--text-3)] text-[10px]">Area</p>
          <p className="text-[var(--text-1)] text-sm font-mono mt-0.5">
            {unit === "m" ? `${(el.w * el.h).toFixed(2)} m²` : `${toSqft(el.w * el.h)} sqft`}
          </p>
        </div>
      </div>

      <div className="shrink-0 p-4 border-t border-[var(--border)] space-y-2">
        <button onClick={onDuplicate} className="w-full py-1.5 rounded-lg text-xs border border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text-1)] hover:border-[var(--border-mid)] transition-colors">
          Duplicate
        </button>
        <button onClick={onDelete} className="w-full py-1.5 rounded-lg text-xs border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors">
          Delete
        </button>
      </div>
    </div>
  );
}
