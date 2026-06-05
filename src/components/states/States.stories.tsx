import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ErrorState } from "./ErrorState";
import { LoadingState } from "./LoadingState";

const meta = {
  title: "States/Common",
  parameters: {
    layout: "padded",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  render: () => <LoadingState label="Loading server-rendered data" />,
};

export const Error: Story = {
  render: () => (
    <ErrorState
      failure={{
        origin: "frontend-contract",
        kind: "validation",
        message: "The server response did not match the DTO contract.",
      }}
      title="Contract validation failed"
    />
  ),
};
