import type { Metadata } from "next";
import GraphViewerContainer from "@/features/visual-graph/containers/GraphViewerContainer";

export const metadata: Metadata = {
  title: "Interactive Topology Explorer",
  description: "Network topology viewer and editor with a streamed runtime health layer.",
};

/**
 * Server component boundary. The topology itself is fully interactive, so the
 * container below opts into the client with a single "use client" directive
 * rather than sprinkling the directive across every child.
 */
export default function GraphExamplePage() {
  return <GraphViewerContainer />;
}
