import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type GeneratorKind = "feature" | "component" | "contract" | "dto" | "route" | "action" | "layout" | "page" | "form";

const [kind, rawName] = process.argv.slice(2) as [GeneratorKind | undefined, string | undefined];

if (!kind || !rawName) {
  throw new Error("Usage: npm run generate -- <feature|component|contract|dto|route|action|layout|page|form> <name>");
}

const kebabName = rawName
  .replace(/([a-z])([A-Z])/g, "$1-$2")
  .replace(/\s+/g, "-")
  .toLowerCase();

const pascalName = kebabName
  .split("-")
  .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
  .join("");

const write = (path: string, content: string) => {
  mkdirSync(join(process.cwd(), path, ".."), { recursive: true });
  writeFileSync(join(process.cwd(), path), content);
};

if (kind === "contract") {
  const result = spawnSync("tsx", ["scripts/generate-contract.ts", rawName], {
    stdio: "inherit",
    shell: true,
  });
  process.exit(result.status ?? 1);
}

if (kind === "layout" || kind === "page" || kind === "form") {
  const result = spawnSync("tsx", [`scripts/generate-${kind}.ts`, rawName, ...process.argv.slice(4)], {
    stdio: "inherit",
    shell: true,
  });
  process.exit(result.status ?? 1);
}

// Delegated, not inlined. This branch used to hold its own copy of feature
// generation that made two files, three empty directories, and no route
// segment — so `generate -- feature x` produced something that could not be
// opened, while `generate:feature -- x` produced something that could.
if (kind === "feature") {
  const result = spawnSync("tsx", ["scripts/generate-feature.ts", rawName, ...process.argv.slice(4)], {
    stdio: "inherit",
    shell: true,
  });
  process.exit(result.status ?? 1);
}

if (kind === "component") {
  const base = `src/components/ui/${pascalName}`;
  write(
    `${base}/${pascalName}.tsx`,
    `import styles from "./${pascalName}.module.scss";\n\ntype ${pascalName}Props = {\n  label?: string;\n};\n\nexport function ${pascalName}({ label = "${pascalName}" }: ${pascalName}Props) {\n  return <div className={styles.root}>{label}</div>;\n}\n`,
  );
  write(`${base}/${pascalName}.module.scss`, `.root {\n  color: var(--color-ink);\n}\n`);
  write(
    `${base}/${pascalName}.stories.tsx`,
    `import type { Meta, StoryObj } from "@storybook/nextjs-vite";\nimport { ${pascalName} } from "./${pascalName}";\n\nconst meta = {\n  title: "Atoms/${pascalName}",\n  component: ${pascalName},\n  args: {\n    label: "${pascalName}",\n  },\n} satisfies Meta<typeof ${pascalName}>;\n\nexport default meta;\n\ntype Story = StoryObj<typeof meta>;\n\nexport const Default: Story = {};\n`,
  );
  write(
    `${base}/${pascalName}.test.tsx`,
    `import { render, screen } from "@testing-library/react";\nimport { ${pascalName} } from "./${pascalName}";\n\ndescribe("${pascalName}", () => {\n  it("renders label", () => {\n    render(<${pascalName} label="${pascalName}" />);\n\n    expect(screen.getByText("${pascalName}")).toBeInTheDocument();\n  });\n});\n`,
  );
}

if (kind === "dto") {
  write(
    `src/features/${kebabName}/dto/${pascalName}.dto.ts`,
    `import { IsString } from "class-validator";\n\nexport class ${pascalName}Dto {\n  @IsString()\n  id = "";\n}\n`,
  );
}

if (kind === "route") {
  write(
    `src/app/${kebabName}/page.tsx`,
    `export default function ${pascalName}Page() {\n  return <main>${pascalName}</main>;\n}\n`,
  );
}

if (kind === "action") {
  write(
    `src/features/${kebabName}/actions/${kebabName}.actions.ts`,
    `"use server";\n\nexport async function ${kebabName.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())}Action() {\n  return { success: true };\n}\n`,
  );
}

console.log(`Generated ${kind}: ${kebabName}`);
