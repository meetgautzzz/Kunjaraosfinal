#!/usr/bin/env npx tsx
/**
 * Webhook smoke-tester.
 *
 * Simulates Razorpay webhook calls against a running local dev server.
 * Run:  npx tsx scripts/test-webhook.ts
 *
 * Env required (reads from .env.local automatically via dotenv):
 *   RAZORPAY_WEBHOOK_SECRET — must match what the running server uses
 *   TEST_USER_ID            — UUID of a real user in your Supabase DB
 *
 * What it tests:
 *   1. Valid payment.captured → expects credits applied
 *   2. Same payload again    → expects idempotent (no double credit)
 *   3. Tampered signature    → expects 400
 */

import crypto from "crypto";
import { readFileSync } from "fs";
import { join } from "path";

// ---------------------------------------------------------------------------
// Load .env.local manually (no side-effects on the running server)
// ---------------------------------------------------------------------------
function loadEnv() {
  try {
    const raw = readFileSync(join(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    // .env.local may not exist in CI — fall through to real env vars
  }
}
loadEnv();

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;
const USER_ID        = process.env.TEST_USER_ID;
const BASE_URL       = process.env.TEST_BASE_URL ?? "http://localhost:3000";

if (!WEBHOOK_SECRET) {
  console.error("✗ RAZORPAY_WEBHOOK_SECRET is not set");
  process.exit(1);
}
if (!USER_ID) {
  console.error("✗ TEST_USER_ID is not set (needs a real user UUID from Supabase)");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function sign(body: string): string {
  return crypto.createHmac("sha256", WEBHOOK_SECRET!).update(body).digest("hex");
}

async function post(url: string, body: string, signature: string) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type":       "application/json",
      "x-razorpay-signature": signature,
      "x-razorpay-event-id":  `test_${Date.now()}`,
    },
    body,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

function makeCapturedEvent(paymentId: string, orderId: string, amountPaise: number) {
  return JSON.stringify({
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id:       paymentId,
          order_id: orderId,
          amount:   amountPaise,
          status:   "captured",
        },
      },
    },
  });
}

// ---------------------------------------------------------------------------
// NOTE: The webhook handler fetches the order from Razorpay server-to-server
// to read order.notes (user_id, pack, purpose). In a real test you would
// either (a) create a real Razorpay test order first, or (b) stub the
// Razorpay API.  This script tests the SIGNATURE and SCHEMA layers only
// without live Razorpay credentials — useful for CI.
//
// To run a full end-to-end test with real order resolution, set:
//   TEST_ORDER_ID   — a real Razorpay test-mode order ID
//   TEST_PAYMENT_ID — a real captured test-mode payment ID
// ---------------------------------------------------------------------------

const CREDIT_PACKS_URL = `${BASE_URL}/api/payments/credits`;

async function run() {
  console.log(`\nWebhook smoke-test → ${CREDIT_PACKS_URL}\n`);

  // ── Test 1: invalid signature ───────────────────────────────────────────
  {
    const body = makeCapturedEvent("pay_FAKE001", "order_FAKE001", 49900);
    const { status, json } = await post(CREDIT_PACKS_URL, body, "badsignature");
    const pass = status === 400;
    console.log(`[1] Invalid signature  →  HTTP ${status}  ${pass ? "✓ PASS" : "✗ FAIL"}`);
    if (!pass) console.log("    Response:", json);
  }

  // ── Test 2: non-captured event (should be ignored with 200) ─────────────
  {
    const body = JSON.stringify({
      event: "payment.failed",
      payload: { payment: { entity: { id: "pay_X", order_id: "order_X", amount: 49900, status: "failed" } } },
    });
    const { status, json } = await post(CREDIT_PACKS_URL, body, sign(body));
    const pass = status === 200 && json.ignored;
    console.log(`[2] Non-captured event →  HTTP ${status}  ${pass ? "✓ PASS" : "✗ FAIL"}`);
    if (!pass) console.log("    Response:", json);
  }

  // ── Test 3: valid payment.captured — order fetch will fail (no live creds)
  //    We just verify the webhook gets past signature check and hits the
  //    Razorpay order-fetch step (502 = got past auth, failed on Razorpay API)
  {
    const body = makeCapturedEvent("pay_TEST001", "order_TEST001", 49900);
    const { status, json } = await post(CREDIT_PACKS_URL, body, sign(body));
    const pass = status !== 400; // 400 would mean signature rejected
    console.log(`[3] Valid signature    →  HTTP ${status}  ${pass ? "✓ PASS (reached order-fetch)" : "✗ FAIL (rejected before order fetch)"}`);
    console.log("    Response:", json);
  }

  // ── Test 4: full end-to-end (only if real test-mode order IDs are set) ──
  const testOrderId   = process.env.TEST_ORDER_ID;
  const testPaymentId = process.env.TEST_PAYMENT_ID;
  if (testOrderId && testPaymentId) {
    const body = makeCapturedEvent(testPaymentId, testOrderId, 49900);
    const sig  = sign(body);

    console.log(`\n[4] Full E2E — payment ${testPaymentId}`);

    const r1 = await post(CREDIT_PACKS_URL, body, sig);
    const pass1 = r1.status === 200 && r1.json.success;
    console.log(`    First delivery  →  HTTP ${r1.status}  ${pass1 ? "✓ PASS" : "✗ FAIL"}`);
    console.log("    Response:", r1.json);

    const r2 = await post(CREDIT_PACKS_URL, body, sig);
    const pass2 = r2.status === 200 && r2.json.idempotent === true;
    console.log(`    Duplicate retry →  HTTP ${r2.status}  ${pass2 ? "✓ PASS (idempotent)" : "✗ FAIL"}`);
    console.log("    Response:", r2.json);
  } else {
    console.log("\n[4] Full E2E skipped — set TEST_ORDER_ID and TEST_PAYMENT_ID for live test");
  }

  console.log("\nDone.\n");
}

run().catch((e) => { console.error(e); process.exit(1); });
