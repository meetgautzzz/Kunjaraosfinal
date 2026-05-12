import type { NextConfig } from "next";

// CSP: tight where possible; allowances called out by reason.
// - 'unsafe-inline' on script-src + style-src: Next.js inline bootstrap + Tailwind. Migrate to nonces later.
// - 'unsafe-eval': Razorpay checkout uses Function() in some flows.
// - razorpay + sardine.ai: Razorpay checkout SDK + its fraud-detection vendor.
// - supabase wildcards: auth, postgrest, realtime websockets.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://checkout.razorpay.com https://*.razorpay.com https://api.sardine.ai https://unpkg.com https://www.googletagmanager.com https://www.google-analytics.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.razorpay.com https://lumberjack.razorpay.com https://*.sardine.ai https://fonts.googleapis.com https://fonts.gstatic.com https://unpkg.com https://www.google-analytics.com https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://www.google.com/g/collect https://analytics.google.com/g/collect https://stats.g.doubleclick.net",
  "worker-src 'self' blob:",
  "frame-src https://api.razorpay.com https://checkout.razorpay.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/waitlist", destination: "/site/waitlist.html" },
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
    ];
  },
};

export default nextConfig;
