# Performance Report

## Scope

This report documents the performance posture for the Next.js boilerplate and `/ops-console` proof surface.

## Current Guardrails

- Server Components are the default to reduce unnecessary client JavaScript.
- Client Components are isolated to interactive leaves such as locale switching and live event updates.
- API-shaped data is validated on the server before rendering.
- Bundle size is checked with `npm run check:bundle`.
- Dependency size is checked with `npm run check:deps`.
- Production output is verified with `npm run build`.

## `/ops-console` Performance Notes

| Area | Decision | Reason |
| --- | --- | --- |
| Initial render | Server page fetches and validates data | Keeps API contract work out of the browser |
| Interactivity | Client boundary starts at `OpsConsoleView` | Locale switch and live feed are interactive |
| Live events | Feed is capped to five items | Prevents unbounded rendering growth |
| Metrics | Static metric cards | Stable layout with no image or font layout shift |
| Tables | Existing `DataTable` with horizontal overflow | Prevents mobile layout breakage |

## Web Vitals Checklist

- LCP: avoid heavy hero media and keep first viewport content text-first.
- CLS: use stable card/table dimensions and avoid late layout-changing content.
- INP: keep event handlers small and avoid expensive filtering during input.
- Bundle: avoid adding charting or table libraries until the use case requires them.
- Hydration: avoid server-rendered timestamps or random values.

## Review Prompt

```txt
Review this change for frontend performance risks.

Check:
- New client bundle weight
- Hydration risks
- Unbounded list rendering
- Layout shift
- Expensive input handlers
- Dependency size
- Core Web Vitals impact

Return concrete findings and suggested measurements.
```

## Commands

```bash
npm run build
npm run check:bundle
npm run check:deps
```
