# AI Development Guide

## Rules

- Do not use `any` unless the exception is documented in the same PR.
- Default to server components. Add `"use client"` at the highest node that genuinely
  needs interactivity, not on every leaf, and name those files `*.client.tsx`.
- Keep UI in `views` and reusable atoms. Keep data loading, routing, auth, and mutation
  logic in server modules, server actions, or client containers.
- Add DTO classes for every backend response. Validate through `serverApiClient` on the
  server and `clientApiClient` in the browser; both check the same envelope and DTOs.
- Use the HOCs under `src/hoc/server` for auth and permission gates, and the ones under
  `src/hoc/client` for analytics and error boundaries.
- Never read `window`, `document`, or `localStorage` during render. Use
  `useHydrationSafeValue` or `useSyncExternalStore` with a server snapshot so the server
  markup and the first client render agree.
- Use CSS Modules (`*.module.scss`) with the design tokens in `src/styles/tokens`. This
  repo has no Tailwind; do not add utility classes.
- Use Zod schemas for user input validation. Keep DTO classes for API response validation.
- Keep observability behind adapters. Do not import analytics/error vendors directly in UI.
- Add Storybook stories and focused tests when generating new components or features.

## New Feature Pattern

1. Add `features/{name}/dto`.
2. Add `features/{name}/server` for server-only data access, or `actions` for mutations.
3. Add a route handler under `src/app/api/{name}` when the browser needs the data too.
4. Add props-only `views`.
5. Add a `*.client.tsx` container only where interactivity starts.
6. Add a `src/app/{route}/page.tsx` server component that renders it.
7. Add Storybook stories for pure UI.
8. Add mock registry entries and focused tests.

## State and Validation

- Server data: fetch in server components, or TanStack Query behind a client boundary.
- Global UI/session state: Zustand.
- Form state: local state or server actions with `useActionState`.
- User input validation: Zod.
- API response validation: class-validator DTOs.

## Error Ownership

- DTO mismatch means frontend contract error (`origin: frontend-contract`).
- HTTP status or backend error envelope means backend error (`origin: backend`).
- A request that never reaches the server means network error (`origin: network`).

## Framework Version

This repo tracks a Next.js release whose APIs may differ from what a model has
memorised. Read the relevant guide under `node_modules/next/dist/docs/` before writing
routing, caching, or rendering code. See `AGENTS.md`.

## AI Workflow Docs

- `AI_WORKFLOW.md`: what AI drafts and what the developer owns.
- `PROMPT_PLAYBOOK.md`: reusable prompts for feature work, review, testing, and refactoring.
- `CODE_REVIEW_CHECKLIST.md`: senior review checklist for AI-generated code.
- `AI_REFACTORING_CASE_STUDY.md`: before/after refactoring guidance.
- `PERFORMANCE_REPORT.md`: performance guardrails and commands.
- `I18N_STRATEGY.md`: locale ownership, fallback, and formatting rules.
- `BOUNDARY_GUIDE.md`: where the server/client boundary belongs.
