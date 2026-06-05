export type SupportedLocale = "ko" | "en";

export const fallbackLocale: SupportedLocale = "ko";

export function resolveLocale(locale: string | undefined, supportedLocales: readonly SupportedLocale[] = ["ko", "en"]) {
  if (!locale) {
    return fallbackLocale;
  }

  return supportedLocales.includes(locale as SupportedLocale) ? (locale as SupportedLocale) : fallbackLocale;
}

export function formatLocalizedNumber(value: number, locale: SupportedLocale) {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatLocalizedDate(value: string | Date, locale: SupportedLocale) {
  const date = typeof value === "string" ? new Date(value) : value;

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}

export function assertDictionaryParity<TDictionary extends Record<string, Record<string, string>>>(
  dictionary: TDictionary,
  baseLocale: keyof TDictionary,
) {
  const baseKeys = Object.keys(dictionary[baseLocale] ?? {}).sort();

  return Object.entries(dictionary).flatMap(([locale, messages]) => {
    const keys = Object.keys(messages).sort();
    const missing = baseKeys.filter((key) => !keys.includes(key));
    const extra = keys.filter((key) => !baseKeys.includes(key));

    return [
      ...missing.map((key) => `${locale} missing ${key}`),
      ...extra.map((key) => `${locale} has extra ${key}`),
    ];
  });
}
