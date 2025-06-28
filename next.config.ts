import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client'],
  // Force all pages to be dynamic
  output: 'standalone',
};

export default nextConfig;
