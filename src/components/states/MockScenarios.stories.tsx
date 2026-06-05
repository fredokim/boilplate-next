import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { mockRegistry } from "@/core/mock/mockRegistry";

function MockScenarioMatrix() {
  return (
    <div style={{ overflow: "hidden", border: "1px solid var(--color-line)", borderRadius: 8 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
        <thead style={{ background: "var(--color-surface)", color: "var(--color-muted)" }}>
          <tr>
            <th style={{ padding: 12 }}>Method</th>
            <th style={{ padding: 12 }}>Endpoint</th>
            <th style={{ padding: 12 }}>Scenarios</th>
          </tr>
        </thead>
        <tbody>
          {mockRegistry.map((entry) => {
            const scenarios = ["success", "empty", "invalid", "error"].filter((key) => key in entry);

            return (
              <tr key={`${entry.method}:${entry.endpoint}`} style={{ borderTop: "1px solid var(--color-line)" }}>
                <td style={{ padding: 12, fontWeight: 700 }}>{entry.method}</td>
                <td style={{ padding: 12, fontFamily: "monospace", fontSize: 12 }}>{entry.endpoint}</td>
                <td style={{ padding: 12 }}>{scenarios.join(", ")}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const meta = {
  title: "Automation/Mock Scenarios",
  component: MockScenarioMatrix,
} satisfies Meta<typeof MockScenarioMatrix>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Registry: Story = {};
