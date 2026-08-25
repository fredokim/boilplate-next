import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "storybook-static/**",
    // Agent worktrees are full checkouts nested inside the repo; linting them
    // reports every problem twice and drowns real findings.
    ".claude/worktrees/**",
    // The WOD planner is a separate application that happens to live in this repo.
    // It is not part of the boilerplate and is maintained on its own track, so it
    // must not gate the boilerplate's CI. Remove these once it moves out.
    "src/components/WodPlanner.client.tsx",
    "src/components/Wod*.tsx",
    "src/components/WeeklyLoadView.tsx",
    "src/components/RecommendationCard.tsx",
    "src/crawler/**",
    "src/parser/**",
    "src/planner/**",
  ]),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
    },
  },
  prettier,
]);

export default eslintConfig;
