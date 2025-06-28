import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client'],
  // Ensure API routes are not statically generated
  async headers() {
    return [];
  },
};

export default nextConfig;
