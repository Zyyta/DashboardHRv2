import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable server actions
  experimental: {
    // Enable typed routes
    typedRoutes: true,
  },
};

export default nextConfig;
