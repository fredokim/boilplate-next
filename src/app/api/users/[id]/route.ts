import { NextResponse } from "next/server";
import { proxyToBackend } from "@/core/api/backendProxy";
import { isServerBacked } from "@/core/config/backend";
import { createApiError, createApiSuccess, dummyUsers } from "@/core/mock/dummyData";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (isServerBacked) return proxyToBackend(request, `/api/users/${id}`);

  const user = dummyUsers.find((item) => item.id === id);

  if (!user) {
    return NextResponse.json(createApiError("USER_NOT_FOUND", "User not found."), { status: 404 });
  }

  return NextResponse.json(createApiSuccess(user));
}
