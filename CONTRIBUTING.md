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
