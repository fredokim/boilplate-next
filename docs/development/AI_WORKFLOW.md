# AI-Assisted Senior Frontend Workflow

This workflow defines how AI is used in this boilerplate without giving up engineering ownership. AI accelerates
implementation, test scaffolding, and refactoring discovery; the developer owns product judgment, runtime boundaries,
contract safety, accessibility, and performance tradeoffs.

## Operating Principles

- Keep Server Components as the default and introduce Client Components only for interaction, browser APIs, or local UI state.
- Validate external data with DTOs before UI receives it.
- Treat AI output as a draft until lint, typecheck, tests, build, and reviewer checks pass.
- Prefer small, reversible changes over broad rewrites.
- Record the intent of AI-assisted changes in docs, tests, or PR notes so the reasoning survives the prompt.

## AI-Owned Draft Work

- Generate first-pass UI components from an existing design-system pattern.
- Draft DTOs, Zod schemas, mock payloads, and focused tests.
- Expand Storybook states for loading, empty, error, and populated cases.
- Identify repeated code and propose refactoring slices.
- Produce Playwright scenarios for happy path and regression-prone flows.
- Summarize bundle, accessibility, and hydration risks after code changes.

## Developer-Owned Decisions

- Server/client boundary placement.
- State ownership: server data, TanStack Query cache, Zustand UI state, URL state, or local component state.
- API contract shape and backwards compatibility.
- Performance tradeoffs such as SSR/CSR, streaming, bundle splitting, and cache strategy.
- Accessibility acceptance criteria.
- Rollout risk, release sequencing, and operational monitoring.

## Default AI Task Contract

Every AI implementation task should include:

- Goal: user-visible behavior or engineering outcome.
- Scope: files or feature boundary that may be changed.
- Constraints: runtime boundary, dependency policy, styling pattern, and test expectations.
- Verification: commands that must pass.
- Review focus: risks the reviewer should inspect after generation.

## Verification Gate

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run e2e
```

For dependency, Storybook, or bundle-related changes:

```bash
npm run check:automation
npm run check:deps
npm run check:bundle
npm run build-storybook
```

## Example: Ops Console

The `/ops-console` feature is a proof surface for this workflow:

- Server data is validated by `OpsConsoleDto`.
- i18n is represented with typed dictionaries.
- Realtime behavior is isolated in a leaf Client Component.
- Reusable `Card`, `Button`, and `DataTable` components are used instead of one-off UI.
- Playwright covers the primary user flow.
- axe checks basic accessibility regressions.

## Example: Refactoring Case Study

The refactoring sample documents how AI can draft a safe first slice:

- Legacy component: `src/features/refactoring-case/legacy/LegacyOpsTable.client.tsx`
- Refactored component: `src/features/refactoring-case/refactored/OpsTable.client.tsx`
- Pure logic: `src/features/refactoring-case/refactored/opsTable.logic.ts`
- Regression tests: `src/features/refactoring-case/refactored/opsTable.logic.test.ts`

See `AI_REFACTORING_CASE_STUDY.md`.
