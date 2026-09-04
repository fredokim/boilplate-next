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
export const ACCESS_TOKEN_COOKIE = "nb_access";

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
