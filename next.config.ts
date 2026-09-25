import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Serve pages at /page/ to match the other ai.jaseir.com URLs
  // (e.g. /ai-lead-qualification/, /rag-knowledge-assistant/).
  trailingSlash: true,
};

export default nextConfig;
