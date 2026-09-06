# Contributing

## New Component Checklist

1. Prefer server-safe UI in `src/components/ui`.
2. Use CSS Modules and design tokens.
3. Add Storybook stories for normal and edge states.
4. Add focused tests for render or interaction.
5. Add `"use client"` only when interaction or browser APIs require it.

The generator creates component, style, story, and test files:

```bash
npm run generate -- component SearchInput
```

## New Feature Checklist

1. Put server reads in `features/{name}/server`.
2. Put mutations in `features/{name}/actions`.
3. Put contracts in `features/{name}/dto`.
4. Split pure UI views from client/server wrappers.
5. Add Storybook stories for pure UI.

## Verification

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run build-storybook
```

## Adding an endpoint

Moved here from `API_CONTRACT.md`, which is about what the contract *means*
rather than how to extend it.

1. Add the DTO next to the feature that consumes it.
2. Add the payload to `src/core/mock/dummyData.ts`.
3. Add a route handler under `src/app/api/{path}/route.ts`.
4. Register it in `src/core/mock/mockRegistry.ts` so `check:automation` sees it.
5. Add a scenario in `src/test/msw/scenarios.ts` when tests need to vary the
   response.
