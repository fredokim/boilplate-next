import { NextResponse } from "next/server";
import { createApiSuccess, dummySession } from "@/core/mock/dummyData";

export async function POST() {
  return NextResponse.json(
    createApiSuccess({
      accessToken: "mock-access-token",
      user: dummySession.user,
    }),
  );
}
