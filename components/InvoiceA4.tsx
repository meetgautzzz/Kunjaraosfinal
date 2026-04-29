"use client";

/**
 * InvoiceA4 — pixel-perfect A4 document renderer.
 *
 * Pure display component: no hooks, no toolbar, no back buttons.
 * All colours are explicit hex so they survive @media print stripping.
 * className="invoice-a4-doc" on root is the print-isolation anchor.
 *
 * Screen:  render inside any container; caller controls scaling via CSS zoom.
 * Print:   globals.css isolates .invoice-a4-doc and resets @page to A4.
 */

import React, { useMemo } from "react";
import type { BudgetItem, BudgetMeta } from "@/lib/budget";
import type { Branding } from "@/lib/branding";
import { calcItem, calcTotals, formatINR, DEFAULT_TERMS } from "@/lib/budget";

// ── Public types ──────────────────────────────────────────────────────────────
export type InvoiceA4Props = {
  meta:      BudgetMeta;
  items:     BudgetItem[];
  branding:  Branding;
  budgetId?: string;
};

// ── Per-document-type accent colours ─────────────────────────────────────────
const ACCENT: Record<string, { strip: string; badge: string; text: string; totalAmt: string }> = {
  invoice:  { strip: "#1d4ed8", badge: "#1e3a5f", text: "#fff", totalAmt: "#1d4ed8" },
  estimate: { strip: "#15803d", badge: "#14532d", text: "#fff", totalAmt: "#15803d" },
};

