import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createApiSuccess, dummyDashboardActiveUsers, dummyDashboardKpi } from "@/core/mock/dummyData";

export function GET(request: NextRequest) {
  const metric = request.nextUrl.searchParams.get("metric");
  return NextResponse.json(createApiSuccess(metric === "active-users" ? dummyDashboardActiveUsers : dummyDashboardKpi));
}
