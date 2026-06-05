import { NextResponse } from "next/server";
import { createApiSuccess, dummyDashboardSummary } from "@/core/mock/dummyData";

export function GET() {
  return NextResponse.json(createApiSuccess(dummyDashboardSummary));
}
