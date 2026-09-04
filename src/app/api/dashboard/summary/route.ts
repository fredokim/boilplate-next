import { NextResponse } from "next/server";
import { proxyToBackend } from "@/core/api/backendProxy";
import { isServerBacked } from "@/core/config/backend";

import { createApiSuccess, dummyDashboardSummary } from "@/core/mock/dummyData";

export function GET(request: Request) {
  if (isServerBacked) return proxyToBackend(request, "/api/dashboard/summary");

  return NextResponse.json(createApiSuccess(dummyDashboardSummary));
}
