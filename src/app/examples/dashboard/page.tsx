import type { Metadata } from "next";
import CustomizableDashboardContainer from "@/features/customizable-dashboard/containers/CustomizableDashboardContainer";

export const metadata: Metadata = {
  title: "Customizable Dashboard",
  description: "Draggable widget dashboard with per-widget data sources, filters, and personalization presets.",
};

export default function DashboardExamplePage() {
  return <CustomizableDashboardContainer />;
}
