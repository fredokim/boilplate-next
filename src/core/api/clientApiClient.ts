import { createApiEnvelopeDto } from "@/core/api/ApiEnvelope.dto";
import { TypedAppError } from "@/core/result/failure";
import { parseDto } from "@/core/validation/parseDto";
import { RefreshSingleFlight } from "./refreshSingleFlight";
import { ASLEEP_STATUS, serverWakeGate } from "./serverWake";

/**
 * Exchanges the refresh cookie for a new access token, or returns null.
 *
 * The refresh goes to this app's own /api/auth/refresh, which forwards it — the
 * browser never reaches the backend directly, so the sameSite cookie travels.
 *
 * Single-flighted, and that is not an optimisation. The backend rotates refresh
 * tokens and reads a re-presented one as a replay, so five requests each
 * calling refresh would have the first rotate the token and the other four
 * present a spent one, which the server answers by revoking the whole session
 * family. Parallel refreshes sign the user out.
 */
const refreshRunner = new RefreshSingleFlight(async () => {
  const response = await fetch("/api/auth/refresh", { method: "POST" });

  if (!response.ok) return null;

  const payload: unknown = await response.json().catch(() => null);
  const token = (payload as { data?: { accessToken?: unknown } } | null)?.data?.accessToken;

  return typeof token === "string" ? token : null;
});

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
  return attempt(request, DataDto, false);
}

/**
 * One retry, and only after a refresh that produced a token. `retried` is what
 * stops a revoked session from looping: refresh, 401, refresh, until the tab
 * closes.
 */
async function attempt<TData extends object>(
  request: ClientRequest,
  DataDto: new () => TData,
  retried: boolean,
): Promise<TData> {
  // Free of charge unless the server is known to be asleep, in which case this
  // waits for the one probe rather than adding another request to a pile the
  // platform is already refusing.
  await serverWakeGate.wait();

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

  if (response.status === 401 && !retried && !request.url.startsWith("/auth/refresh")) {
    const token = await refreshRunner.run();

    if (token !== null) return attempt(request, DataDto, true);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    // A 429 with no envelope did not come from the API. This app's own 429s --
    // the login throttle and the chat rate limit -- are JSON like every other
    // answer, so a body that will not parse means the host refused to wake a
    // sleeping instance.
    if (response.status === ASLEEP_STATUS) {
      serverWakeGate.reportAsleep();

      throw new TypedAppError({
        origin: "network",
        kind: "waking",
        message: "The server was idle and is starting.",
        status: response.status,
        details: error,
      });
    }

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
