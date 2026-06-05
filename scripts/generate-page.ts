import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [, , rawName, rawPreset = "list"] = process.argv;

if (!rawName) {
  throw new Error("Usage: npm run generate -- page <name> [list|detail|form|dashboard|settings]");
}

const preset = ["list", "detail", "form", "dashboard", "settings"].includes(rawPreset) ? rawPreset : "list";
const kebabName = rawName.replace(/([a-z])([A-Z])/g, "$1-$2").replace(/\s+/g, "-").toLowerCase();
const pascalName = kebabName
  .split("-")
  .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
  .join("");
const base = `src/features/${kebabName}`;

function write(path: string, content: string) {
  mkdirSync(join(process.cwd(), path, ".."), { recursive: true });
  writeFileSync(join(process.cwd(), path), content);
}

write(
  `src/app/(dashboard)/${kebabName}/page.tsx`,
  `import { withServerAuth } from "@/hoc/server/withServerAuth";\nimport { ${pascalName}PageView } from "@/features/${kebabName}/views/${pascalName}PageView";\n\nexport default async function ${pascalName}Page() {\n  return withServerAuth(async () => <${pascalName}PageView status="success" />);\n}\n`,
);
write(
  `${base}/views/${pascalName}PageView.tsx`,
  `import { Card } from "@/components/ui/Card";\nimport { ErrorState } from "@/components/states/ErrorState";\nimport { LoadingState } from "@/components/states/LoadingState";\nimport styles from "./${pascalName}PageView.module.scss";\n\nexport type ${pascalName}PageViewProps = {\n  status: "idle" | "pending" | "success" | "error";\n};\n\nexport function ${pascalName}PageView({ status }: ${pascalName}PageViewProps) {\n  if (status === "idle" || status === "pending") {\n    return <LoadingState label="Loading ${pascalName}" />;\n  }\n\n  if (status === "error") {\n    return <ErrorState title="${pascalName} failed" />;\n  }\n\n  return (\n    <main className={styles.page}>\n      <header className={styles.heading}>\n        <div>\n          <h1>${pascalName}</h1>\n          <p>Generated ${preset} page preset.</p>\n        </div>\n      </header>\n      <Card title="${pascalName} content" description="Connect server data, DTO validation, and client islands here.">\n        <p className={styles.empty}>No ${kebabName} data yet.</p>\n      </Card>\n    </main>\n  );\n}\n`,
);
write(
  `${base}/views/${pascalName}PageView.module.scss`,
  `.page {\n  width: min(1120px, calc(100% - 40px));\n  margin: 0 auto;\n  padding: 42px 0 72px;\n}\n\n.heading {\n  display: flex;\n  justify-content: space-between;\n  gap: 18px;\n  margin-bottom: 22px;\n}\n\n.heading h1 {\n  margin: 0;\n  color: var(--color-ink);\n}\n\n.heading p,\n.empty {\n  margin: 8px 0 0;\n  color: var(--color-muted);\n}\n`,
);
write(
  `${base}/views/${pascalName}PageView.stories.tsx`,
  `import type { Meta, StoryObj } from "@storybook/nextjs-vite";\nimport { ${pascalName}PageView } from "./${pascalName}PageView";\n\nconst meta = {\n  title: "Pages/${pascalName}",\n  component: ${pascalName}PageView,\n  args: { status: "success" },\n  parameters: { layout: "fullscreen" },\n} satisfies Meta<typeof ${pascalName}PageView>;\n\nexport default meta;\n\ntype Story = StoryObj<typeof meta>;\n\nexport const Success: Story = {};\nexport const Loading: Story = { args: { status: "pending" } };\nexport const Error: Story = { args: { status: "error" } };\n`,
);
write(
  `${base}/PAGE_SPEC.md`,
  `# ${pascalName} Page\n\n- Type: ${preset}\n- Route: /(dashboard)/${kebabName}\n- Auth: required\n- Permission: ${kebabName}:read\n- States: loading, empty, error, success\n- Layout: dashboard route group\n- Boundary: Server page + pure view\n`,
);

console.log(`Generated page: ${kebabName} (${preset})`);
