import { describe, expect, it } from "vitest";
import { opsDictionary } from "@/features/ops/i18n/opsDictionary";
import { assertDictionaryParity, formatLocalizedDate, formatLocalizedNumber, resolveLocale } from "./locale";

describe("locale utilities", () => {
  it("falls back for unsupported locales", () => {
    expect(resolveLocale(undefined)).toBe("ko");
    expect(resolveLocale("ja")).toBe("ko");
    expect(resolveLocale("en")).toBe("en");
  });

  it("formats numbers and dates through Intl", () => {
    expect(formatLocalizedNumber(1234567, "en")).toBe("1,234,567");
    expect(formatLocalizedDate("2026-06-03T00:00:00.000Z", "en")).toContain("2026");
  });

  it("keeps ops dictionary keys aligned across locales", () => {
    expect(assertDictionaryParity(opsDictionary, "ko")).toEqual([]);
  });
});
