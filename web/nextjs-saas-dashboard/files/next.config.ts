import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A second dev server (the desktop app) builds into its own folder so it never shares the website's `.next`.
  // Keep that folder in the lint ignores too (eslint.config.mjs).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // API proxy configuration can be added here if needed
  // For now, we'll use direct API calls from the client
};

export default nextConfig;
