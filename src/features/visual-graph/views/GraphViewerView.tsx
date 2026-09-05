import { connectionStatus } from "@/core/realtime/connectionStatus";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import type { GraphDocument, GraphMetadata, GraphNodePresentationResolver } from "../model/graph";
import type { GraphInteractionState, GraphRouteQueryState } from "../model/graphInteraction";
import { createGraphSearchIndex, searchGraphIndex } from "../performance/graphSearchIndex";
import { GraphCanvas, type GraphCanvasHandle } from "../components/GraphCanvas";
import type { NodeRuntimeStatus, RealtimeConnectionState, RuntimeStoreSnapshot } from "../realtime/types";
import styles from "./GraphViewer.module.scss";

type GraphViewerViewProps<
  TNodeType extends string,
  TNodeMetadata extends GraphMetadata,
  TEdgeMetadata extends GraphMetadata,
> = {
  graph: GraphDocument<TNodeType, TNodeMetadata, TEdgeMetadata>;
  interaction: GraphInteractionState;
  routeQuery: GraphRouteQueryState;
  getNodePresentation: GraphNodePresentationResolver<TNodeType>;
  onNodeSelect: (nodeId: string | null) => void;
  onNodeHover: (nodeId: string | null) => void;
  onEdgeHover: (edgeId: string | null) => void;
  onSourceChange: (nodeId: string | null) => void;
  onDestinationChange: (nodeId: string | null) => void;
  onRouteSearch: () => void;
  onRouteClear: () => void;
  onEdit: () => void;
  connectionState: RealtimeConnectionState;
  runtime: RuntimeStoreSnapshot;
  isNodeStale: (nodeId: string, thresholdMs?: number) => boolean;
  selectedMetricHistory: Record<string, number[]>;
};

function formatMetadataValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null || value === undefined) return "—";
  return JSON.stringify(value);
}

const TONE_CLASS = {
  ok: styles.connectionOk,
  busy: styles.connectionBusy,
  bad: styles.connectionBad,
} as const;

export function GraphViewerView<
  TNodeType extends string,
  TNodeMetadata extends GraphMetadata,
  TEdgeMetadata extends GraphMetadata,
