"use client";

import { useCallback } from "react";
import { formatStableUtcDateTime, toStableIsoString, type DateInput } from "@/core/date/stableDate";
import { useHydrationSafeValue } from "./useHydrationSafeValue.client";

type HydratedDateOptions = {
  locale?: string | undefined;
  timeZone?: string | undefined;
  fallback?: string | undefined;
};

export function useHydratedDate(input: DateInput, options: HydratedDateOptions = {}) {
  const iso = toStableIsoString(input);
  const serverText = options.fallback ?? formatStableUtcDateTime(iso);

  const getClientText = useCallback(() => {
    return new Intl.DateTimeFormat(options.locale, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: options.timeZone,
    }).format(new Date(iso));
  }, [iso, options.locale, options.timeZone]);

  return {
    iso,
    text: useHydrationSafeValue(serverText, getClientText),
  };
}
