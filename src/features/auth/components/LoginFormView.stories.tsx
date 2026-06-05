import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Card } from "@/components/ui/Card";
import { LoginFormView } from "./LoginFormView";

const meta = {
  title: "Features/Auth/LoginFormView",
  component: LoginFormView,
  args: {
    isPending: false,
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 440 }}>
        <Card title="Login" description="Pure UI view separated from the server action wrapper.">
          <Story />
        </Card>
      </div>
    ),
  ],
} satisfies Meta<typeof LoginFormView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Pending: Story = {
  args: {
    isPending: true,
  },
};

export const ValidationError: Story = {
  args: {
    errors: {
      email: "Enter a valid email address.",
      password: "Password must be at least 8 characters.",
    },
  },
};
