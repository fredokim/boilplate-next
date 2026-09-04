import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, proxyToBackend } from "@/core/api/backendProxy";
import { isServerBacked } from "@/core/config/backend";
import { createApiSuccess, dummySession } from "@/core/mock/dummyData";

/**
 * Captures the access token the backend issues and stores it in a cookie the
 * browser cannot read, so the page never holds it. The refresh token is already
 * a cookie; the proxy forwards that Set-Cookie untouched.
 */
async function captureAccessToken(response: NextResponse): Promise<NextResponse> {
  const clone = response.clone();
  const payload: unknown = await clone.json().catch(() => null);
  const token = (payload as { data?: { accessToken?: unknown } } | null)?.data?.accessToken;

  if (typeof token !== "string") return response;

  response.cookies.set(ACCESS_TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    // Deliberately a session cookie: the access token is short-lived and the
    // refresh cookie is what survives a restart.
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}

export async function POST(request: Request) {
  if (isServerBacked) return captureAccessToken(await proxyToBackend(request, "/api/auth/refresh"));

  return NextResponse.json(
    createApiSuccess({
      accessToken: "mock-access-token",
      user: dummySession.user,
    }),
  );
}
