import { NextResponse } from "next/server";
import { createApiSuccess, dummyAuditLogs } from "@/core/mock/dummyData";

/**
 * Mock only. The shared backend does not publish this endpoint, so there is
 * nothing to forward to — it stays dummy data rather than becoming a call that
 * would 404. That is a gap in the backend, not an oversight here.
 */
export function GET() {
  return NextResponse.json(
    createApiSuccess({
      items: dummyAuditLogs,
    }),
  );
}
