import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ChatMessage } from "../chat/model/chatMessage";
import type { VideoSource } from "../player/model/player";
import type { ChatDiagnostics } from "../chat/realtime/types";
import { LiveExperienceView } from "./LiveExperienceView";

const videoSource: VideoSource = { kind: "progressive", src: "/media/sample.mp4", mimeType: "video/mp4" };

const message: ChatMessage = {
  id: "m-1",
  userId: "user-mina",
  displayName: "Mina",
  profileImageUrl: "/avatars/mina.svg",
  message: "The stage looks amazing!",
  timestamp: "2026-08-23T10:15:00.000Z",
};

const diagnostics: ChatDiagnostics = {
  received: 0,
  applied: 0,
  duplicatesIgnored: 0,
  outOfOrderRepositioned: 0,
  droppedTooOld: 0,
  droppedByCapacity: 0,
  flushCount: 0,
  totalBatchSize: 0,
  pendingSize: 0,
  reconnectCount: 0,
  lastMessageAt: null,
};

describe("LiveExperienceView", () => {
  it("renders an empty chat placeholder before the first message", () => {
    render(<LiveExperienceView chatDiagnostics={diagnostics} chatMessages={[]} connectionState="connecting" videoSource={videoSource} />);

    expect(screen.getByText("Waiting for the first message…")).toBeInTheDocument();
    expect(within(screen.getByLabelText("Chat debug information")).getByText("Shown: 0")).toBeInTheDocument();
  });

  it("renders a message with its author, avatar, and machine-readable timestamp", () => {
    render(<LiveExperienceView chatDiagnostics={diagnostics} chatMessages={[message]} connectionState="connected" videoSource={videoSource} />);

    expect(screen.getByText("The stage looks amazing!")).toBeInTheDocument();
    expect(screen.getByText("Mina")).toBeInTheDocument();
    expect(screen.getByAltText("Mina's profile")).toBeInTheDocument();
    expect(screen.getByRole("time")).toHaveAttribute("dateTime", message.timestamp);
  });

  it("exposes the chat feed as a polite live region so new messages are announced", () => {
    const { container } = render(
      <LiveExperienceView chatDiagnostics={diagnostics} chatMessages={[message]} connectionState="connected" videoSource={videoSource} />,
    );

    expect(container.querySelector('[aria-live="polite"]')).toBeInTheDocument();
  });

  it("surfaces the connection state in both the header and the debug footer", () => {
    render(<LiveExperienceView chatDiagnostics={diagnostics} chatMessages={[]} connectionState="error" videoSource={videoSource} />);

    expect(within(screen.getByLabelText("Realtime chat")).getByText("Error")).toBeInTheDocument();
    expect(within(screen.getByLabelText("Chat debug information")).getByText("Connection: Error")).toBeInTheDocument();
  });
});
