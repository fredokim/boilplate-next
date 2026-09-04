import { NextResponse } from "next/server";
import { captureAccessToken, proxyToBackend } from "@/core/api/backendProxy";
import { isServerBacked } from "@/core/config/backend";
import { createApiSuccess, dummySession } from "@/core/mock/dummyData";

export async function POST(request: Request) {
  if (isServerBacked) return captureAccessToken(await proxyToBackend(request, "/api/auth/login"));

  return NextResponse.json(
    createApiSuccess({
      accessToken: "mock-access-token",
      user: dummySession.user,
    }),
  );
}