// ── Shared style constants ────────────────────────────────────────────────────
const FONT   = "'Inter', 'Helvetica Neue', Arial, sans-serif";
const PAD_H  = 40;   // horizontal padding px
const C      = {     // colour palette
  text:       "#111827",
  sub:        "#374151",
  muted:      "#6b7280",
  faint:      "#9ca3af",
  rule:       "#e5e7eb",
  ruleFaint:  "#f3f4f6",
  bg:         "#f9fafb",
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function InvoiceA4({ meta, items, branding, budgetId }: InvoiceA4Props) {
  const totals      = useMemo(() => calcTotals(items, meta), [items, meta]);
  const visItems    = items.filter((it) => it.visible);
  const terms       = meta.terms?.length ? meta.terms : DEFAULT_TERMS;
  const showCosts   = !meta.hideClientCosts;
  const gstEntries  = Object.entries(totals.gstBreakdown).filter(([, v]) => v > 0);

  const docType  = meta.documentType ?? "estimate";
  const accent   = ACCENT[docType] ?? ACCENT.estimate;
  const docLabel = docType === "invoice" ? "INVOICE" : "ESTIMATE";
  const docPfx   = docType === "invoice" ? "INV" : "EST";
  const docNo    = budgetId
    ? `${docPfx}-${budgetId.slice(-6).toUpperCase()}`
    : `${docPfx}-000001`;
  const docDate  = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

  const company   = branding.company_name || "Your Company";
  const hasClient = !!(meta.clientName || meta.clientCompany || meta.clientAddress);

  // Group visible items by category — keep insertion order
  const grouped = useMemo(() => {
    const map = new Map<string, BudgetItem[]>();
    for (const item of visItems) {
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category)!.push(item);
    }
    return map;
  }, [visItems]);

  let rowN = 0;

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const colCount = showCosts ? 5 : 3;

  return (
    <div
      className="invoice-a4-doc"
      style={{
        width: "794px",
        minWidth: "794px",
        background: "#ffffff",
        color: C.text,
        fontFamily: FONT,
        fontSize: "12px",
        lineHeight: "1.55",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {/* ━━ TOP ACCENT STRIP ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div style={{ height: "5px", background: accent.strip }} />

      {/* ━━ HEADER: Logo left · Company right ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        padding: `28px ${PAD_H}px 22px`,
        borderBottom: `1.5px solid ${C.rule}`,
        gap: "24px",
      }}>
        {/* Logo */}
        <div style={{ flexShrink: 0 }}>
          {branding.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.logo_url}
              alt="Logo"
              style={{ height: "54px", width: "auto", objectFit: "contain", display: "block" }}
            />
          ) : (
            <div style={{
              width: "54px", height: "54px", borderRadius: "10px",
              background: accent.strip, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: "22px", fontWeight: 900,
            }}>
              {company.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Company info */}
        <div style={{ textAlign: "right", minWidth: 0 }}>
          <p style={{ fontWeight: 800, fontSize: "15px", color: C.text, margin: 0, lineHeight: 1.2 }}>
            {company}
          </p>
          {branding.address && (
            <p style={{ color: C.muted, fontSize: "10.5px", marginTop: "5px", whiteSpace: "pre-line", lineHeight: 1.5 }}>
              {branding.address}
            </p>
          )}
          {branding.gst_number && (
            <p style={{ color: C.muted, fontSize: "10.5px", marginTop: "3px" }}>
              GSTIN:{" "}
              <span style={{ fontFamily: "monospace", fontWeight: 600, color: C.sub }}>
                {branding.gst_number}
              </span>
            </p>
          )}
          {branding.phone_number && (
            <p style={{ color: C.muted, fontSize: "10.5px", marginTop: "2px" }}>{branding.phone_number}</p>
          )}
          {branding.website && (
            <p style={{ color: C.muted, fontSize: "10.5px" }}>{branding.website}</p>
          )}
        </div>
      </div>

      {/* ━━ TITLE BAR: doc type · number · date ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: `14px ${PAD_H}px`,
        background: accent.badge,
      }}>
        <p style={{ color: accent.text, fontSize: "17px", fontWeight: 900, letterSpacing: "0.1em", margin: 0 }}>
          {docLabel}
        </p>
        <div style={{ textAlign: "right" }}>
          <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "11px", margin: 0, fontFamily: "monospace", letterSpacing: "0.04em" }}>
            {docNo}
          </p>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "10px", marginTop: "2px" }}>
            {docDate}{meta.eventType ? ` · ${meta.eventType}` : ""}
            {meta.status === "draft" ? " · DRAFT" : ""}
          </p>
        </div>
      </div>

      {/* ━━ BILLING: Bill To (left) · From (right) ━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        borderBottom: `1px solid ${C.rule}`,
      }}>
        {/* Client */}
        <div style={{ padding: `18px ${PAD_H}px`, borderRight: `1px solid ${C.rule}` }}>
          <AddressLabel>Bill To</AddressLabel>
          {hasClient ? (
            <>
              {meta.clientName    && <p style={{ fontWeight: 700, fontSize: "13px", color: C.text, margin: 0 }}>{meta.clientName}</p>}
              {meta.clientCompany && <p style={{ color: C.sub, fontSize: "11.5px", marginTop: "2px" }}>{meta.clientCompany}</p>}
              {meta.clientAddress && <p style={{ color: C.muted, fontSize: "10.5px", marginTop: "5px", whiteSpace: "pre-line", lineHeight: 1.5 }}>{meta.clientAddress}</p>}
              {meta.clientGST     && <p style={{ color: C.muted, fontSize: "10.5px", marginTop: "4px" }}>GSTIN: <Mono>{meta.clientGST}</Mono></p>}
            </>
          ) : (
            <p style={{ color: "#d1d5db", fontSize: "11px", fontStyle: "italic" }}>No client details added</p>
          )}
        </div>

        {/* Company */}
        <div style={{ padding: `18px ${PAD_H}px` }}>
          <AddressLabel>From</AddressLabel>
          <p style={{ fontWeight: 700, fontSize: "13px", color: C.text, margin: 0 }}>{company}</p>
          {branding.address && (
            <p style={{ color: C.muted, fontSize: "10.5px", marginTop: "5px", whiteSpace: "pre-line", lineHeight: 1.5 }}>{branding.address}</p>
          )}
          {branding.gst_number && (
            <p style={{ color: C.muted, fontSize: "10.5px", marginTop: "4px" }}>GSTIN: <Mono>{branding.gst_number}</Mono></p>
          )}
          {branding.phone_number && (
            <p style={{ color: C.muted, fontSize: "10.5px", marginTop: "2px" }}>{branding.phone_number}</p>
          )}
        </div>
      </div>

      {/* ━━ DOCUMENT TITLE (optional) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {meta.title && (
        <div style={{ padding: `18px ${PAD_H}px 0` }}>
          <p style={{ fontWeight: 700, fontSize: "13.5px", color: C.text, margin: 0 }}>{meta.title}</p>
        </div>
      )}

      {/* ━━ LINE ITEMS TABLE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div style={{ padding: `16px ${PAD_H}px 20px` }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11.5px" }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${C.text}` }}>
              <TH align="left"  w="24px">#</TH>
              <TH align="left">Item</TH>
              <TH align="left">Description</TH>
              <TH align="right" w="44px">Qty</TH>
              {showCosts && (
                <>
                  <TH align="right" w="86px">Rate</TH>
                  <TH align="right" w="86px">Amount</TH>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {[...grouped.entries()].map(([cat, catItems]) => (
              <React.Fragment key={cat}>
                {/* Category label row */}
                <tr>
                  <td
                    colSpan={colCount}
                    style={{ paddingTop: "14px", paddingBottom: "3px" }}
                  >
                    <span style={{
                      fontSize: "9px", fontWeight: 700,
                      letterSpacing: "0.14em", textTransform: "uppercase",
                      color: C.faint,
                    }}>
                      {cat}
                    </span>
                  </td>
                </tr>

                {/* Item rows */}
                {catItems.map((item) => {
                  const calc = calcItem(item, meta.globalMargin);
                  rowN += 1;
                  const n = rowN;
                  return (
                    <tr key={item.id} style={{ borderBottom: `1px solid ${C.ruleFaint}` }}>
                      {/* # */}
                      <td style={{ ...TD, color: C.faint, fontSize: "10px" }}>{n}</td>

                      {/* Item name */}
                      <td style={{ ...TD, paddingRight: "12px", verticalAlign: "top" }}>
                        <p style={{ fontWeight: 500, color: C.text, margin: 0, lineHeight: 1.3, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                          {item.description || `Item ${n}`}
                        </p>
                        {/* unit under name, small */}
                        {item.unit && item.unit !== "Lump Sum" && (
                          <p style={{ color: C.faint, fontSize: "9.5px", marginTop: "1px" }}>{item.unit}</p>
                        )}
                      </td>

                      {/* Description / notes */}
                      <td style={{ ...TD, color: C.muted, verticalAlign: "top", wordBreak: "break-word" }}>
                        {item.notes || "—"}
                      </td>

                      {/* Qty */}
                      <td style={{ ...TD, textAlign: "right", color: C.sub, fontVariantNumeric: "tabular-nums" }}>
                        {item.quantity}
                      </td>

                      {showCosts && (
                        <>
                          {/* Rate */}
                          <td style={{ ...TD, textAlign: "right", color: C.sub, fontVariantNumeric: "tabular-nums" }}>
                            {formatINR(item.unitCost)}
                          </td>
                          {/* Amount */}
                          <td style={{ ...TD, textAlign: "right", fontWeight: 600, color: C.text, fontVariantNumeric: "tabular-nums" }}>
                            {formatINR(calc.total)}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* ━━ TOTALS (right-aligned) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {showCosts && (
        <div style={{
          padding: `0 ${PAD_H}px 24px`,
          borderTop: `1px solid ${C.rule}`,
          display: "flex",
          justifyContent: "flex-end",
        }}>
          <table style={{ borderCollapse: "collapse", minWidth: "256px", marginTop: "14px" }}>
            <tbody>
              <TR_total label="Subtotal" value={formatINR(totals.subtotal + totals.totalMargin)} />
              {gstEntries.map(([rate, amt]) => (
                <TR_total key={rate} label={`GST @ ${rate}%`} value={formatINR(amt)} muted />
              ))}
              {totals.totalGST > 0 && (
                <TR_total label="Total GST" value={formatINR(totals.totalGST)} muted />
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} style={{ paddingTop: "10px" }}>
                  <div style={{
                    borderTop: `2px solid ${C.text}`,
                    paddingTop: "10px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: "32px",
                  }}>
                    <span style={{ fontSize: "13px", fontWeight: 800, color: C.text }}>Grand Total</span>
                    <span style={{
                      fontSize: "20px", fontWeight: 900,
                      color: accent.totalAmt,
                      fontVariantNumeric: "tabular-nums",
                    }}>
                      {formatINR(totals.grandTotal)}
                    </span>
                  </div>
                  <p style={{ color: C.faint, fontSize: "9px", textAlign: "right", marginTop: "5px" }}>
                    {totals.totalGST > 0
                      ? "Inclusive of all applicable GST"
                      : "GST not applicable / exempt"}
                  </p>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ━━ TERMS & CONDITIONS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {terms.length > 0 && (
        <div style={{
          padding: `18px ${PAD_H}px`,
          borderTop: `1px solid ${C.rule}`,
          background: C.bg,
        }}>
          <p style={{
            fontSize: "9.5px", fontWeight: 700,
            letterSpacing: "0.1em", textTransform: "uppercase",
            color: C.sub, marginBottom: "10px",
          }}>
            Terms &amp; Conditions
          </p>
          <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {terms.map((term, i) => (
              <li key={i} style={{ display: "flex", gap: "8px", marginBottom: "5px" }}>
                <span style={{ color: C.faint, fontSize: "9.5px", fontWeight: 700, minWidth: "14px", flexShrink: 0, paddingTop: "1px" }}>
                  {i + 1}.
                </span>
                <span style={{ color: C.muted, fontSize: "9.5px", lineHeight: 1.6 }}>{term}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* ━━ FOOTER: Address left · Signature right ━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-end",
        padding: `22px ${PAD_H}px 26px`,
        borderTop: `1px solid ${C.rule}`,
        gap: "24px",
      }}>
        {/* Registered address */}
        <div style={{ fontSize: "9.5px", color: C.faint, lineHeight: 1.7 }}>
          <p style={{ fontWeight: 600, color: C.muted, margin: 0 }}>{company}</p>
          {branding.address && <p style={{ margin: 0, whiteSpace: "pre-line" }}>{branding.address}</p>}
          {branding.gst_number && <p style={{ margin: 0 }}>GSTIN: {branding.gst_number}</p>}
          {branding.phone_number && <p style={{ margin: 0 }}>{branding.phone_number}</p>}
        </div>

        {/* Signature block */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{
            width: "180px", height: "44px",
            borderBottom: `1px solid ${C.faint}`,
            marginBottom: "6px", marginLeft: "auto",
          }} />
          <p style={{ fontSize: "9.5px", color: C.muted, margin: 0 }}>Authorised Signatory</p>
          <p style={{ fontSize: "10px", fontWeight: 600, color: C.sub, marginTop: "3px" }}>
            For: {company}
          </p>
        </div>
      </div>

      {/* ━━ BOTTOM ACCENT STRIP ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div style={{ height: "4px", background: accent.strip }} />
    </div>
  );
}

// ── Tiny helpers (no Tailwind — print-safe) ───────────────────────────────────

function AddressLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: "9px", fontWeight: 700,
      letterSpacing: "0.14em", textTransform: "uppercase",
      color: "#9ca3af", marginBottom: "8px",
    }}>
      {children}
    </p>
  );
}

function Mono({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontFamily: "monospace", fontWeight: 600, color: "#374151" }}>{children}</span>
  );
}

function TH({ children, align, w }: {
  children: React.ReactNode;
  align: "left" | "right";
  w?: string;
}) {
  return (
    <th style={{
      textAlign: align,
      padding: "0 0 8px",
      paddingLeft:  align === "right" ? "10px" : undefined,
      paddingRight: align === "left"  ? "10px" : undefined,
      fontSize: "9px", fontWeight: 700,
      letterSpacing: "0.12em", textTransform: "uppercase",
      color: "#6b7280", width: w, whiteSpace: "nowrap",
    }}>
      {children}
    </th>
  );
}

const TD: React.CSSProperties = {
  padding: "8px 0",
  paddingLeft: "0",
  verticalAlign: "top",
  color: "#374151",
  fontSize: "11px",
};

function TR_total({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <tr>
      <td style={{
        fontSize: "11px",
        color: muted ? "#9ca3af" : "#6b7280",
        paddingBottom: "5px",
        paddingRight: "28px",
        whiteSpace: "nowrap",
      }}>
        {label}
      </td>
      <td style={{
        fontSize: "11px",
        color: muted ? "#9ca3af" : "#374151",
        paddingBottom: "5px",
        textAlign: "right",
        fontVariantNumeric: "tabular-nums",
      }}>
        {value}
      </td>
    </tr>
  );
}
