import { describe, expect, it, vi } from "vitest";
import { errorReporter, setErrorReporterAdapter } from "./errorReporter";

describe("errorReporter", () => {
  it("delegates captured errors to the configured adapter", () => {
    const capture = vi.fn();
    const error = new Error("adapter check");
    setErrorReporterAdapter({ capture });

    errorReporter.capture({
      error,
      context: {
        feature: "ops-console",
      },
    });

    expect(capture).toHaveBeenCalledWith({
      error,
      context: {
        feature: "ops-console",
      },
    });

    setErrorReporterAdapter({ capture: () => undefined });
  });
});
