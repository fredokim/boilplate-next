import { NextResponse } from "next/server";
import { proxyToBackend } from "@/core/api/backendProxy";
import { isServerBacked } from "@/core/config/backend";

import type { NextRequest } from "next/server";
import { createApiSuccess, dummyDashboardConversionSeries, dummyDashboardSeries } from "@/core/mock/dummyData";

export function GET(request: NextRequest) {
  if (isServerBacked) return proxyToBackend(request, "/api/dashboard/chart");

  const metric = request.nextUrl.searchParams.get("metric");
  return NextResponse.json(
    createApiSuccess(metric === "conversion" ? dummyDashboardConversionSeries : dummyDashboardSeries),
  );
}
