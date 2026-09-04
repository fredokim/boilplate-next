# AI-Assisted Refactoring Case Study

## Goal

Show how AI can accelerate refactoring while the developer keeps control over architecture, runtime boundaries, and
verification.

The sample is intentionally small, but it mirrors real legacy frontend problems: one component owns filtering, table
rendering, status labeling, and operational copy all at once.

## Before

`src/features/refactoring-case/legacy/LegacyOpsTable.client.tsx`

Problems:

- Client-only component owns data shaping, filtering, UI rendering, and status formatting.
- Business labels are embedded inside rendering logic.
- Filtering is hard to test without rendering the whole component.
- Any future server data boundary would have to untangle UI and logic first.

## Prompt Used

```txt
Refactor this component without changing behavior.

Goal:
- Separate pure view from data filtering and browser-only interaction.
- Keep the client boundary only where search input state is needed.
- Extract testable logic for filtering and status labels.
- Add regression tests for filtering.

Rules:
- Do this in one small slice.
- Keep public props stable.
- Do not add dependencies.
```

## After

`src/features/refactoring-case/refactored/OpsTable.client.tsx`

Changes:

- `filterOpsRows` and `getStatusLabel` moved into pure functions.
- Client component owns only query input state.
- `OpsTableView` renders rows and can be reused by server-fed data.
- Regression tests cover filtering and status labels without mounting React.

## Human Decisions

These stay with the developer on every refactor, not just this one:

- Decide whether state is local, URL, server-fetched, or Zustand.
- Decide where the server/client boundary belongs before moving any code across it.
- Decide which logic must be extracted before AI-generated changes continue.
- Keep dependency additions out unless the use case is proven.
- Require lint, typecheck, test, build, and E2E for user-facing changes.

## Human Review Decisions

- Kept search state local because it is not shareable route state yet.
- Did not introduce TanStack Query because the sample receives data as props.
- Did not introduce a new table dependency because the existing UI need is simple.
- Preserved the client boundary because the search input is interactive.
- Added tests for extracted logic before expanding the sample.

## Verification

```bash
npm run test -- --run src/features/refactoring-case/refactored/opsTable.logic.test.ts
npm run lint
npm run typecheck
```

## Resume-Friendly Summary

Designed an AI-assisted refactoring workflow where AI drafts the mechanical split and tests, while the developer owns
state ownership, server/client boundary decisions, dependency control, and regression verification.
