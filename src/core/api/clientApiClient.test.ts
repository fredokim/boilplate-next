import { IsString } from "class-validator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestDto } from "./clientApiClient";

class ProbeDto {
  @IsString()
  id = "";
}

const unauthorized = () =>
  new Response(JSON.stringify({ success: false, error: { code: "AUTH_REQUIRED", message: "expired" } }), {
    status: 401,
    headers: { "content-type": "application/json" },
  });

const ok = () =>
  new Response(JSON.stringify({ success: true, data: { id: "probe" } }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

const refreshed = () =>
  new Response(JSON.stringify({ success: true, data: { accessToken: "fresh" } }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

describe("requestDto on 401", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("refreshes once for requests that fail together, then retries each", async () => {
    let refreshCalls = 0;
    const seen = new Map<string, number>();

    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);

        if (url.includes("/api/auth/refresh")) {
          refreshCalls += 1;
          // Held open briefly so all five callers are waiting on the same
          // promise, which is the situation the single flight exists for.
          return new Promise<Response>((resolve) => setTimeout(() => resolve(refreshed()), 20));
        }

        const attempts = (seen.get(url) ?? 0) + 1;
        seen.set(url, attempts);

        return Promise.resolve(attempts === 1 ? unauthorized() : ok());
      }),
    );

    const results = await Promise.all(
      ["/a", "/b", "/c", "/d", "/e"].map((url) => requestDto({ method: "GET", url }, ProbeDto)),
    );

    // With a rotating refresh token, five refreshes would have the server read
    // four spent tokens as a replay and revoke the session.
    expect(refreshCalls).toBe(1);
    expect(results.map((result) => result.id)).toEqual(Array<string>(5).fill("probe"));
  });

  it("does not retry twice when the refreshed token is also rejected", async () => {
    let calls = 0;

    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);

        if (url.includes("/api/auth/refresh")) return Promise.resolve(refreshed());

        calls += 1;
        return Promise.resolve(unauthorized());
      }),
    );

    await expect(requestDto({ method: "GET", url: "/always-401" }, ProbeDto)).rejects.toThrow();

    // Once, then once more after the refresh — and then it stops. Without the
    // guard this loops until the tab is closed.
    expect(calls).toBe(2);
  });

  it("leaves the refresh call itself alone", async () => {
    let refreshCalls = 0;

    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        if (String(input).includes("/auth/refresh")) {
          refreshCalls += 1;
          return Promise.resolve(unauthorized());
        }

        return Promise.resolve(unauthorized());
      }),
    );

    await expect(requestDto({ method: "GET", url: "/auth/refresh" }, ProbeDto)).rejects.toThrow();

    // A refresh that 401s must surface as a failed refresh, not re-enter the
    // interceptor and await its own in-flight promise.
    expect(refreshCalls).toBe(1);
  });
});
