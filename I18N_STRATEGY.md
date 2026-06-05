# i18n Strategy

## Scope

The boilerplate uses a typed-dictionary approach for lightweight product surfaces such as `/ops-console`.

## Rules

- Keep dictionaries typed with `as const`.
- Provide a fallback locale for missing or unsupported locales.
- Format numbers and dates with `Intl` instead of string concatenation.
- Test dictionary key parity so one locale cannot silently miss text.
- Keep locale switching as client UI state unless the URL must be shareable.

## Current Example

- `src/features/ops/i18n/opsDictionary.ts`
- `src/core/i18n/locale.ts`
- `src/core/i18n/locale.test.ts`

## URL Locale Upgrade Path

Use route segments when locale must be shareable:

```txt
/ko/ops-console
/en/ops-console
```

Keep the server responsible for initial locale resolution, then pass the resolved locale into the client leaf for
interactive switching.

## Missing Translation Check

Every locale should expose the same keys as the fallback locale. The `assertDictionaryParity` helper catches missing or
extra keys in tests.
