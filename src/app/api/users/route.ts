import { NextResponse } from "next/server";
import { createApiSuccess, dummyUsers } from "@/core/mock/dummyData";

export function GET() {
  return NextResponse.json(
    createApiSuccess({
      items: dummyUsers,
    }),
  );
}
