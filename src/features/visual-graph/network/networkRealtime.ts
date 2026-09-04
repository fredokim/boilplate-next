import { isServerData } from '@/core/config/dataMode';
import { createGraphRuntimeSource, type GraphRealtimeSource } from '../realtime/graphRuntimeSource';
import { fetchTopologySnapshot, ServerTopologyTransport } from '../realtime/serverTopologySource';
import { networkGraph } from './networkGraph';

export const networkTopologyId = 'seoul-production';

/**
 * Curated starting state for the demo topology so the first paint shows a mixed
 * health picture instead of an all-green graph.
 */
export const networkRuntimeSource = createGraphRuntimeSource(networkGraph, {
  topologyId: networkTopologyId,
  eventsPerSecond: 10,
  initialNodeStatus: {
    'core-router': 'healthy',
    'edge-firewall': 'healthy',
    'api-server': 'healthy',
    'worker-server': 'warning',
  },
  initialEdgeStatus: {
    'router-to-firewall': 'active',
    'firewall-to-api': 'active',
    'firewall-to-worker': 'degraded',
  },
});

export const networkRealtimeTransport = networkRuntimeSource.transport;
export const loadNetworkRuntimeSnapshot = networkRuntimeSource.loadSnapshot;
export const createNetworkEvent = networkRuntimeSource.createEvent;

/**
 * The source the viewer uses.
 *
 * A resync is handled by reconnecting: the controller refetches the snapshot on
 * connect, which is the same path a first load takes.
 */
function createServerNetworkSource(): GraphRealtimeSource {
  let lastSequence = 0;

  const transport = new ServerTopologyTransport({
    getLastSequence: () => lastSequence,
    onResyncRequired: () => {
      lastSequence = 0;
      void transport.connect(networkTopologyId);
    },
  });

  transport.subscribe((event) => {
    lastSequence = Math.max(lastSequence, event.sequence);
  });

  return {
    topologyId: networkTopologyId,
    transport,
    loadSnapshot: (topologyId) => fetchTopologySnapshot(topologyId),
  };
}

/**
 * `dataMode` decides. In the React boilerplate the container took the mock
 * source unconditionally while a tested server transport sat unused beside it,
 * so server mode rendered a generated event stream and the page displayed
 * "Realtime: connected" while doing it.
 */
export const networkRealtimeSource: GraphRealtimeSource = isServerData
  ? createServerNetworkSource()
  : networkRuntimeSource;
