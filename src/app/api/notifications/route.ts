import { NextResponse } from "next/server";
import { createApiSuccess, dummyNotifications } from "@/core/mock/dummyData";

export function GET() {
  return NextResponse.json(
    createApiSuccess({
      items: dummyNotifications,
    }),
  );
}
