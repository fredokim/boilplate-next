import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    css: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: [
        "dist/**",
        ".next/**",
        "storybook-static/**",
        "src/**/*.stories.tsx",
        "src/test/**",
      ],
      // A ratchet, not an aspiration. Each number is the measured figure
      // rounded down, so the gate says "do not go backwards" rather than
      // naming a target nobody agreed to. Raise them when coverage rises;
      // a threshold that has never been met is a threshold that gets
      // deleted the first time it is inconvenient.
      thresholds: {
        statements: 71,
        branches: 60,
        functions: 68,
        lines: 76,
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./src/test/server-only.ts", import.meta.url)),
    },
  },
});
