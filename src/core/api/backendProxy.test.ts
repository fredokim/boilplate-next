import { NextResponse } from "next/server";
import { describe, expect, it } from "vitest";
import { ACCESS_TOKEN_COOKIE, captureAccessToken } from "./backendProxy";

/**
 * The backend's refresh cookie and this app's access cookie have to survive on
 * the same response. They did not: `NextResponse.cookies.set()` rebuilds the
 * whole set-cookie header from a map it builds by reading the existing headers
 * back as one joined string, so the refresh cookie was dropped on its way to
 * the browser.
 *
 * Nothing failed at the time. Login returned 200 with a working access cookie,
 * and the session ended quietly later -- at the access token's lifetime after a
 * login, or at the first replay-detected rotation after a refresh. It took a
 * deployment to notice, which is why this file exists.
 */
function backendResponse(refreshCookie: string, accessToken: string): NextResponse {
  const response = new NextResponse(JSON.stringify({ success: true, data: { accessToken } }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

  response.headers.append("set-cookie", refreshCookie);

  return response;
}

const REFRESH_COOKIE =
  "rb_refresh=abc123; Max-Age=2592000; Path=/api/auth; Expires=Sun, 04 Oct 2026 16:41:27 GMT; HttpOnly; Secure; SameSite=Lax";

describe("captureAccessToken", () => {
  it("keeps the backend's refresh cookie alongside the access cookie", async () => {
    const response = await captureAccessToken(backendResponse(REFRESH_COOKIE, "token-value"));
    const cookies = response.headers.getSetCookie();

    expect(cookies).toHaveLength(2);
    expect(cookies.some((cookie) => cookie.startsWith("rb_refresh="))).toBe(true);
    expect(cookies.some((cookie) => cookie.startsWith(`${ACCESS_TOKEN_COOKIE}=token-value`))).toBe(true);
  });

  it("leaves the refresh cookie's attributes intact", async () => {
    // Expires always contains a comma, so a header joined into one string and
    // split again produces two broken cookies rather than one good one.
    const response = await captureAccessToken(backendResponse(REFRESH_COOKIE, "token-value"));
    const refresh = response.headers.getSetCookie().find((cookie) => cookie.startsWith("rb_refresh="));

    expect(refresh).toBe(REFRESH_COOKIE);
  });

  it("marks the access cookie HttpOnly and scoped to the whole app", async () => {
    const response = await captureAccessToken(backendResponse(REFRESH_COOKIE, "token-value"));
    const access = response.headers.getSetCookie().find((cookie) => cookie.startsWith(ACCESS_TOKEN_COOKIE));

    expect(access).toContain("HttpOnly");
    expect(access).toContain("Path=/");
    expect(access).toContain("SameSite=Lax");
  });

  it("passes a response through untouched when there is no token to capture", async () => {
    const response = new NextResponse(JSON.stringify({ success: false }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
    response.headers.append("set-cookie", REFRESH_COOKIE);

    const result = await captureAccessToken(response);

    expect(result.headers.getSetCookie()).toEqual([REFRESH_COOKIE]);
  });
});
