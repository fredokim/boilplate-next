import type { Metadata } from "next";
import LiveExperienceContainer from "@/features/live-experience/containers/LiveExperienceContainer";

export const metadata: Metadata = {
  title: "Live Streaming Lab",
  description: "Video playback and realtime chat baseline for streaming behavior measurement.",
};

export default function LiveExamplePage() {
  return <LiveExperienceContainer />;
}
