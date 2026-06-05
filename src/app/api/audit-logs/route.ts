import { NextResponse } from "next/server";
import { createApiSuccess, dummyAuditLogs } from "@/core/mock/dummyData";

export function GET() {
  return NextResponse.json(
    createApiSuccess({
      items: dummyAuditLogs,
    }),
  );
}
