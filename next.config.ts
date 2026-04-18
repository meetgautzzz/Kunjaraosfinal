import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/waitlist", destination: "/site/waitlist.html" },
    ];
  },
};

export default nextConfig;
