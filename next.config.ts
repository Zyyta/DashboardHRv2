import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Nodemailer is a Node-only package (raw net/tls sockets); keep it out of the
  // server bundle so the build doesn't try to bundle it.
  serverExternalPackages: ['nodemailer'],
  // Enable server actions
  experimental: {
    // Enable typed routes
    typedRoutes: true,
  },
};

export default nextConfig;
