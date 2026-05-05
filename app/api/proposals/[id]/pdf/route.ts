// Node.js runtime — puppeteer requires Node APIs (spawn, fs, etc.)
export const runtime    = "nodejs";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { createClient } from "@/lib/supabase/server";
import { parseParams } from "@/lib/validate";
import { apiLimiter, limit } from "@/lib/ratelimit";
import type { ProposalData } from "@/lib/proposals";
import { buildProposalHtml } from "@/lib/pdf/render-proposal";

const ParamsSchema = z.object({ id: z.string().uuid() });

// One shared browser instance reused across invocations within the same
// serverless execution context to avoid launching a new Chromium per request.
let _browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;

async function getBrowser() {
  if (_browser) {
    try {
      await _browser.version();
      return _browser;
    } catch {
      _browser = null;
    }
  }

  const isDev = process.env.NODE_ENV !== "production";

  const executablePath = isDev
    // Use local Chrome in development — no Lambda binary needed.
    ? process.platform === "win32"
        ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
        : process.platform === "darwin"
          ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
          : "/usr/bin/google-chrome"
    : await chromium.executablePath();

  _browser = await puppeteer.launch({
    args: [
      ...chromium.args,
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
    executablePath,
    headless: true,
    defaultViewport: { width: 1280, height: 900 },
  });

  return _browser;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rawParams = await params;
  const parsed = parseParams(rawParams, ParamsSchema);
  if (parsed.error) return parsed.error;
  const { id } = parsed.data;

  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const rl = await limit(apiLimiter, `user:${user.id}`);
  if (rl) return rl;

  // ── Fetch proposal ────────────────────────────────────────────────────────
  const { data, error } = await supabase
    .from("proposals")
    .select("id, data")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  }

  const proposal: ProposalData = {
    ...(data.data as Record<string, unknown>),
    id: data.id,
  } as ProposalData;

  // ── Build HTML ────────────────────────────────────────────────────────────
  const html = buildProposalHtml(proposal);

  // ── Render PDF with Puppeteer ─────────────────────────────────────────────
  let page: Awaited<ReturnType<Awaited<ReturnType<typeof getBrowser>>["newPage"]>> | null = null;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();

    // Disable JS — our HTML is static, no client scripts needed.
    await page.setJavaScriptEnabled(false);

    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });

    const pdfUint8 = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
    });

    // NextResponse requires a Node.js Buffer, not Uint8Array.
    const pdfBuffer = Buffer.from(pdfUint8);

    const filename = `${(proposal.concept?.title ?? proposal.title ?? "proposal")
      .replace(/[^a-z0-9]+/gi, "-")
      .toLowerCase()
      .slice(0, 60)}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control":       "no-store",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[pdf/route] render failed:", message);
    return NextResponse.json({ error: "PDF generation failed. Please try again." }, { status: 500 });
  } finally {
    if (page) await page.close().catch(() => {});
  }
}
