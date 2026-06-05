import { describe, expect, it } from "vitest";
import { filterOpsRows, getStatusLabel, type OpsTableRow } from "./opsTable.logic";

const rows: OpsTableRow[] = [
  {
    id: "ops-1",
    service: "Merchant admin",
    owner: "Platform",
    status: "good",
    latencyMs: 120,
  },
  {
    id: "ops-2",
    service: "WebView bridge",
    owner: "Mobile",
    status: "risk",
    latencyMs: 420,
  },
];

describe("opsTable logic", () => {
  it("filters by service, owner, or status", () => {
    expect(filterOpsRows(rows, "mobile")).toEqual([rows[1]]);
    expect(filterOpsRows(rows, "merchant")).toEqual([rows[0]]);
    expect(filterOpsRows(rows, "risk")).toEqual([rows[1]]);
  });

  it("returns the original rows for empty queries", () => {
    expect(filterOpsRows(rows, " ")).toBe(rows);
  });

  it("maps status to stable product labels", () => {
    expect(getStatusLabel("good")).toBe("Healthy");
    expect(getStatusLabel("watch")).toBe("Needs review");
    expect(getStatusLabel("risk")).toBe("Action required");
  });
});
