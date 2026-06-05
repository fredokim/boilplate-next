export type FailureOrigin = "frontend-contract" | "backend" | "network" | "auth" | "unknown";
export type FailureKind = "validation" | "unauthorized" | "forbidden" | "not-found" | "server" | "unknown";

export type AppFailure = {
  origin: FailureOrigin;
  kind: FailureKind;
  message: string;
  status?: number | undefined;
  details?: unknown;
};

export class TypedAppError extends Error {
  readonly failure: AppFailure;

  constructor(failure: AppFailure) {
    super(failure.message);
    this.name = "TypedAppError";
    this.failure = failure;
  }
}

export function toFailure(error: unknown): AppFailure {
  if (error instanceof TypedAppError) {
    return error.failure;
  }

  if (error instanceof Error) {
    return {
      origin: "unknown",
      kind: "unknown",
      message: error.message,
    };
  }

  return {
    origin: "unknown",
    kind: "unknown",
    message: "Unknown error",
    details: error,
  };
}
