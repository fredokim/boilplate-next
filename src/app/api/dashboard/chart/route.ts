import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createApiSuccess, dummyDashboardConversionSeries, dummyDashboardSeries } from "@/core/mock/dummyData";

export function GET(request: NextRequest) {
  const metric = request.nextUrl.searchParams.get("metric");
  return NextResponse.json(
    createApiSuccess(metric === "conversion" ? dummyDashboardConversionSeries : dummyDashboardSeries),
  );
}
