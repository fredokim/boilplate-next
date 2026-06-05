# Next Architecture Boilerplate

Server-first Next.js boilerplate with explicit Server/Client Component boundaries, runtime DTO validation, and scoped styling without styled-components.

## Core Principles

- Server Components are the default.
- Client Components are isolated to leaf interaction components.
- Auth and permission checks run on the server first.
- Analytics, browser APIs, local UI state, and error boundaries stay behind explicit client boundaries.
- DTO validation happens before data reaches UI.
- CSS Modules, SCSS Modules, and CSS variables are used instead of styled-components.
- Dates are handled by internal utilities in `src/core/date/stableDate.ts`; stable UTC/ISO values render on the server and local text appears after hydration.
- Forms are validated with Zod at the Server Action boundary.
- Observability is adapter-based, so GA, Sentry, Datadog, or custom logging can be attached later.

## State Management Strategy

State is split by ownership instead of being forced into one library.

| State type | Tool | Reason |
| --- | --- | --- |
| Initial server data | Server Component / server function | Uses App Router rendering and reduces client JavaScript |
| Client-side server data refresh | TanStack Query | Handles interactive refetch, filters, pagination, and optimistic updates |
| Global UI state | Zustand | Small client state such as sidebar, modal, drawer, toast, selected tab |
| Auth source of truth | httpOnly cookie + server session | Keeps session checks secure and server-first |
| Mutations | Server Actions | Runs form submission, cookie updates, and server-side changes near the server |
| Local form state | `useState`, `useActionState`, or native form action | Avoids unnecessary global state |
| Shareable filter state | URL `searchParams` | Keeps filters/bookmarks/reloads stable |

Default rule:

```txt
Server data baseline = Server Component
Interactive cache/refetch = TanStack Query
Client UI state = Zustand
Mutation = Server Action
Auth/session source = cookie + server session
```

## Runtime Boundaries

```txt
app/page.tsx                  # Server Component by default
src/features/*/server         # server-only data/session logic
src/features/*/actions        # Server Actions
src/components/client         # explicit "use client" components
src/hoc/server                # server auth/permission wrappers
src/hoc/client                # analytics/error boundary wrappers
src/stores                    # Zustand client stores
```

## Hydration Safety

- Do not render `Date.now()`, `Math.random()`, `window`, or `localStorage` values in Server Components.
- Use `SafeDate` or `useHydratedDate` for date/time UI.
- Pass only serializable data from Server Components to Client Components.
- Use cookies for initial theme/session values when server and client must agree.

## Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
npm run storybook
npm run e2e
npm run check:automation
npm run check:deps
npm run check:bundle
npm run generate -- feature user
npm run generate -- page orders list
npm run check:ci
```

## Generator

```bash
npm run generate -- feature user
npm run generate -- component DataTable
npm run generate -- contract product
npm run generate -- form product
npm run generate -- layout admin-shell
npm run generate -- page orders list
npm run generate -- dto User
npm run generate -- route settings
npm run generate -- action auth
```

The generator creates files that follow the boilerplate boundaries: `server`, `actions`, `dto`, `views`, client components, stories, scoped styles, and focused component tests. The `contract` generator creates DTO, form schema, state schema, mock data, and validation test files. The `form` generator creates a schema-inferred form view with stories and a render test. The `layout` and `page` generators create reusable page shells, App Router pages, stories, and page specs.

`check:automation` enforces Storybook coverage, validation coverage, and mock registry presence. `check:deps` flags oversized runtime packages. `check:bundle` fails CI when built chunks exceed the configured budget.

## Common UI

Storybook-ready components include button, card, select, checkbox, radio group, modal, tabs, toast, data table, pagination, loading state, error state, and hydration-safe date display.

## Portfolio Proof Surface

`/ops-console` is a hiring-signal demo for senior frontend roles. It shows a server-validated B2B operations dashboard with i18n, live client-side event updates, deployment status, performance metrics, and reusable table/card UI.

| Job signal | Where it is demonstrated |
| --- | --- |
| Next.js App Router + TypeScript | `src/app/ops-console/page.tsx`, `src/features/ops/views/OpsConsoleView.tsx` |
| DTO/runtime API contract validation | `src/features/ops/dto/OpsConsole.dto.ts`, `src/features/ops/server/opsConsole.server.ts` |
| i18n | `src/features/ops/i18n/opsDictionary.ts`, `OpsLocaleSwitcher.client.tsx` |
| Realtime/WebSocket-shaped UI | `LiveIncidentFeed.client.tsx` |
| Ops/monitoring mindset | Sentry-shaped incidents, Core Web Vitals metric, release pipeline, error-rate metric |
| Design-system reuse | Existing `Card`, `Button`, and `DataTable` components |

## AI-Assisted Engineering Proof

The repository includes workflow artifacts that show how AI can be used with senior engineering guardrails:

| Artifact | Purpose |
| --- | --- |
| `AI_WORKFLOW.md` | Defines what AI drafts and what the developer owns |
| `PROMPT_PLAYBOOK.md` | Reusable implementation, review, refactoring, and testing prompts |
| `CODE_REVIEW_CHECKLIST.md` | Review checklist for AI-generated frontend code |
| `AI_REFACTORING_CASE_STUDY.md` | Before/after refactoring case study with prompts and human decisions |
| `PERFORMANCE_REPORT.md` | Performance guardrails for App Router and `/ops-console` |
| `I18N_STRATEGY.md` | Typed dictionary, fallback locale, and formatting strategy |
| `AI_CHANGELOG.md` | Log of AI-assisted additions and verification |

## Mock APIs

Dummy data lives in `src/core/mock/dummyData.ts` and powers both server-side demo data and route handlers:

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/auth/session`
- `GET /api/users`
- `GET /api/users/:id`
- `GET /api/users/count`
- `GET /api/dashboard/summary`
- `GET /api/notifications`
- `GET /api/audit-logs`

The mock shape follows the standard API envelope: `{ success, data }` or `{ success, error }`.

## Form Validation

- Use Zod schemas for user input.
- Validate in Server Actions before changing cookies, DB, or external APIs.
- Convert schema errors to field errors with `toFieldErrors`.

## Observability

No vendor is hardcoded. Attach adapters through:

- `setLoggerAdapter`
- `setAnalyticsAdapter`
- `setErrorReporterAdapter`
- `setPerformanceReporterAdapter`

## Verification

The boilerplate is expected to pass:

```bash
npm run check:ci
npm audit --audit-level=moderate
```

## More Docs

- `ARCHITECTURE.md`: ownership rules and server/client boundaries.
- `BOUNDARY_GUIDE.md`: detailed App Router boundary guide.
- `CONTRIBUTING.md`: checklist for feature and UI additions.
- `DEPENDENCY_STRATEGY.md`: package replacement and dependency review rules.
- `AI_WORKFLOW.md`: AI-assisted frontend workflow and verification gates.
- `PROMPT_PLAYBOOK.md`: reusable prompts for implementation, review, refactoring, and testing.
- `CODE_REVIEW_CHECKLIST.md`: senior FE review checklist for AI-generated code.
- `AI_REFACTORING_CASE_STUDY.md`: AI-assisted refactoring before/after sample.
- `PERFORMANCE_REPORT.md`: performance guardrails and review prompts.
- `I18N_STRATEGY.md`: i18n fallback, formatting, and missing-key strategy.
- `AI_CHANGELOG.md`: AI-assisted work log and verification notes.
