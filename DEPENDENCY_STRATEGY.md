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

## Review Checklist

- Run `npm run check:deps` before adding a runtime dependency.
- Runtime dependencies above 6MB installed size need a written reason or a lighter alternative.
- Does this package run on the server, client, test, Storybook, or generator side?
- Can Next.js already do this with a built-in primitive?
- Does the package force a `"use client"` boundary?
- Can the import stay behind a lazy route, adapter, or server-only module?
- Does CI catch type, test, build, Storybook, and bundle impact?
