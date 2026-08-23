import { NextResponse } from "next/server";
import { createApiSuccess, dummyDashboardTable } from "@/core/mock/dummyData";

export function GET() {
  return NextResponse.json(createApiSuccess(dummyDashboardTable));
}
