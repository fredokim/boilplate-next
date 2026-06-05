# Next Boundary Guide

## Component Rules

- Server Component is the default.
- Add `"use client"` only for events, effects, browser APIs, Zustand, or TanStack Query interaction.
- Do not import `*.server.ts` from client components.
- Keep auth and permission checks in server HOCs or middleware-like server functions.
- Keep analytics and error boundary HOCs in `*.client.tsx`.
- Use CSS Modules, SCSS Modules, and CSS variables. Do not use styled-components by default.

## File Naming

- `*.client.tsx`: browser boundary
- `*.server.ts`: server-only data or session logic
- `*.actions.ts`: Server Actions
- `*.dto.ts`: runtime API contracts
- `*.module.scss`: scoped component or page style

## Hydration Safety

- Do not render `Date.now()`, `Math.random()`, `window`, or `localStorage` values in Server Components.
- Pass only serializable data from Server Components to Client Components.
- Use cookies for initial theme/session values when server and client must agree.
- Use TanStack Query for interactive client refreshes, not for all initial server-rendered data.
- For dates, render stable UTC/ISO values on the server and localize only after hydration with `useHydratedDate` or `SafeDate`.

## State Management Strategy

| State type | Tool | Boundary |
| --- | --- | --- |
| Initial route data | Server Component / server function | Server |
| Interactive refetch/cache | TanStack Query | Client |
| Global UI state | Zustand | Client |
| Auth/session source | httpOnly cookie + server session | Server |
| Mutations | Server Action | Server |
| Local form input | `useState`, `useActionState`, native form | Client or Server Action |
| Filter/page/sort state | `searchParams` | URL |

Do not move data into TanStack Query only because it comes from an API. In Next App Router, server-rendered route data should stay server-first unless the UI needs client-side refetching, optimistic updates, polling, infinite scroll, or interactive filters.

## Form and Mutation Rules

- Use Zod schemas for user input.
- Validate form payloads in Server Actions.
- Return serializable field errors to client forms.
- Do not mutate cookies or server resources from client components directly.

## Observability Rules

- Keep logger, analytics, error reporting, and performance reporting behind adapters.
- Do not import vendor SDKs directly inside UI components.
- Report API parsing and Server Action timings through the observability layer when needed.

## Testing Rules

- Unit and DTO contract tests run with Vitest.
- Accessibility tests use `vitest-axe`.
- E2E smoke tests use Playwright for home, protected redirects, and health routes.
