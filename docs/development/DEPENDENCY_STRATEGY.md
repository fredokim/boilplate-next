# Dependency Strategy

This boilerplate follows the Next.js App Router model first, then adds dependencies only where framework primitives are not enough.

## Keep

- `next`: primary application framework and bundler pipeline.
- React Server Components and Server Actions: preferred for server-owned data and mutations.
- `@tanstack/react-query`: client-side server state where interactive client components need cache and refetch behavior.
- `zustand`: small client/session UI state.
- `class-validator`, `class-transformer`, `reflect-metadata`: retained for decorator DTO runtime validation.
- `zod`: Server Action form validation and local state validation.
- `msw`: mock API scenarios for local, test, and Storybook workflows.

## Avoid

- Adding Vite as an app bundler. Storybook may use Vite, but the app should stay on the Next build pipeline.
- Adding a client form engine when Server Actions plus schema-inferred view props are enough.
- Adding vendor SDKs directly to components. Use analytics, logging, error, and performance adapters.
- Adding client-only data libraries for server-owned routes.
- Adding date libraries for basic formatting, ranges, relative labels, or hydration-safe text. Use `src/core/date/stableDate.ts` first.

## Replace Later

- Decorator DTO validation can move to schema-first validation only if generated contracts, API parsing, and error ownership move together.
- Client-side query usage can be reduced where RSC/server data ownership is enough.
- Tailwind or CSS module strategy should be migrated deliberately, not mixed with App Router boundary work.

## Documented Size Exceptions

`check:deps` fails a runtime dependency over 6MB installed unless it is listed as an
exception in `scripts/check-dependency-size.ts` **and** named here. Listing it in only
one place fails the check, so an exception cannot be granted quietly.

### `hls.js`

- **Installed:** ~31MB, almost all of it source maps and the several prebuilt variants.
- **Shipped:** ~111KB gzip (~352KB raw), from the `hls.js/light` build, in its own
  lazily loaded chunk. It is the largest chunk in the app and still inside the 150KB
  gzip budget.
- **Why:** HLS playback needs Media Source Extensions driven by a library on every
  browser except Safari and iOS, which play HLS natively. The player selects the native
  path first and only imports hls.js when the platform cannot play the stream itself, so
  a Safari visitor downloads none of it.
- **Lighter alternative considered:** the full build (~603KB raw) was rejected for the
  light build, which keeps low-latency part loading and drops subtitle rendering,
  alternate audio switching, and EME — none of which this player surfaces.
- **Revisit when:** the player needs subtitles, multiple audio tracks, or DRM, or when
  `ManagedMediaSource` support is broad enough that native playback covers everything.

## Review Checklist

- Run `npm run check:deps` before adding a runtime dependency.
- Runtime dependencies above 6MB installed size need a written reason or a lighter alternative.
- Does this package run on the server, client, test, Storybook, or generator side?
- Can Next.js already do this with a built-in primitive?
- Does the package force a `"use client"` boundary?
- Can the import stay behind a lazy route, adapter, or server-only module?
- Does CI catch type, test, build, Storybook, and bundle impact?
