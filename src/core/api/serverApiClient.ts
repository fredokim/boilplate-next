import "server-only";
import { createApiEnvelopeDto } from "@/core/api/ApiEnvelope.dto";
import { performanceReporter } from "@/core/observability/performanceReporter";
import { TypedAppError } from "@/core/result/failure";
import { parseDto } from "@/core/validation/parseDto";

export async function parseApiEnvelope<TData extends object>(
  payload: unknown,
  DataDto: new () => TData,
): Promise<TData> {
  const startedAt = performance.now();
  const EnvelopeDto = createApiEnvelopeDto(DataDto);
  const envelope = await parseDto(EnvelopeDto, payload);
  performanceReporter.timing({
    name: "api.parse-envelope",
    durationMs: performance.now() - startedAt,
  });

  if (!envelope.success || !envelope.data) {
    throw new TypedAppError({
      origin: "backend",
      kind: envelope.error?.code === "AUTH_REQUIRED" ? "unauthorized" : "unknown",
      message: envelope.error?.message ?? "Backend returned an unsuccessful response.",
      details: envelope.error,
    });
  }

  return envelope.data;
}
