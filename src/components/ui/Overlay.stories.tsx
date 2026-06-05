"use client";

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { Tabs } from "./Tabs";
import { Toast } from "./Toast";

const meta = {
  title: "Molecules/OverlayAndNavigation",
  parameters: {
    layout: "padded",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function TabbedPanelDemo() {
  const [activeId, setActiveId] = useState("overview");

  return (
    <Tabs
      activeId={activeId}
      items={[
        { id: "overview", label: "Overview", content: <p>Project summary and health.</p> },
        { id: "api", label: "API", content: <p>DTO validation and request status.</p> },
        { id: "logs", label: "Logs", content: <p>Observability adapter events.</p> },
      ]}
      onChange={setActiveId}
    />
  );
}

export const ModalOpen: Story = {
  render: () => (
    <Modal description="Only inner content changes between use cases." onClose={() => undefined} open title="Confirm deployment">
      <div style={{ display: "grid", gap: 16 }}>
        <p>This shared modal can host forms, confirmations, and detail views.</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button variant="secondary">Cancel</Button>
          <Button>Deploy</Button>
        </div>
      </div>
    </Modal>
  ),
};

export const TabbedPanel: Story = {
  render: () => <TabbedPanelDemo />,
};

export const Toasts: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 12, maxWidth: 440 }}>
      <Toast message="The user list was refreshed." title="Saved" tone="success" />
      <Toast message="DTO parsing failed before rendering." title="Contract warning" />
      <Toast message="The API returned a server error." title="Request failed" tone="danger" />
    </div>
  ),
};
