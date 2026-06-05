import { NextResponse } from "next/server";
import { createApiError, createApiSuccess, dummyUsers } from "@/core/mock/dummyData";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const user = dummyUsers.find((item) => item.id === id);

  if (!user) {
    return NextResponse.json(createApiError("USER_NOT_FOUND", "User not found."), { status: 404 });
  }

  return NextResponse.json(createApiSuccess(user));
}
