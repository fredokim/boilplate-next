# Prompt Playbook

Use these prompts to turn AI into a controlled frontend implementation partner.

## 1. Feature Implementation

```txt
Implement this feature in the existing Next.js boilerplate.

Goal:
- [Describe the user-visible result]

Scope:
- Only change [feature/files].

Constraints:
- Keep Server Components as the default.
- Use Client Components only at interaction leaves.
- Validate API-shaped data with DTOs before rendering.
- Reuse existing UI components and CSS Module patterns.
- Do not add dependencies unless justified.

Verification:
- Add or update focused tests.
- Run lint, typecheck, test, and build.

Before editing:
- Summarize the affected files and the change plan.
```

## 2. Senior FE Code Review

```txt
Review this change as a senior frontend engineer.

Prioritize findings only:
- Bugs
- Next.js server/client boundary violations
- Hydration risks
- DTO or schema validation gaps
- State ownership mistakes
- Accessibility issues
- Missing tests
- Performance risks

Return findings first with file/line references.
Keep summaries brief.
```

## 3. Refactoring Slice

```txt
Refactor this component without changing behavior.

Goal:
- Separate pure view from data fetching and browser-only logic.
- Reduce client boundary size.
- Improve testability.

Rules:
- Do this in one small slice.
- Keep public props stable unless you explain the migration.
- Add a regression test for the preserved behavior.
- Stop after the first coherent refactor step.
```

## 4. Test Generation

```txt
Create a verification plan and implement the first useful tests.

Cover:
- Unit or component tests
- DTO/schema validation
- E2E user flow
- Accessibility
- Performance or bundle risk if relevant

Use the existing test tools in the repository.
Do not introduce a new test framework.
```

## 5. AI Output Audit

```txt
Audit the AI-generated code.

Check:
- Did it invent APIs or dependencies?
- Did it move server logic into the client?
- Did it bypass DTO validation?
- Did it create untested branches?
- Did it duplicate existing UI patterns?
- Did it make the code harder to delete or refactor later?

Return a punch list ordered by risk.
```
