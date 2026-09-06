# Design Rationale

This document explains the problem definition, component design method, key decisions, results, and retrospective behind the Next.js boilerplate.

## Problem Definition

The boilerplate was designed around repeated frontend problems that appear after a project grows beyond the first few screens.

- TypeScript types do not validate real API payloads at runtime.
- Server state, client cache, URL state, and local UI state are often mixed in one component.
- Page components tend to own data fetching, filtering, label conversion, event handling, and rendering at the same time.
- Loading, empty, and error states are implemented differently per screen.
- Storybook, MSW, tests, and CI checks are often added late, after UI patterns have already diverged.
- In Next.js, unnecessary Client Component boundaries can increase hydration risk and client bundle size.

The goal was not to create another starter template. The goal was to document repeatable frontend decisions so that new features can be added with stable boundaries.

## Component Design Method

Components are split by responsibility, not only by visual size.

| Layer | Responsibility |
| --- | --- |
| App Route | Routing, layout, loading/error boundaries, route handlers |
| Server Module | Server-only data access, session checks, DTO validation |
| Server Action | Mutation boundary for forms, cookies, and server-side changes |
| Client Wrapper | Browser events, effects, local UI state, TanStack Query refresh |
| View | Props-only rendering, Storybook-friendly UI |
| UI Component | Reusable controls such as Button, Card, DataTable, Modal, Toast |
| DTO/Contract | API envelope parsing, runtime validation, typed data boundary |

Reference pattern:

```txt
src/features/example/
  server/
    example.server.ts
  actions/
    example.actions.ts
  dto/
    Example.dto.ts
  components/
    Example.client.tsx
  views/
    ExampleView.tsx
```

The intent is to keep each file aligned with one reason to change. UI changes should not require editing API contracts, and server data changes should not force client UI state to move.

## Key Decisions

### 1. Use server-first rendering as the default

Initial data and stable UI should render through Server Components. Client Components are reserved for browser APIs, user interaction, local UI state, TanStack Query refresh, analytics, and error boundaries.

Why:

- Reduce unnecessary client JavaScript.
- Make hydration behavior easier to reason about.
- Keep auth/session checks near the server boundary.

### 2. Validate API payloads before rendering UI

API responses pass through an envelope and DTO validation before they reach views.

Why:

- TypeScript cannot protect against runtime contract drift.
- DTO failures can be separated from HTTP/network failures.
- Views can receive typed data instead of defensive optional chains everywhere.

### 3. Split state by ownership

The boilerplate uses ownership rules instead of one universal state library.

- Server baseline: Server Component or server function
- Interactive server cache: TanStack Query
- Shareable filters: URL `searchParams`
- Client UI state: Zustand or local state
- Mutations: Server Actions
- Auth source of truth: httpOnly cookie and server session

Why:

- Reloads, bookmarks, and back navigation stay predictable.
- Server data and UI convenience state do not become tangled.
- Global state stays intentionally small.

### 4. Prefer CSS Modules and CSS variables over styled-components

The default styling path is CSS Modules, SCSS Modules, and CSS variables.

Why:

- Keep Server Component and hydration boundaries simpler.
- Avoid making runtime styling a default dependency.
- Keep design tokens framework-light and portable.

### 5. Include Storybook, MSW, and automation from the beginning

The boilerplate treats UI documentation, mock API states, and verification commands as part of the architecture.

Why:

- Loading, empty, error, and success states can be reviewed early.
- Backend-independent UI work is possible through MSW.
- `check:automation`, `check:bundle`, and `check:ci` keep quality criteria repeatable.

## Results

- Explicit Server/Client Component boundary rules.
- Runtime DTO validation before UI rendering.
- Typed state ownership strategy for server data, client cache, URL state, and UI state.
- Storybook-ready UI components and state examples.
- CI-friendly commands for lint, typecheck, tests, build, Storybook build, dependency review, and bundle budgets.
- Portfolio proof surface through `/ops-console`.

## Retrospective

What worked:

- The server-first rule prevents many ambiguous Next.js boundary decisions.
- DTO validation makes API failures easier to classify.
- View/client/server splits make components easier to test and explain.
- Storybook and MSW make UI states visible before backend integration is complete.

Trade-offs:

- The structure has an initial cost and can feel heavy for a small MVP.
- DTO validation and Storybook coverage require discipline to keep updated.
- Strict boundaries work best when generators and review checklists are used consistently.

Next improvements:

- Split templates into lightweight, standard, and strict modes.
- Add design-token generation from a single token source.
- Expand auth, permission, feature flag, and observability examples.
- Add more accessibility and E2E examples around complex flows.
