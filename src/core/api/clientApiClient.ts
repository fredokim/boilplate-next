import { createApiEnvelopeDto } from "@/core/api/ApiEnvelope.dto";
import { TypedAppError } from "@/core/result/failure";
import { parseDto } from "@/core/validation/parseDto";

export type ClientRequest = {
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  url: string;
  params?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  signal?: AbortSignal;
};

function buildUrl({ params, url }: Pick<ClientRequest, "params" | "url">) {
  if (!params) return url;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `${url}?${query}` : url;
}

/**
 * Browser-side counterpart to serverApiClient. Route handlers under /api return the
 * same envelope shape, so both sides validate responses against the same DTOs and
 * fail with the same typed error rather than leaking fetch or class-validator details.
 */
export async function requestDto<TData extends object>(
  request: ClientRequest,
  DataDto: new () => TData,
): Promise<TData> {
  let response: Response;
  try {
    response = await fetch(buildUrl(request), {
      method: request.method,
      ...(request.body === undefined
        ? {}
        : { headers: { "content-type": "application/json" }, body: JSON.stringify(request.body) }),
      ...(request.signal ? { signal: request.signal } : {}),
    });
  } catch (error) {
    throw new TypedAppError({
      origin: "network",
      kind: "unknown",
      message: "The request could not reach the server.",
      details: error,
    });
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    throw new TypedAppError({
      origin: "backend",
      kind: response.ok ? "unknown" : "server",
      message: "The server did not return a JSON envelope.",
      status: response.status,
      details: error,
    });
  }

  const EnvelopeDto = createApiEnvelopeDto(DataDto);
  const envelope = await parseDto(EnvelopeDto, payload);

  if (!envelope.success || !envelope.data) {
    throw new TypedAppError({
      origin: "backend",
      kind: envelope.error?.code === "AUTH_REQUIRED" ? "unauthorized" : "unknown",
      message: envelope.error?.message ?? "Backend returned an unsuccessful response.",
      status: response.status,
      details: envelope.error,
    });
  }

  return envelope.data;
}
