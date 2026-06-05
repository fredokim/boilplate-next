# Next Boilerplate Architecture

## Boundaries

- `src/app`: App Router pages, layouts, loading, error, and route handlers.
- `src/features/*/server`: server-only data and session logic.
- `src/features/*/actions`: Server Actions and form mutation boundaries.
- `src/features/*/components`: feature UI, split into pure views and client wrappers when needed.
- `src/components/ui`: reusable server-safe UI by default.
- `src/components/client`: explicit client-only utilities.
- `src/hoc/server`: auth and permission checks.
- `src/hoc/client`: analytics and error boundary wrappers.

## Server/Client Rules

- Server Component is the default.
- Add `"use client"` only for events, effects, browser APIs, Zustand, TanStack Query, or Storybook interaction demos.
- Keep Server Actions outside pure UI views.
- Split components like `LoginFormView` from `LoginForm.client.tsx` when Storybook should render UI without a server action.

## UI Rules

- Use CSS Modules and design tokens.
- Do not use styled-components by default.
- Add Storybook stories for atomic controls and stateful UI examples.
- Common UI includes button, card, select, checkbox, radio group, modal, tabs, toast, table, pagination, loading, and error states.

## Data Rules

- Validate server data with DTOs before rendering.
- Validate form input with Zod at the Server Action boundary.
- Use TanStack Query only for interactive client refetch/cache needs.
- Use Zustand only for client UI state.
