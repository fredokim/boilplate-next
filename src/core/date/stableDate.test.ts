import { describe, expect, it } from "vitest";
import {
  addDays,
  createDateRange,
  diffInCalendarDays,
  formatDateOnly,
  formatRelativeTime,
  formatStableUtcDateTime,
  isSameDay,
  isValidDateInput,
  isWithinDateRange,
  parseDateOnly,
  toStableIsoString,
} from "./stableDate";

describe("stableDate", () => {
  it("serializes dates to stable ISO strings", () => {
    expect(toStableIsoString(new Date("2026-05-31T10:20:30.000Z"))).toBe("2026-05-31T10:20:30.000Z");
  });

  it("formats with UTC so server output is deterministic", () => {
    expect(formatStableUtcDateTime("2026-05-31T10:20:30.000Z")).toContain("2026");
  });

  it("rejects invalid date input", () => {
    expect(isValidDateInput("not-a-date")).toBe(false);
    expect(() => toStableIsoString("not-a-date")).toThrow("Invalid date input.");
    expect(() => parseDateOnly("2026-02-31")).toThrow("Invalid date-only input.");
  });

  it("handles date-only strings and date ranges", () => {
    const range = createDateRange("2026-05-01T12:00:00.000Z", "2026-05-03T12:00:00.000Z");

    expect(formatDateOnly("2026-05-31T10:20:30.000Z")).toBe("2026-05-31");
    expect(parseDateOnly("2026-05-31").toISOString()).toBe("2026-05-31T00:00:00.000Z");
    expect(isWithinDateRange("2026-05-02T00:00:00.000Z", range)).toBe(true);
    expect(isSameDay("2026-05-02T01:00:00.000Z", "2026-05-02T10:00:00.000Z")).toBe(true);
    expect(diffInCalendarDays(addDays("2026-05-02T00:00:00.000Z", 2), "2026-05-02T00:00:00.000Z")).toBe(2);
    expect(formatRelativeTime("2026-05-03T00:00:00.000Z", "2026-05-02T00:00:00.000Z", "en")).toBe("tomorrow");
  });
});
