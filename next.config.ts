import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  experimental: {
    optimizePackageImports: ["@tanstack/react-query", "class-validator", "class-transformer"],
  },
};

export default nextConfig;
