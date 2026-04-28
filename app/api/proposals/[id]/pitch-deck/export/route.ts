// Node.js runtime required — pptxgenjs uses Buffer and fs APIs.
export const runtime = "nodejs";
export const maxDuration = 30;

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import pptxgen from "pptxgenjs";
import { createClient } from "@/lib/supabase/server";
import { parseJson, parseParams } from "@/lib/validate";
import { apiLimiter, limit } from "@/lib/ratelimit";
import type { ProposalData, PitchSlide } from "@/lib/proposals";
import { formatINR } from "@/lib/proposals";

const ParamsSchema = z.object({ id: z.string().uuid() });

const BodySchema = z.object({
  slides: z.array(z.object({
    title:         z.string().trim().min(1).max(300),
    bullets:       z.array(z.string().trim().max(300)).min(1).max(10),
    speaker_notes: z.string().trim().max(3000),
    image_prompt:  z.string().trim().max(1000).optional(),
  })).min(1).max(20),
  proposalTitle: z.string().trim().max(300).optional(),
  clientName:    z.string().trim().max(200).optional(),
});

// ── Theme ────────────────────────────────────────────────────────────────────
const T = {
  bg:       "0A0F1E",  // near-black navy
  card:     "111827",  // dark card
  accent:   "6366F1",  // indigo
  accentLt: "A5B4FC",  // light indigo
  white:    "F8FAFC",
  muted:    "94A3B8",
  gold:     "F59E0B",
} as const;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rawParams = await params;
  const parsedParams = parseParams(rawParams, ParamsSchema);
  if (parsedParams.error) return parsedParams.error;

  const bodyResult = await parseJson(req, BodySchema);
  if (bodyResult.error) return bodyResult.error;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const rl = await limit(apiLimiter, `user:${user.id}`);
  if (rl) return rl;

  // Fetch proposal metadata (title, client, budget) for the cover
  const { data: row } = await supabase
    .from("proposals")
    .select("data")
    .eq("id", parsedParams.data.id)
    .eq("user_id", user.id)
    .single();

  const proposal = (row?.data ?? {}) as ProposalData;
  const { slides, proposalTitle, clientName } = bodyResult.data;

  const coverTitle  = proposalTitle ?? proposal.title ?? "Event Proposal";
  const coverClient = clientName    ?? proposal.client?.companyName ?? "";
  const safeTitle   = coverTitle.replace(/[^a-z0-9_\- ]/gi, "").slice(0, 60).trim() || "pitch-deck";
  const filename    = `${safeTitle.replace(/\s+/g, "-").toLowerCase()}-pitch-deck.pptx`;

  // ── Build PPTX ──────────────────────────────────────────────────────────────
  const prs = new pptxgen();
  prs.layout  = "LAYOUT_WIDE"; // 13.33" × 7.5"
  prs.author  = "Kunjara OS";
  prs.company = "Kunjara OS";
  prs.subject = coverTitle;
  prs.title   = coverTitle;

  slides.forEach((slide: PitchSlide, idx: number) => {
    const s = prs.addSlide();

    // Dark background
    s.background = { color: T.bg };

    if (idx === 0) {
      // ── Title slide ──────────────────────────────────────────────────────────
      // Accent strip (left side)
      s.addShape(prs.ShapeType.rect, {
        x: 0, y: 0, w: 0.18, h: "100%",
        fill: { color: T.accent },
        line: { type: "none" },
      });

      s.addText(slide.title, {
        x: 0.45, y: 1.8, w: 11.5, h: 1.6,
        fontSize: 40,
        bold: true,
        color: T.white,
        fontFace: "Helvetica",
        align: "left",
        valign: "middle",
      });

      if (slide.bullets[0]) {
        s.addText(slide.bullets[0], {
          x: 0.45, y: 3.6, w: 11.5, h: 0.55,
          fontSize: 18,
          color: T.accentLt,
          fontFace: "Helvetica",
          align: "left",
          italic: true,
        });
      }

      const meta = [
        coverClient,
        proposal.eventType,
        proposal.location,
        proposal.budget ? formatINR(proposal.budget) : "",
        proposal.eventDate ?? "",
      ].filter(Boolean).join("  ·  ");

      s.addText(meta, {
        x: 0.45, y: 6.4, w: 11.5, h: 0.4,
        fontSize: 12,
        color: T.muted,
        fontFace: "Helvetica",
        align: "left",
      });

      s.addText("Prepared by Kunjara OS", {
        x: 0.45, y: 6.9, w: 11.5, h: 0.3,
        fontSize: 10,
        color: T.muted,
        fontFace: "Helvetica",
        align: "left",
      });
    } else {
      // ── Content slides ──────────────────────────────────────────────────────

      // Slide number badge (top-right)
      s.addText(`${idx + 1} / ${slides.length}`, {
        x: 11.8, y: 0.15, w: 1.3, h: 0.3,
        fontSize: 9,
        color: T.muted,
        fontFace: "Helvetica",
        align: "right",
      });

      // Accent top bar
      s.addShape(prs.ShapeType.rect, {
        x: 0, y: 0, w: "100%", h: 0.06,
        fill: { color: T.accent },
        line: { type: "none" },
      });

      // Title
      s.addText(slide.title, {
        x: 0.5, y: 0.22, w: 11.2, h: 0.8,
        fontSize: 28,
        bold: true,
        color: T.white,
        fontFace: "Helvetica",
        align: "left",
        valign: "top",
      });

      // Divider line
      s.addShape(prs.ShapeType.line, {
        x: 0.5, y: 1.1, w: 11.2, h: 0,
        line: { color: T.accent, width: 1.2, dashType: "solid" },
      });

      // Bullets
      const bulletObjs = slide.bullets.map((b, bi) => [
        {
          text: `${bi > 0 ? "\n" : ""}`,
          options: { breakLine: false, fontSize: 4 },
        },
        {
          text: `▸  ${b}`,
          options: {
            fontSize: 17,
            color:    T.white,
            fontFace: "Helvetica",
            bullet:   false,
            breakLine: true,
          },
        },
      ]).flat();

      s.addText(bulletObjs as any, {
        x: 0.5, y: 1.25, w: 11.2, h: 5.4,
        valign: "top",
        paraSpaceAfter: 8,
      });
    }

    // Speaker notes on every slide
    if (slide.speaker_notes) {
      s.addNotes(slide.speaker_notes);
    }
  });

  // ── Write buffer ────────────────────────────────────────────────────────────
  let buffer: Buffer;
  try {
    buffer = await prs.write({ outputType: "nodebuffer" }) as unknown as Buffer;
  } catch (err) {
    console.error("[pitch-deck/export] pptxgenjs write failed:", err);
    return NextResponse.json({ error: "Failed to generate PowerPoint file." }, { status: 500 });
  }

  return new Response(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type":        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length":      String(buffer.byteLength),
    },
  });
}
