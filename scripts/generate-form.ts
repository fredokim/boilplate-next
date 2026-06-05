import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [, , rawName] = process.argv;

if (!rawName) {
  throw new Error("Usage: npm run generate -- form <name>");
}

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
  `${base}/components/${pascalName}FormView.tsx`,
  `import type { FormHTMLAttributes } from "react";\nimport type { DtoFieldErrors } from "@/core/form/fieldErrors";\nimport { Button } from "@/components/ui/Button";\nimport type { ${pascalName}Input } from "../schemas/${kebabName}.schema";\n\nexport type ${pascalName}FormViewProps = {\n  action?: FormHTMLAttributes<HTMLFormElement>["action"];\n  defaultValue?: ${pascalName}Input;\n  errors?: DtoFieldErrors<${pascalName}Input>;\n  isPending?: boolean;\n};\n\nexport function ${pascalName}FormView({ action, defaultValue = { name: "" }, errors = {}, isPending = false }: ${pascalName}FormViewProps) {\n  return (\n    <form action={action} style={{ display: "grid", gap: 16 }}>\n      <label style={{ display: "grid", gap: 8 }}>\n        <span>Name</span>\n        <input defaultValue={defaultValue.name} name="name" />\n        {errors.name ? <small>{errors.name}</small> : null}\n      </label>\n      <Button type="submit">{isPending ? "Saving..." : "Save ${pascalName}"}</Button>\n    </form>\n  );\n}\n`,
);
write(
  `${base}/components/${pascalName}FormView.stories.tsx`,
  `import type { Meta, StoryObj } from "@storybook/nextjs-vite";\nimport { ${pascalName}FormView } from "./${pascalName}FormView";\n\nconst meta = {\n  title: "Forms/${pascalName}FormView",\n  component: ${pascalName}FormView,\n  args: { defaultValue: { name: "${pascalName}" } },\n} satisfies Meta<typeof ${pascalName}FormView>;\n\nexport default meta;\n\ntype Story = StoryObj<typeof meta>;\n\nexport const Default: Story = {};\nexport const Error: Story = { args: { defaultValue: { name: "" }, errors: { name: "Name is required." } } };\n`,
);
write(
  `${base}/components/${pascalName}FormView.test.tsx`,
  `import { render, screen } from "@testing-library/react";\nimport { ${pascalName}FormView } from "./${pascalName}FormView";\n\ndescribe("${pascalName}FormView", () => {\n  it("renders generated form fields", () => {\n    render(<${pascalName}FormView defaultValue={{ name: "${pascalName}" }} />);\n\n    expect(screen.getByText("Name")).toBeInTheDocument();\n  });\n});\n`,
);

console.log(`Generated form: ${kebabName}`);
