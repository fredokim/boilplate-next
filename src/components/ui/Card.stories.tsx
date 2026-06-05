import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Card } from "./Card";

const meta = {
  title: "Atoms/Card",
  component: Card,
  args: {
    title: "Server-safe card",
    description: "This UI component does not need a client boundary.",
    children: "Card content",
  },
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ContentOnly: Story = {
  render: () => (
    <Card>
      <dl style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <dt>Boundary</dt>
          <dd>Server component</dd>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <dt>Hydration risk</dt>
          <dd>None</dd>
        </div>
      </dl>
    </Card>
  ),
};

export const DenseContent: Story = {
  args: {
    title: "Validated payload",
    description: "Compact content for dashboard panels.",
    children: (
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <tbody>
          <tr>
            <th style={{ padding: "8px 0", textAlign: "left" }}>Users</th>
            <td style={{ padding: "8px 0", textAlign: "right" }}>3</td>
          </tr>
          <tr>
            <th style={{ padding: "8px 0", textAlign: "left" }}>Status</th>
            <td style={{ padding: "8px 0", textAlign: "right" }}>Ready</td>
          </tr>
        </tbody>
      </table>
    ),
  },
};
