import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * Creates a feature that matches docs/development/FEATURE_CONTRACT.md.
 *
 * It used to live inline in generate.ts, where it made five directories and
 * two files and left three of the directories empty. More importantly it never
 * created a route segment, so the feature could not be opened: routing here is
 * the file system under src/app, and a folder in src/features reaches nothing
 * on its own.
 */

const args = process.argv.slice(2);
const rawName = args.find((arg) => !arg.startsWith("--"));

if (rawName === undefined || rawName.trim() === "") {
  throw new Error("Usage: npm run generate:feature -- feature-name");
}

const featureName = rawName.trim();

/**
 * A name becomes two directories, so it must not be able to escape either.
 */
if (!/^[a-z][a-z0-9-]*$/.test(featureName)) {
  throw new Error(
    `Invalid feature name: ${featureName}. Use lower-case letters, digits and hyphens, starting with a letter.`,
  );
}

const pascalName = featureName
  .split("-")
  .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
  .join("");

const title = featureName
  .split("-")
  .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
  .join(" ");

const files: Record<string, string> = {
  [`src/features/${featureName}/views/${pascalName}View.tsx`]: `import styles from "./${pascalName}View.module.scss";

type ${pascalName}ViewProps = {
  title?: string;
};

/**
 * A server component. Add interactivity by extracting the interactive part
 * into a \`.client.tsx\` component and rendering it from here, the way
 * \`dashboard\` renders \`RefreshableUsers.client.tsx\`.
 */
export function ${pascalName}View({ title = "${title}" }: ${pascalName}ViewProps) {
  return (
    <main className={styles.page}>
      <h1>{title}</h1>
    </main>
  );
}
`,

  [`src/features/${featureName}/views/${pascalName}View.module.scss`]: `.page {
  width: min(1120px, calc(100% - 40px));
  margin: 0 auto;
  padding: 42px 0 72px;
  color: var(--color-ink);
}
`,

  [`src/features/${featureName}/views/${pascalName}View.stories.tsx`]: `import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ${pascalName}View } from "./${pascalName}View";

const meta = {
  title: "Features/${pascalName}/${pascalName}View",
  component: ${pascalName}View,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ${pascalName}View>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
`,

  [`src/features/${featureName}/views/${pascalName}View.test.tsx`]: `import { render, screen } from "@testing-library/react";
import { ${pascalName}View } from "./${pascalName}View";

describe("${pascalName}View", () => {
  it("renders the title it is given", () => {
    render(<${pascalName}View title="Given title" />);

    expect(screen.getByRole("heading", { name: "Given title" })).toBeInTheDocument();
  });
});
`,

  [`src/app/${featureName}/page.tsx`]: `import type { Metadata } from "next";
import { ${pascalName}View } from "@/features/${featureName}/views/${pascalName}View";

export const metadata: Metadata = {
  title: "${title}",
  description: "Generated feature.",
};

export default function ${pascalName}Page() {
  return <${pascalName}View />;
}
`,
};

/**
 * Nothing is written until every target has been checked. A generator that
 * fails half way leaves a feature that is neither absent nor complete — and
 * here the halves live in two different trees, so a partial result is easy to
 * miss.
 */
const existing = Object.keys(files).filter((relative) => existsSync(join(process.cwd(), relative)));

if (existing.length > 0) {
  throw new Error(
    [`"${featureName}" already has these files:`, ...existing.map((relative) => `  ${relative}`), "Delete them first if you meant to regenerate it."].join(
      "\n",
    ),
  );
}

for (const [relative, contents] of Object.entries(files)) {
  const target = join(process.cwd(), relative);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents, "utf8");
}

console.log(`Created feature: ${featureName} (${String(Object.keys(files).length)} files)`);
console.log(`Route: /${featureName} (server component)`);
