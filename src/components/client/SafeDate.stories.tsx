"use client";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SafeDate } from "./SafeDate.client";

const meta = {
  title: "Client/SafeDate",
  component: SafeDate,
  args: {
    value: "2026-05-31T09:30:00.000Z",
    fallback: "2026-05-31 09:30 UTC",
  },
  argTypes: {
    locale: {
      control: "select",
      options: [undefined, "ko-KR", "en-US", "ja-JP"],
    },
    timeZone: {
      control: "select",
      options: [undefined, "Asia/Seoul", "UTC", "America/New_York"],
    },
  },
} satisfies Meta<typeof SafeDate>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const KoreanTime: Story = {
  args: {
    locale: "ko-KR",
    timeZone: "Asia/Seoul",
  },
};

export const UtcFallback: Story = {
  args: {
    fallback: "Stable server text before hydration",
    locale: "en-US",
    timeZone: "UTC",
  },
};
