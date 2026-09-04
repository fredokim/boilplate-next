import { NextResponse } from "next/server";
import { proxyToBackend } from "@/core/api/backendProxy";
import { isServerBacked } from "@/core/config/backend";
import { createApiSuccess, dummySession } from "@/core/mock/dummyData";

/**
 * One handler, two modes. Without BACKEND_URL this answers from dummy data
 * exactly as it did before there was a backend, so a checkout with no server
 * still runs.
 */
export function GET(request: Request) {
  if (isServerBacked) return proxyToBackend(request, "/api/auth/session");

  return NextResponse.json(createApiSuccess(dummySession));
}
