import { forwardRef, StrictMode, useImperativeHandle } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { networkGraph } from "../network/networkGraph";
import { createGraphRuntimeSource } from "../realtime/graphRuntimeSource";
import GraphViewerContainer from "./GraphViewerContainer";

// React Flow needs a real layout box, which jsdom does not provide. These assertions
// read the debug panel, so a stand-in canvas is enough.
vi.mock("../components/GraphCanvas", () => ({
  GraphCanvas: forwardRef(function MockGraphCanvas(_props: unknown, ref) {
    useImperativeHandle(ref, () => ({ fitAll: vi.fn(), focusNode: vi.fn(), focusRoute: vi.fn() }));
    return <div data-testid="graph-canvas" />;
  }),
}));

function debugValue(label: string) {
  return Number(screen.getByText(label).parentElement?.querySelector("dd")?.textContent ?? "");
}

describe("GraphViewerContainer realtime wiring", () => {
  it("connects, resyncs, and applies streamed events under StrictMode", async () => {
    render(
      <StrictMode>
        <GraphViewerContainer
          realtimeSource={createGraphRuntimeSource(networkGraph, { eventsPerSecond: 100 })}
        />
      </StrictMode>,
    );

    // StrictMode mounts, unmounts, and remounts the effect. The controller must end connected.
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Realtime: connected"), { timeout: 3000 });

    // The snapshot resync populates runtime state for every node and edge in the graph.
    await waitFor(() => expect(debugValue("runtimeStateCount")).toBe(networkGraph.nodes.length + networkGraph.edges.length), {
      timeout: 3000,
    });

    // Streamed deltas are buffered and flushed on the timer, not applied per event.
    await waitFor(() => expect(debugValue("eventsApplied")).toBeGreaterThan(0), { timeout: 3000 });
    expect(debugValue("flushCount")).toBeGreaterThan(0);
    expect(debugValue("unknownEntityIgnored")).toBe(0);
  });
});
