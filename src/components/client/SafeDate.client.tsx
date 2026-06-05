"use client";

import { useHydratedDate } from "@/hooks/useHydratedDate.client";
import type { DateInput } from "@/core/date/stableDate";

type SafeDateProps = {
  value: DateInput;
  locale?: string;
  timeZone?: string;
  fallback?: string;
};

export function SafeDate({ fallback, locale, timeZone, value }: SafeDateProps) {
  const date = useHydratedDate(value, {
    fallback,
    locale,
    timeZone,
  });

  return <time dateTime={date.iso}>{date.text}</time>;
}
