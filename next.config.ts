import type { NextConfig } from "next";
import { EMBED_ORIGINS } from "./features/docs/embeds";

const nextConfig: NextConfig = {
  // Pin the workspace root — a stray lockfile in the home dir otherwise makes
  // Next infer the wrong root (Turbopack is the default bundler in v16).
  turbopack: {
    root: __dirname,
  },
  // pages may only frame the players of sites docs can embed
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "Content-Security-Policy", value: `frame-src 'self' ${EMBED_ORIGINS.join(" ")}` }] }];
  },
};

export default nextConfig;
