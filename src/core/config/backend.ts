import "server-only";

/**
 * Where the shared backend lives, and whether this app talks to it at all.
 *
 * `BACKEND_URL` deliberately has no `NEXT_PUBLIC_` prefix. With one, the
 * address would be inlined into the browser bundle and the browser could call
 * the backend directly — which is precisely what must not happen: the refresh
 * token is an HttpOnly cookie with `sameSite: 'lax'`, so a cross-origin call
 * never carries it. Route handlers under `/api` forward requests instead, and
 * the browser only ever sees this app's own origin.
 *
 * Unset means mock mode: the route handlers answer from dummy data, exactly as
 * they did before there was a backend.
 */
const configured = process.env.BACKEND_URL?.trim() ?? "";

export const backendUrl = configured === "" ? null : configured.replace(/\/+$/, "");

export const isServerBacked = backendUrl !== null;

/**
 * Builds a URL against the backend.
 *
 * The path is taken as-is rather than concatenated loosely, so a caller that
 * forgets the leading slash fails here instead of producing a URL that quietly
 * drops a path segment.
 */
export function backendEndpoint(path: string): string {
  if (backendUrl === null) throw new Error("BACKEND_URL is not set; this code path is mock-only.");
  if (!path.startsWith("/")) throw new Error(`Backend path must start with "/": ${path}`);

  return `${backendUrl}${path}`;
}
