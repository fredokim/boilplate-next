import { NextResponse } from "next/server";
import { createApiSuccess, dummySession } from "@/core/mock/dummyData";

export function GET() {
  return NextResponse.json(createApiSuccess(dummySession));
}
