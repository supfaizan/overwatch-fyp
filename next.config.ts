import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root — a stray lockfile in the home dir otherwise makes
  // Next infer the wrong root (Turbopack is the default bundler in v16).
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