>({
  connectionState,
  getNodePresentation,
  graph,
  interaction,
  isNodeStale,
  onDestinationChange,
  onEdgeHover,
  onEdit,
  onNodeHover,
  onNodeSelect,
  onRouteClear,
  onRouteSearch,
  onSourceChange,
  routeQuery,
  runtime,
  selectedMetricHistory,
}: GraphViewerViewProps<TNodeType, TNodeMetadata, TEdgeMetadata>) {
  const canvasRef = useRef<GraphCanvasHandle>(null);
  const [nodeQuery, setNodeQuery] = useState("");
  const [runtimeFilter, setRuntimeFilter] = useState<"all" | Exclude<NodeRuntimeStatus, "healthy" | "unknown">>("all");
  const [rates, setRates] = useState({ received: 0, applied: 0 });
  const previousTotals = useRef({ received: 0, applied: 0 });
  const latestTotals = useRef({ received: 0, applied: 0 });
  const deferredQuery = useDeferredValue(nodeQuery);
  const searchIndex = useMemo(() => createGraphSearchIndex(graph), [graph]);
  const matchingNodes = useMemo(
    () =>
      searchGraphIndex(searchIndex, deferredQuery)
        .slice(0, 8)
        .map((id) => graph.nodes.find((node) => node.id === id))
        .filter((node) => node !== undefined),
    [deferredQuery, graph.nodes, searchIndex],
  );
  const selectedNode = graph.nodes.find((node) => node.id === interaction.selection.nodeIds[0]);
  const hoveredEdge = graph.edges.find((edge) => edge.id === interaction.hoveredEdgeId);
  const routeNodes = interaction.activeRoute?.nodeIds.map((id) => graph.nodes.find((node) => node.id === id)).filter(Boolean) ?? [];
  const selectedRuntime = selectedNode ? runtime.nodes[selectedNode.id] : undefined;
  const averageBatchSize = runtime.diagnostics.flushCount
    ? (runtime.diagnostics.totalBatchSize / runtime.diagnostics.flushCount).toFixed(1)
    : "0";

  useEffect(() => {
    latestTotals.current = { received: runtime.diagnostics.received, applied: runtime.diagnostics.applied };
  }, [runtime.diagnostics.applied, runtime.diagnostics.received]);

  useEffect(() => {
    const rateTimer = setInterval(() => {
      const next = latestTotals.current;
      setRates({
        received: next.received - previousTotals.current.received,
        applied: next.applied - previousTotals.current.applied,
      });
      previousTotals.current = next;
    }, 1_000);
    return () => {
      clearInterval(rateTimer);
    };
  }, []);

  useEffect(() => {
    if (interaction.activeRoute) canvasRef.current?.focusRoute(interaction.activeRoute.nodeIds);
  }, [interaction.activeRoute]);

  const selectAndFocusNode = (nodeId: string) => {
    onNodeSelect(nodeId);
    canvasRef.current?.focusNode(nodeId);
  };

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <div>
          <h1 className={styles.title}>Interactive Topology Explorer</h1>
          <p className={styles.subtitle}>
            Search equipment, inspect metadata, and visualize routes calculated by an external engine.
          </p>
        </div>
        <div className={styles.headingActions}>
          <span
            className={[styles.connection, TONE_CLASS[connectionStatus(connectionState).tone]].join(" ")}
            title={connectionStatus(connectionState).detail}
            role="status"
          >
            Realtime: {connectionStatus(connectionState).label}
          </span>
          <Button onClick={onEdit}>Edit topology</Button>
        </div>
      </div>

      <Card
        title="Runtime health"
        description="Incremental counters from the realtime state store; filters dim nodes without removing topology."
      >
        <div className={styles.summaryRow}>
          {(["healthy", "warning", "critical", "offline", "unknown"] as const).map((status) => (
            <span className={styles.summaryChip} key={status}>
              <strong>{status}</strong> {runtime.summary[status]}
            </span>
          ))}
          <label className={styles.filterField}>
            Runtime filter
            <select
              className={styles.filterSelect}
              onChange={(event) => setRuntimeFilter(event.target.value as typeof runtimeFilter)}
              value={runtimeFilter}
            >
              <option value="all">All</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
              <option value="offline">Offline</option>
            </select>
          </label>
        </div>
      </Card>

      <Card title="Explore topology" description="Search by node name, id, or a primitive metadata value.">
        <div className={styles.searchGrid}>
          <div className={styles.searchAnchor}>
            <Input
              label="Find node"
              onChange={(event) => setNodeQuery(event.target.value)}
              placeholder="API Server or api-server"
              value={nodeQuery}
            />
            {nodeQuery.trim() ? (
              <div className={styles.suggestions} role="listbox">
                {matchingNodes.length ? (
                  matchingNodes.map((node) => (
                    <button
                      aria-selected={false}
                      className={styles.suggestion}
                      key={node.id}
                      onClick={() => {
                        selectAndFocusNode(node.id);
                        setNodeQuery(node.label);
                      }}
                      role="option"
                      type="button"
                    >
                      <strong className={styles.suggestionLabel}>{node.label}</strong>
                      <span className={styles.suggestionId}>{node.id}</span>
                    </button>
                  ))
                ) : (
                  <p className={styles.empty}>No matching nodes.</p>
                )}
              </div>
            ) : null}
          </div>
          <NodeSelect label="Source" nodes={graph.nodes} onChange={onSourceChange} value={interaction.sourceNodeId} />
          <NodeSelect
            label="Destination"
            nodes={graph.nodes}
            onChange={onDestinationChange}
            value={interaction.destinationNodeId}
          />
          <Button
            disabled={!interaction.sourceNodeId || !interaction.destinationNodeId || routeQuery.status === "loading"}
            isLoading={routeQuery.status === "loading"}
            onClick={onRouteSearch}
          >
            Find route
          </Button>
        </div>
        {routeQuery.status === "no-route" || routeQuery.status === "error" ? (
          <p className={[styles.alert, routeQuery.status === "error" ? styles.alertError : ""].join(" ")} role="alert">
            {routeQuery.message}
          </p>
        ) : null}
      </Card>

      <div className={styles.viewportActions}>
        <Button onClick={() => canvasRef.current?.fitAll()} size="sm" variant="secondary">
          Fit all
        </Button>
        <Button
          disabled={!interaction.selection.nodeIds.length}
          onClick={() => interaction.selection.nodeIds[0] && canvasRef.current?.focusNode(interaction.selection.nodeIds[0])}
          size="sm"
          variant="secondary"
        >
          Focus selected
        </Button>
        <Button
          disabled={!interaction.activeRoute}
          onClick={() => interaction.activeRoute && canvasRef.current?.focusRoute(interaction.activeRoute.nodeIds)}
          size="sm"
          variant="secondary"
        >
          Focus route
        </Button>
        <Button
          disabled={!interaction.activeRoute && routeQuery.status === "idle"}
          onClick={onRouteClear}
          size="sm"
          variant="ghost"
        >
          Clear route
        </Button>
      </div>

      <div className={styles.layout}>
        <GraphCanvas
          edgeRuntime={runtime.edges}
          getNodePresentation={getNodePresentation}
          graph={graph}
          interaction={interaction}
          isNodeStale={isNodeStale}
          nodeRuntime={runtime.nodes}
          onEdgeHover={onEdgeHover}
          onNodeHover={onNodeHover}
          onNodeSelect={onNodeSelect}
          ref={canvasRef}
          runtimeFilter={runtimeFilter}
        />
        <div className={styles.sidebar}>
          <Card title="Route detail" description="The ordered path returned by the route service.">
            {interaction.activeRoute ? (
              <ol aria-label="Ordered route" className={styles.routeList}>
                {routeNodes.map((node, index) =>
                  node ? (
                    <li key={node.id}>
                      <button className={styles.routeStep} onClick={() => selectAndFocusNode(node.id)} type="button">
                        <span className={styles.routeIndex}>{index + 1}</span>
                        <span>
                          <strong className={styles.routeLabel}>{node.label}</strong>
                          <small className={styles.routeType}>{getNodePresentation(node.type).typeLabel}</small>
                        </span>
                      </button>
                    </li>
                  ) : null,
                )}
              </ol>
            ) : (
              <p className={styles.empty}>Search for a route to see its ordered path.</p>
            )}
          </Card>

          <Card title="Node metadata" description="Selection remains independent from the active route.">
            {selectedNode ? (
              <>
                <MetadataList
                  entries={{
                    name: selectedNode.label,
                    type: selectedNode.type,
                    ...selectedNode.metadata,
                    runtimeStatus: selectedRuntime?.status ?? "unknown",
                    lastUpdated: selectedRuntime ? new Date(selectedRuntime.lastUpdated).toLocaleTimeString() : "—",
                    ...selectedRuntime?.metrics,
                  }}
                />
                {Object.keys(selectedMetricHistory).length ? (
                  <div className={styles.history}>
                    {Object.entries(selectedMetricHistory).map(([name, values]) => (
                      <p className={styles.historyRow} key={name}>
                        <strong>{name}</strong>: {values.slice(-8).join(" → ")}
                      </p>
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <p className={styles.empty}>No node selected.</p>
            )}
          </Card>

          <Card title="Edge metadata" description="Hover a connection to inspect it.">
            {hoveredEdge ? (
              <MetadataList entries={{ id: hoveredEdge.id, label: hoveredEdge.label ?? "—", ...hoveredEdge.metadata }} />
            ) : (
              <p className={styles.empty}>No edge hovered.</p>
            )}
          </Card>

          <Card title="Realtime debug" description="Development telemetry for buffering, ordering, and reconnect behavior.">
            <MetadataList
              entries={{
                connectionState,
                eventsReceivedPerSecond: rates.received,
                eventsAppliedPerSecond: rates.applied,
                eventsReceived: runtime.diagnostics.received,
                eventsApplied: runtime.diagnostics.applied,
                coalesced: runtime.diagnostics.coalesced,
                duplicatesIgnored: runtime.diagnostics.duplicatesIgnored,
                staleIgnored: runtime.diagnostics.staleIgnored,
                unknownEntityIgnored: runtime.diagnostics.unknownEntities,
                dropped: runtime.diagnostics.dropped,
                bufferSize: runtime.diagnostics.bufferSize,
                flushCount: runtime.diagnostics.flushCount,
                averageBatchSize,
                runtimeStateCount: Object.keys(runtime.nodes).length + Object.keys(runtime.edges).length,
                reconnectCount: runtime.diagnostics.reconnectCount,
                lastResync: runtime.diagnostics.lastResync
                  ? new Date(runtime.diagnostics.lastResync).toLocaleTimeString()
                  : "—",
              }}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}

function NodeSelect({
  label,
  nodes,
  onChange,
  value,
}: {
  label: string;
  nodes: readonly { id: string; label: string }[];
  onChange: (nodeId: string | null) => void;
  value: string | null;
}) {
  return (
    <label className={styles.nodeSelectField}>
      {label}
      <select
        className={styles.nodeSelectControl}
        onChange={(event) => onChange(event.target.value || null)}
        value={value ?? ""}
      >
        <option value="">Select {label.toLocaleLowerCase()}</option>
        {nodes.map((node) => (
          <option key={node.id} value={node.id}>
            {node.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function MetadataList({ entries }: { entries: GraphMetadata }) {
  return (
    <dl className={styles.metadata}>
      {Object.entries(entries).map(([key, value]) => (
        <div key={key}>
          <dt className={styles.metadataKey}>{key}</dt>
          <dd className={styles.metadataValue}>{formatMetadataValue(value)}</dd>
        </div>
      ))}
    </dl>
  );
}
