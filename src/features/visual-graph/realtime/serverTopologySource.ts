import { requestDto } from "@/core/api/clientApiClient";
import { TopologySnapshotDto } from "./topologySnapshot.dto";
import type { TopologyRealtimeTransport, Unsubscribe } from "./transport";
import { parseServerTopologyFrame } from "./serverTopologyFrame";
import type { RealtimeConnectionState, TopologyRealtimeEvent, TopologyRuntimeSnapshot } from "./types";

/**
 * The real server transport, alongside the mock one rather than replacing it.
 *
 * The socket URL carries no token: this app keeps the access token in an
 * HttpOnly cookie its own server sets, so the browser attaches it to a
 * same-origin handshake and the rewrite forwards it. The snapshot goes through
 * `requestDto`, which means it gets the 401 refresh and retry for free.
 *
 * Nothing here touches the runtime store or the controller. Batching,
 * coalescing, the pending cap, and backoff are all upstream and untouched.
 */
export async function fetchTopologySnapshot(graphId: string): Promise<TopologyRuntimeSnapshot> {
  const response = await requestDto(
    { method: "GET", url: `/api/graphs/${graphId}/topology/snapshot` },
    TopologySnapshotDto,
  );

  return {
    topologyId: response.topologyId,
    revision: response.revision,
    capturedAt: response.capturedAt,
    nodes: response.nodes as TopologyRuntimeSnapshot["nodes"],
    edges: response.edges as TopologyRuntimeSnapshot["edges"],
  };
}

export type ServerTopologyOptions = {
  getLastSequence: () => number;
  onResyncRequired: (reason: string) => void;
};

export class ServerTopologyTransport implements TopologyRealtimeTransport {
  private socket: WebSocket | null = null;
  private state: RealtimeConnectionState = "disconnected";
  private readonly eventListeners = new Set<(event: TopologyRealtimeEvent) => void>();
  private readonly connectionListeners = new Set<(state: RealtimeConnectionState) => void>();

  constructor(private readonly options: ServerTopologyOptions) {}

  connect(topologyId: string): Promise<void> {
    this.disconnect();
    this.setState("connecting");

    return new Promise((resolve, reject) => {
      const socket = new WebSocket(this.socketUrl());
      this.socket = socket;

      socket.addEventListener("open", () => {
        this.setState("connected");
        this.send({ event: "subscribe", data: { graphId: topologyId, lastSequence: this.options.getLastSequence() } });
        resolve();
      });

      socket.addEventListener("message", (event: MessageEvent<unknown>) => this.handleFrame(event.data));
      socket.addEventListener("close", () => this.setState("disconnected"));
      socket.addEventListener("error", () => {
        this.setState("error");
        reject(new Error("Realtime transport connection failed"));
      });
    });
  }

  disconnect(): void {
    this.socket?.close();
    this.socket = null;
    this.setState("disconnected");
  }

  subscribe(listener: (event: TopologyRealtimeEvent) => void): Unsubscribe {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  subscribeConnection(listener: (state: RealtimeConnectionState) => void): Unsubscribe {
    this.connectionListeners.add(listener);
    return () => this.connectionListeners.delete(listener);
  }

  getConnectionState(): RealtimeConnectionState {
    return this.state;
  }

  private handleFrame(data: unknown): void {
    const frame = parseServerTopologyFrame(data);

    if (frame.kind === "event") {
      this.eventListeners.forEach((listener) => listener(frame.event));
      return;
    }

    if (frame.kind === "resync-required") this.options.onResyncRequired(frame.reason);

    // An `error` frame is deliberately not acted on here, as before. React sets
    // its transport to `error` on one; this app leaves the connection alone. The
    // difference is recorded rather than changed in a pass about validation.
  }

  private send(message: { event: string; data: unknown }): void {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(message));
  }

  private socketUrl(): string {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

    return `${protocol}//${window.location.host}/api/topology`;
  }

  private setState(state: RealtimeConnectionState): void {
    if (state === this.state) return;

    this.state = state;
    this.connectionListeners.forEach((listener) => listener(state));
  }
}
