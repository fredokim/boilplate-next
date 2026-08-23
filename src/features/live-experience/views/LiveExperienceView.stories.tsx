"use client";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import LiveExperienceContainer from "../containers/LiveExperienceContainer";

const meta = {
  title: "Features/Live Experience/LiveExperienceView",
  component: LiveExperienceContainer,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof LiveExperienceContainer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Baseline: Story = {};
