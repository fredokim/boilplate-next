import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [, , rawName] = process.argv;

if (!rawName) {
  throw new Error("Usage: npm run generate -- layout <name>");
}

const kebabName = rawName.replace(/([a-z])([A-Z])/g, "$1-$2").replace(/\s+/g, "-").toLowerCase();
const pascalName = kebabName
  .split("-")
  .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
  .join("");

function write(path: string, content: string) {
  mkdirSync(join(process.cwd(), path, ".."), { recursive: true });
  writeFileSync(join(process.cwd(), path), content);
}

write(
  `src/components/layouts/${pascalName}Layout.tsx`,
  `import type { ReactNode } from "react";\nimport styles from "./${pascalName}Layout.module.scss";\n\nexport type ${pascalName}LayoutProps = {\n  title: string;\n  description?: string;\n  actions?: ReactNode;\n  toolbar?: ReactNode;\n  children: ReactNode;\n};\n\nexport function ${pascalName}Layout({ actions, children, description, title, toolbar }: ${pascalName}LayoutProps) {\n  return (\n    <section className={styles.layout}>\n      <header className={styles.header}>\n        <div>\n          <h1>{title}</h1>\n          {description ? <p>{description}</p> : null}\n        </div>\n        {actions}\n      </header>\n      {toolbar ? <div className={styles.toolbar}>{toolbar}</div> : null}\n      <div>{children}</div>\n    </section>\n  );\n}\n`,
);
write(
  `src/components/layouts/${pascalName}Layout.module.scss`,
  `.layout {\n  display: grid;\n  gap: 20px;\n}\n\n.header {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: flex-end;\n  justify-content: space-between;\n  gap: 18px;\n}\n\n.header h1 {\n  margin: 0;\n  color: var(--color-ink);\n}\n\n.header p {\n  margin: 8px 0 0;\n  color: var(--color-muted);\n}\n\n.toolbar {\n  border: 1px solid var(--color-line);\n  border-radius: var(--radius-md);\n  background: var(--color-panel);\n  padding: 16px;\n}\n`,
);
write(
  `src/components/layouts/${pascalName}Layout.stories.tsx`,
  `import type { Meta, StoryObj } from "@storybook/nextjs-vite";\nimport { Button } from "@/components/ui/Button";\nimport { ${pascalName}Layout } from "./${pascalName}Layout";\n\nconst meta = {\n  title: "Layouts/${pascalName}Layout",\n  component: ${pascalName}Layout,\n  args: {\n    title: "${pascalName}",\n    description: "Generated responsive page layout shell.",\n    actions: <Button>Create</Button>,\n    toolbar: <span>Toolbar slot</span>,\n    children: <div>Content slot</div>,\n  },\n} satisfies Meta<typeof ${pascalName}Layout>;\n\nexport default meta;\n\ntype Story = StoryObj<typeof meta>;\n\nexport const Default: Story = {};\n`,
);

console.log(`Generated layout: ${kebabName}`);
