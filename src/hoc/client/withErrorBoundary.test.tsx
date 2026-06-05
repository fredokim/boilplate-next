import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { setErrorReporterAdapter } from "@/core/observability/errorReporter";
import { withErrorBoundary } from "./withErrorBoundary.client";

function BrokenComponent() {
  throw new Error("Exploded during render");
  return null;
}

const WrappedBrokenComponent = withErrorBoundary(BrokenComponent);

describe("withErrorBoundary", () => {
  afterEach(() => {
    setErrorReporterAdapter({ capture: () => undefined });
    vi.restoreAllMocks();
  });

  it("reports render errors through the observability adapter", () => {
    const capture = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    setErrorReporterAdapter({ capture });

    render(<WrappedBrokenComponent />);

    expect(screen.getByText("Client render failed")).toBeInTheDocument();
    expect(capture).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.any(Error),
        context: expect.objectContaining({
          boundary: "client",
        }),
      }),
    );
  });
});
