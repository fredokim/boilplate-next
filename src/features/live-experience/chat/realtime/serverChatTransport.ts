import type { ChatMessage } from "../model/chatMessage";
import type { ChatConnectionState, ChatTransport, Unsubscribe } from "./types";

/**
 * Server-backed chat, alongside the mock transport rather than replacing it.
 *
 * The socket URL carries no token. This app keeps the access token in an
 * HttpOnly cookie its own server sets, so the page has nothing to put in the
 * URL — and does not need to: the handshake goes to this origin, the browser
 * attaches the cookie, and the rewrite forwards it to the backend, whose
 * gateway reads it. The React and Vue boilerplates hold their token in
 * JavaScript and pass it as a query parameter instead.
 *
 * Sending goes over HTTP, where the permission check, the idempotency key, and
 * the rate limit already live. Implementing them again on the socket would mean
 * two answers to "may this person post?" that have to agree forever.
 */

export type ServerChatMessage = {
  id: string;
  clientMessageId: string;
  broadcastId: string;
  sequence: number;
  authorId: string;
  displayName: string;
  body: string;
  sentAt: string;
  deleted: boolean;
};

type ServerFrame =
  | { type: "ready"; connectionId: string }
  | { type: "joined"; broadcastId: string; replayed: number }
  | { type: "message"; message: ServerChatMessage }
  | { type: "deleted"; messageId: string; sequence: number }
  | { type: "heartbeat" | "pong"; at: number }
  | { type: "error"; code: string; message: string };

/**
 * The server has no avatar field, and inventing one per author would put a face
 * on a person the database never described.
 */
const DEFAULT_AVATAR = "/avatars/default.svg";

function toChatMessage(message: ServerChatMessage): ChatMessage {
  return {
    id: message.id,
    userId: message.authorId,
    displayName: message.displayName,
    profileImageUrl: DEFAULT_AVATAR,
    message: message.body,
    timestamp: message.sentAt,
  };
}

export class ServerChatTransport implements ChatTransport {
  private socket: WebSocket | null = null;
  private state: ChatConnectionState = "idle";

  /**
   * The highest sequence seen, handed to the server on reconnect so it resumes
   * rather than replaying the room. It only moves forward: an out-of-order
   * frame must not walk the resume point backwards.
   */
  private lastSequence = 0;

  private readonly messageListeners = new Set<(message: ChatMessage) => void>();
  private readonly connectionListeners = new Set<(state: ChatConnectionState) => void>();

  connect(roomId: string): Promise<void> {
    this.disconnect();
    this.setState("connecting");

    return new Promise((resolve, reject) => {
      const socket = new WebSocket(this.socketUrl());
      this.socket = socket;

      socket.addEventListener("open", () => {
        this.setState("connected");
        this.send({ event: "join", data: { broadcastId: roomId, afterSequence: this.lastSequence } });
        resolve();
      });

      socket.addEventListener("message", (event: MessageEvent<unknown>) => this.handleFrame(event.data));
      socket.addEventListener("close", () => this.setState("disconnected"));
      socket.addEventListener("error", () => {
        this.setState("error");
        reject(new Error("Chat transport connection failed"));
      });
    });
  }

  disconnect(): void {
    this.socket?.close();
    this.socket = null;
    this.setState("disconnected");
  }

  subscribe(listener: (message: ChatMessage) => void): Unsubscribe {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  subscribeConnection(listener: (state: ChatConnectionState) => void): Unsubscribe {
    this.connectionListeners.add(listener);
    return () => this.connectionListeners.delete(listener);
  }

  getConnectionState(): ChatConnectionState {
    return this.state;
  }

  private handleFrame(data: unknown): void {
    const frame = this.parse(data);

    if (!frame) return;

    if (frame.type === "deleted") {
      // A tombstone has no place in a transcript the page models as
      // append-only. Its sequence still counts, or the next reconnect asks for
      // messages the server already sent.
      this.lastSequence = Math.max(this.lastSequence, frame.sequence);
      return;
    }

    if (frame.type !== "message") return;

    this.lastSequence = Math.max(this.lastSequence, frame.message.sequence);

    const message = toChatMessage(frame.message);
    this.messageListeners.forEach((listener) => listener(message));
  }

  /** A malformed frame is dropped rather than tearing down a working stream. */
  private parse(data: unknown): ServerFrame | null {
    if (typeof data !== "string") return null;

    try {
      const parsed: unknown = JSON.parse(data);

      if (typeof parsed !== "object" || parsed === null) return null;
      if (typeof (parsed as { type?: unknown }).type !== "string") return null;

      return parsed as ServerFrame;
    } catch {
      return null;
    }
  }

  private send(message: { event: string; data: unknown }): void {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(message));
  }

  private socketUrl(): string {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

    return `${protocol}//${window.location.host}/api/live/chat`;
  }

  private setState(state: ChatConnectionState): void {
    if (state === this.state) return;

    this.state = state;
    this.connectionListeners.forEach((listener) => listener(state));
  }
}
