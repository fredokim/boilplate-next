import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL?.trim().replace(/\/+$/, "") ?? "";

const nextConfig: NextConfig = {
  typedRoutes: true,

  /**
   * Development origins the dev server will serve its own chunks to.
   *
   * Without `127.0.0.1` here, opening the app at http://127.0.0.1:3000 gets a
   * 403 on every `_next/static` chunk — the browser sends an origin the dev
   * server does not recognise, and refuses. The page still server-renders, so
   * it looks almost right: the markup is there and nothing hydrates, which
   * reads as "the app is broken" rather than "the assets were refused".
   *
   * curl does not reproduce it, because it sends no origin at all.
   *
   * Production is unaffected; this option only applies to the dev server.
   */
  allowedDevOrigins: ["127.0.0.1", "localhost"],

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
