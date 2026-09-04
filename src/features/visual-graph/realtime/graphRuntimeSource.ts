import type { GraphDocument } from '../model/graph';
import { MockTopologyTransport } from './mockTransport';
import type { TopologyRealtimeTransport } from './transport';
import type {
  EdgeRuntimeState,
  EdgeRuntimeStatus,
  NodeRuntimeState,
  NodeRuntimeStatus,
  RuntimeSnapshotProvider,
  TopologyRealtimeEvent,
  TopologyRuntimeSnapshot,
} from './types';

export type GraphRuntimeSourceOptions = {
  topologyId?: string;
  eventsPerSecond?: number;
  disconnectAfterMs?: number;
  initialEvents?: readonly TopologyRealtimeEvent[];
  initialNodeStatus?: Readonly<Record<string, NodeRuntimeStatus>>;
  initialEdgeStatus?: Readonly<Record<string, EdgeRuntimeStatus>>;
};

/**
 * Replays a fixed event list on every (re)connect and can drop the link on a timer,
 * which is what the duplicate, out-of-order, and reconnect stories exercise.
 */
class ScriptedMockTransport extends MockTopologyTransport {
  private dropTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly initialEvents: readonly TopologyRealtimeEvent[],
    private readonly disconnectAfterMs: number,
  ) {
    super();
  }

  override async connect() {
    await super.connect();
    for (const event of this.initialEvents) this.emit(event);
    if (this.disconnectAfterMs > 0 && !this.dropTimer) {
      this.dropTimer = setTimeout(() => {
        this.dropTimer = null;
        this.simulateDrop();
      }, this.disconnectAfterMs);
    }
  }

  override disconnect() {
    if (this.dropTimer) clearTimeout(this.dropTimer);
    this.dropTimer = null;
    super.disconnect();
  }
}

/**
 * What the viewer actually needs: something to connect to and a snapshot to
 * seed from. The scripted mock satisfies it, and so does the server transport.
 *
 * The viewer used to take the mock type directly, which is why server mode had
 * nowhere to plug in.
 */
export type GraphRealtimeSource = {
  topologyId: string;
  transport: TopologyRealtimeTransport;
  loadSnapshot: RuntimeSnapshotProvider;
  /**
   * Starts the scripted event generator and returns a stop function. Absent on
   * a server source — a fabricated stream on top of the gateway's real one
   * would be indistinguishable from real traffic in the UI.
   */
  driveEvents?: () => () => void;
};

export type GraphRuntimeSource = GraphRealtimeSource & {
  topologyId: string;
  transport: ScriptedMockTransport;
  createEvent: (index: number) => TopologyRealtimeEvent;
  eventsPerSecond: number;
  disconnectAfterMs: number;
};

const cycledStatuses: readonly NodeRuntimeStatus[] = ['healthy', 'warning', 'critical', 'offline'];

/**
 * Drives the realtime layer from an arbitrary GraphDocument so the same mock server
 * serves the four-node demo topology and the large-graph performance fixtures.
 * The server keeps its own authoritative state, which lets resync return a snapshot
 * that is consistent with the deltas already emitted.
 */
export function createGraphRuntimeSource(
  graph: GraphDocument,
  options: GraphRuntimeSourceOptions = {},
): GraphRuntimeSource {
  const topologyId = options.topologyId ?? 'network-topology';
  const nodeIds = graph.nodes.map((node) => node.id);
  const edgeIds = graph.edges.map((edge) => edge.id);
  const capturedAt = Date.now();
  let revision = 1;

  const nodes: Record<string, NodeRuntimeState> = {};
  graph.nodes.forEach((node, index) => {
    nodes[node.id] = {
      status: options.initialNodeStatus?.[node.id] ?? (index % 19 === 0 ? 'warning' : 'healthy'),
      metrics: { cpu: 30 + (index % 45), memory: 40 + (index % 35) },
      lastUpdated: capturedAt,
      sequence: revision,
    };
  });

  const edges: Record<string, EdgeRuntimeState> = {};
  graph.edges.forEach((edge, index) => {
    edges[edge.id] = {
      status: options.initialEdgeStatus?.[edge.id] ?? 'active',
      metrics: { latency: 4 + (index % 40), throughput: 100 + (index % 900) },
      lastUpdated: capturedAt,
      sequence: revision,
    };
  });

  const loadSnapshot: RuntimeSnapshotProvider = async (requestedTopologyId) => {
    if (requestedTopologyId !== topologyId) throw new Error(`Unknown topology: ${requestedTopologyId}`);
    await Promise.resolve();
    return { topologyId, revision, capturedAt: Date.now(), nodes: { ...nodes }, edges: { ...edges } };
  };

  const createEvent = (index: number): TopologyRealtimeEvent => {
    const sequence = ++revision;
    const timestamp = Date.now();
    const useNode = index % 4 !== 0 || !edgeIds.length;

    if (useNode) {
      const entityId = nodeIds[index % nodeIds.length] ?? 'unknown';
      const current = nodes[entityId];
      if (index % 3 === 0) {
        const status = cycledStatuses[Math.floor(index / 3) % cycledStatuses.length] ?? 'unknown';
        nodes[entityId] = { status, metrics: current?.metrics ?? {}, lastUpdated: timestamp, sequence };
        return { eventId: `status-${String(sequence)}`, topologyId, entityId, timestamp, sequence, type: 'NODE_STATUS_CHANGED', payload: { status } };
      }
      const metrics = { cpu: 30 + ((index * 17) % 68), memory: 40 + ((index * 11) % 55) };
      nodes[entityId] = { status: current?.status ?? 'unknown', metrics, lastUpdated: timestamp, sequence };
      return { eventId: `metric-${String(sequence)}`, topologyId, entityId, timestamp, sequence, type: 'NODE_METRIC_UPDATED', payload: { metrics } };
    }

    const entityId = edgeIds[index % edgeIds.length] ?? 'unknown';
    const current = edges[entityId];
    const metrics = { latency: 5 + ((index * 13) % 80), throughput: 100 + ((index * 29) % 900) };
    edges[entityId] = { status: current?.status ?? 'unknown', metrics, lastUpdated: timestamp, sequence };
    return { eventId: `edge-metric-${String(sequence)}`, topologyId, entityId, timestamp, sequence, type: 'EDGE_METRIC_UPDATED', payload: { metrics } };
  };

  const scriptedTransport = new ScriptedMockTransport(options.initialEvents ?? [], options.disconnectAfterMs ?? 0);
  const perSecond = options.eventsPerSecond ?? 10;

  return {
    topologyId,
    transport: scriptedTransport,
    loadSnapshot,
    createEvent,
    eventsPerSecond: perSecond,
    disconnectAfterMs: options.disconnectAfterMs ?? 0,
    // Spread rather than an explicit undefined: absent is what "this source
    // generates nothing" means, and that is how a server source is recognised.
    ...(perSecond
      ? {
          driveEvents: () => {
            scriptedTransport.startStress(perSecond, createEvent);
            return () => scriptedTransport.stopStress();
          },
        }
      : {}),
  };
}

export type { TopologyRuntimeSnapshot };
