import { NextResponse } from "next/server";
import { proxyToBackend } from "@/core/api/backendProxy";
import { isServerBacked } from "@/core/config/backend";
import { createApiError } from "@/core/mock/dummyData";

type RouteContext = {
  params: Promise<{ graphId: string }>;
};

/**
 * The topology snapshot the realtime controller seeds its store from.
 *
 * It was missing: the client called this path and nothing here answered, so it
 * 404'd locally rather than reaching the backend. The contract test found it —
 * everything looks local in this app, which is what makes the gap easy to miss.
 *
 * There is no dummy snapshot to fall back on. The mock realtime source builds
 * its own state in the browser and never asks for one, so mock mode does not
 * reach this handler at all; saying so is more honest than inventing a
 * fixture that nothing would exercise.
 */
export async function GET(request: Request, context: RouteContext) {
  const { graphId } = await context.params;

  if (isServerBacked) return proxyToBackend(request, `/api/graphs/${graphId}/topology/snapshot`);

  return NextResponse.json(
    createApiError("BACKEND_REQUIRED", "Topology snapshots come from the backend; set BACKEND_URL."),
    { status: 501 },
  );
}
