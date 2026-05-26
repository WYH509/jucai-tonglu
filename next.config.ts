import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable Turbopack to avoid type-checking issues with generated files
  experimental: {
    // Use webpack build instead
  },
};

export default nextConfig;