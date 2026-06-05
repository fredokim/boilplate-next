import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";
import type { OpsConsoleDto } from "../dto/OpsConsole.dto";
import { OpsConsoleView } from "./OpsConsoleView";

const opsConsoleFixture: OpsConsoleDto = {
  metrics: [
    {
      id: "conversion",
      label: "Partner conversion",
      value: 34.8,
      unit: "%",
      status: "good",
    },
    {
      id: "latency",
      label: "API latency p95",
      value: 184,
      unit: "ms",
      status: "watch",
    },
  ],
  incidents: [
    {
      id: "inc-1",
      service: "Realtime monitor",
      severity: "good",
      message: "WebSocket heartbeat recovered after reconnect.",
      region: "Global",
      createdAt: "2026-06-03T08:14:00.000Z",
    },
  ],
  releases: [
    {
      id: "rel-1",
      version: "2026.06.03.1",
      environment: "production",
      status: "deployed",
      durationMs: 214000,
    },
  ],
};

describe("OpsConsoleView accessibility", () => {
  it("has no basic accessibility violations", async () => {
    const { container } = render(<OpsConsoleView data={opsConsoleFixture} />);

    const result = await axe(container);

    expect(result.violations).toHaveLength(0);
  });
});
