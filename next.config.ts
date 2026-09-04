import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL?.trim().replace(/\/+$/, "") ?? "";

const nextConfig: NextConfig = {
  typedRoutes: true,

  /**
   * The two WebSocket gateways, and only those.
   *
   * Everything else under /api goes through a route handler, which can attach
   * the access token and translate cookies. A route handler cannot relay an
   * HTTP upgrade, so a socket has to be rewritten straight through — this is
   * the one place the proxy pattern does not reach.
   *
   * Empty when BACKEND_URL is unset, so a checkout with no backend is
   * unaffected.
   */
  async rewrites() {
    if (backendUrl === "") return [];

    return [
      { source: "/api/topology", destination: `${backendUrl}/api/topology` },
      { source: "/api/live/chat", destination: `${backendUrl}/api/live/chat` },
    ];
  },
  experimental: {
    optimizePackageImports: ["@tanstack/react-query", "class-validator", "class-transformer"],
  },
};

export default nextConfig;
