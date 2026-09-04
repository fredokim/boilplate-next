import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { backendEndpoint, isServerBacked } from "@/core/config/backend";

/**
 * Where the access token is kept.
 *
 * In a cookie the browser cannot read, rather than in local storage. The token
 * is attached to backend calls here, on the server, so nothing in the page ever
 * holds it — a script that runs in this origin has nothing to steal. It also
 * means server components authenticate the same way client code does, from the
 * same place.
 *
 * The React and Vue boilerplates keep theirs in local storage and attach it in
 * the browser. They have no server of their own to hold it; this app does, and
 * a boilerplate about server boundaries should use it.
 */
/**
 * The name is the backend's, not this app's. Its WebSocket gateways read the
 * access token from a cookie by this name when the handshake carries no query
 * token — which is the case here, because the page never holds the token and so
 * cannot put it in a socket URL.
 */
export const ACCESS_TOKEN_COOKIE = "rb_access";

/**
 * Forwards a route handler's request to the shared backend.
 *
 * This is what keeps the browser on one origin. The refresh token is an
 * HttpOnly cookie with `sameSite: 'lax'`, so a call made from the browser
 * straight to the backend would never carry it — sign-in would appear to work
 * and the session would end at the access token's lifetime. Going through the
 * route handler means the cookie is set on, and sent from, this app's origin.
 *
 * Cookies travel in both directions, and that is the part most easily got
 * wrong: the incoming `Cookie` header has to reach the backend, and the
 * backend's `Set-Cookie` has to reach the browser. Drop either and login
 * succeeds while refresh silently cannot.
 */
export async function proxyToBackend(request: Request, path: string): Promise<NextResponse> {
  if (!isServerBacked) throw new Error("proxyToBackend called without BACKEND_URL");

  const incoming = new URL(request.url);
  const target = `${backendEndpoint(path)}${incoming.search}`;

  const headers = new Headers();
  const cookie = request.headers.get("cookie");
  const contentType = request.headers.get("content-type");

  if (cookie) headers.set("cookie", cookie);
  if (contentType) headers.set("content-type", contentType);

  // Attached here rather than by the browser. An Authorization header arriving
  // from the client is ignored on purpose: accepting one would reintroduce the
  // token into page scripts by the back door.
  const accessToken = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;

  if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);

  const method = request.method;
  const body = method === "GET" || method === "HEAD" ? undefined : await request.text();

  const upstream = await fetch(target, {
    method,
    headers,
    ...(body === undefined || body === "" ? {} : { body }),
    // The backend's own cookies, not this process's. Redirects are not followed
    // so a 302 stays visible to the caller rather than being resolved silently.
    redirect: "manual",
  });

  const response = new NextResponse(await upstream.text(), {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
  });

  // `getSetCookie` returns each Set-Cookie separately. Reading the header as a
  // single string joins them with a comma, which corrupts any cookie whose
  // Expires attribute contains one — and Expires always does.
  for (const value of upstream.headers.getSetCookie()) {
    response.headers.append("set-cookie", value);
  }

  return response;
}

/**
 * Stores the access token the backend just issued, without disturbing the
 * cookies already on the response.
 *
 * `NextResponse.cookies.set()` cannot be used for this. It rebuilds the whole
 * `set-cookie` header from its own map, and building that map reads the
 * existing headers back as a single comma-joined string -- the exact corruption
 * `getSetCookie` above exists to avoid, one layer up. The visible effect in
 * production was that the backend's refresh cookie disappeared: sign-in
 * succeeded and returned only this cookie, and nothing logged anything.
 *
 * On login that ends the session at the access token's lifetime. On refresh it
 * is worse, because the backend rotates the refresh token and treats a reused
 * one as a replay: the next attempt revokes the whole family and signs the user
 * out.
 */
export async function captureAccessToken(response: NextResponse): Promise<NextResponse> {
  const clone = response.clone();
  const payload: unknown = await clone.json().catch(() => null);
  const token = (payload as { data?: { accessToken?: unknown } } | null)?.data?.accessToken;

  if (typeof token !== "string") return response;

  const attributes = [`${ACCESS_TOKEN_COOKIE}=${token}`, "Path=/", "HttpOnly", "SameSite=Lax"];

  // Deliberately a session cookie: the access token is short-lived and the
  // refresh cookie is what survives a restart.
  if (process.env.NODE_ENV === "production") attributes.push("Secure");

  response.headers.append("set-cookie", attributes.join("; "));

  return response;
}
