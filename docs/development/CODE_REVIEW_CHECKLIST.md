# AI-Assisted Code Review Checklist

Use this checklist after AI-generated or AI-assisted changes.

## Runtime Boundaries

- Server Components remain the default.
- Client Components are limited to event handlers, effects, browser APIs, or local UI state.
- Server-only code is not imported by client files.
- Serializable data is passed across the server/client boundary.

## Data and State

- API-shaped data is validated before UI rendering.
- DTO/schema failures are explicit and testable.
- Server data, client cache, UI state, URL state, and form state have clear owners.
- Query keys are stable and scoped to the data they represent.

## UI Quality

- Existing UI components and design tokens are reused.
- Loading, empty, and error states are represented where needed.
- Text fits responsive containers.
- Interactive controls have accessible names and keyboard behavior.

## Performance

- New Client Components do not pull unnecessary code into the client bundle.
- Expensive rendering work is memoized only when measurement or structure justifies it.
- Lists have stable keys and bounded rendering behavior.
- Core Web Vitals risks are named when layout, images, fonts, or hydration change.

## Tests

- Unit/component tests cover branching logic.
- E2E tests cover the main user flow.
- Accessibility tests cover new interactive surfaces.
- Regression tests are added for bug fixes or refactors.

## AI-Specific Review

- The change does not contain invented requirements.
- The implementation follows repository conventions.
- The diff is smaller than the problem it solves.
- Any new abstraction removes real repetition or clarifies ownership.
- The final answer includes verification commands and residual risk.

## PR Hygiene

- Use `.github/PULL_REQUEST_TEMPLATE.md`.
- Record meaningful AI-assisted changes in `AI_CHANGELOG.md`.
- Link performance or i18n decisions to `PERFORMANCE_REPORT.md` or `I18N_STRATEGY.md` when relevant.
