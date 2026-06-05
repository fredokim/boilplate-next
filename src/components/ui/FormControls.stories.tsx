"use client";

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Checkbox } from "./Checkbox";
import { RadioGroup } from "./RadioGroup";
import { Select } from "./Select";

const meta = {
  title: "Atoms/FormControls",
  parameters: {
    layout: "padded",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function FormControlsDemo() {
  const [role, setRole] = useState("admin");

  return (
    <div style={{ display: "grid", gap: 20, maxWidth: 440 }}>
      <Select
        label="Role"
        name="role"
        onChange={(event) => setRole(event.target.value)}
        options={[
          { label: "Admin", value: "admin" },
          { label: "Designer", value: "designer" },
          { label: "Viewer", value: "viewer" },
        ]}
        value={role}
      />
      <Checkbox description="Keep server auth guards enabled." label="Require authentication" name="auth" />
      <RadioGroup
        label="Rendering strategy"
        name="rendering"
        onChange={() => undefined}
        options={[
          { label: "Server first", value: "server", description: "Default for route data." },
          { label: "Client refresh", value: "client", description: "Use for interactive cache updates." },
        ]}
        value="server"
      />
    </div>
  );
}

export const Controls: Story = {
  render: () => <FormControlsDemo />,
};

export const SelectError: Story = {
  render: () => (
    <div style={{ maxWidth: 440 }}>
      <Select
        error="Select a role before saving."
        label="Role"
        name="role"
        options={[
          { label: "Choose role", value: "" },
          { label: "Admin", value: "admin" },
        ]}
      />
    </div>
  ),
};
