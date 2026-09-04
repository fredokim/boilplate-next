import { NextResponse } from "next/server";
import { proxyToBackend } from "@/core/api/backendProxy";
import { isServerBacked } from "@/core/config/backend";

import { createApiSuccess, dummyUsers } from "@/core/mock/dummyData";

export function GET(request: Request) {
  if (isServerBacked) return proxyToBackend(request, "/api/users");

  return NextResponse.json(
    createApiSuccess({
      items: dummyUsers,
    }),
  );
}
