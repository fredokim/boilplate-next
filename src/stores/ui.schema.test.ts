import { describe, expect, it } from "vitest";
import { parseState } from "@/core/state/validateState";
import { uiStateSnapshotSchema, type UiStateSnapshot } from "./ui.schema";

describe("ui state schema", () => {
  it("parses valid UI state snapshots", () => {
    const state: UiStateSnapshot = parseState(uiStateSnapshotSchema, { sidebarOpen: true }, "ui.snapshot.test");

    expect(state.sidebarOpen).toBe(true);
  });

  it("rejects invalid UI state snapshots", () => {
    expect(() => parseState(uiStateSnapshotSchema, { sidebarOpen: "yes" }, "ui.snapshot.test")).toThrow();
  });
});
