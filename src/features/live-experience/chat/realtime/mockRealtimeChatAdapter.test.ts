import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatMessage } from "../model/chatMessage";
import type { RealtimeConnectionState } from "./realtimeChatAdapter";
import { createMockRealtimeChatAdapter } from "./mockRealtimeChatAdapter";

function subscribe(intervalMs = 1000) {
  const messages: ChatMessage[] = [];
  const states: RealtimeConnectionState[] = [];
  const disconnect = createMockRealtimeChatAdapter(intervalMs).connect({
    onMessage: (message) => messages.push(message),
    onStateChange: (state) => states.push(state),
  });
  return { disconnect, messages, states };
}

describe("createMockRealtimeChatAdapter", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("reports connecting immediately and connected after the handshake delay", () => {
    const { disconnect, states } = subscribe();

    expect(states).toEqual(["connecting"]);
    vi.advanceTimersByTime(350);
    expect(states).toEqual(["connecting", "connected"]);

    disconnect();
  });

  it("emits messages on the interval only once connected", () => {
    const { disconnect, messages } = subscribe(1000);

    vi.advanceTimersByTime(340);
    expect(messages).toHaveLength(0);

    vi.advanceTimersByTime(10 + 1000);
    expect(messages).toHaveLength(1);

    vi.advanceTimersByTime(2000);
    expect(messages).toHaveLength(3);

    disconnect();
  });

  it("rotates participants and message text so the feed does not repeat immediately", () => {
    const { disconnect, messages } = subscribe(1000);

    vi.advanceTimersByTime(350 + 3000);

    expect(new Set(messages.map((message) => message.userId)).size).toBe(3);
    expect(new Set(messages.map((message) => message.message)).size).toBe(3);
    expect(new Set(messages.map((message) => message.id)).size).toBe(messages.length);

    disconnect();
  });

  it("stops emitting after disconnect", () => {
    const { disconnect, messages } = subscribe(1000);

    vi.advanceTimersByTime(350 + 1000);
    const delivered = messages.length;
    disconnect();
    vi.advanceTimersByTime(5000);

    expect(messages).toHaveLength(delivered);
  });

  it("cancels the pending handshake when disconnected before it lands", () => {
    const { disconnect, messages, states } = subscribe(1000);

    disconnect();
    vi.advanceTimersByTime(5000);

    expect(states).toEqual(["connecting"]);
    expect(messages).toHaveLength(0);
  });
});
