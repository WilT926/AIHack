import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The repo's AGENTS.md belongs to the team (it points agents at CLAUDE.md);
  // stop `next dev` from writing its own managed blocks into it.
  agentRules: false,
  // Self-contained server bundle for the Docker image (see Dockerfile).
  output: "standalone",
  // The dev badge sits on top of the floor's filter chips.
  devIndicators: false,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
