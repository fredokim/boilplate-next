import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { memo } from "react";
import type { GraphNodePresentation } from "../model/graph";
import type { GraphNodeVisualState } from "../model/graphInteraction";
import type { GraphDetailLevel } from "../performance/graphViewAdapter";
import type { NodeRuntimeState, NodeRuntimeStatus } from "../realtime/types";
import styles from "./GraphCanvas.module.scss";

export type GraphNodeData = {
  label: string;
  presentation: GraphNodePresentation;
  visualState: GraphNodeVisualState;
  editable: boolean;
  validationError: boolean;
  detailLevel: GraphDetailLevel;
  runtimeState?: NodeRuntimeState;
  runtimeStale: boolean;
  runtimeFiltered: boolean;
};

export type GraphFlowNode = Node<GraphNodeData, "graph-node">;

const runtimeStatusIcon: Record<NodeRuntimeStatus, string> = {
  unknown: "?",
  healthy: "✓",
  warning: "!",
  critical: "×",
  offline: "○",
};

const runtimeNodeClass: Partial<Record<NodeRuntimeStatus, string | undefined>> = {
  warning: styles.runtimeWarning,
  critical: styles.runtimeCritical,
  offline: styles.runtimeOffline,
};

const runtimeBadgeClass: Partial<Record<NodeRuntimeStatus, string | undefined>> = {
  healthy: styles.badgeHealthy,
  warning: styles.badgeWarning,
  critical: styles.badgeCritical,
  offline: styles.badgeOffline,
};

function GraphNodeCardComponent({ data, selected }: NodeProps<GraphFlowNode>) {
  const { dimmed, hovered, routeRole } = data.visualState;
  const status = data.runtimeState?.status ?? "unknown";
  return (
    <div
      aria-label={`${data.label}, ${status}${data.runtimeStale ? ", stale" : ""}`}
      className={[
        styles.node,
        selected ? styles.selected : "",
        hovered ? styles.hovered : "",
        dimmed ? styles.dimmed : "",
        data.runtimeFiltered ? styles.runtimeFiltered : "",
        routeRole !== "none" ? [styles.route, styles[routeRole] ?? ""].join(" ") : "",
        data.validationError ? styles.error : "",
        runtimeNodeClass[status] ?? "",
        data.runtimeStale ? styles.runtimeStale : "",
      ].join(" ")}
      data-route-role={routeRole}
      data-runtime-status={status}
    >
      <Handle className={styles.handle} id="input" isConnectable={data.editable} position={Position.Left} type="target" />
      <span className={styles.icon} style={{ backgroundColor: data.presentation.color }}>
        {data.presentation.icon}
      </span>
      <span>
        <strong className={styles.label}>{data.label}</strong>
        {data.detailLevel !== "compact" ? <small className={styles.type}>{data.presentation.typeLabel}</small> : null}
      </span>
      {routeRole === "source" || routeRole === "destination" ? (
        <span className={styles.routeRole}>{routeRole === "source" ? "Start" : "End"}</span>
      ) : null}
      {data.detailLevel !== "compact" ? (
        <span
          className={[styles.runtimeBadge, runtimeBadgeClass[status] ?? ""].join(" ")}
          title={data.runtimeStale ? "Runtime data is stale" : status}
        >
          <span aria-hidden="true">{data.runtimeStale ? "◷" : runtimeStatusIcon[status]}</span>
          {data.runtimeStale ? "Stale" : status}
        </span>
      ) : null}
      <Handle className={styles.handle} id="output" isConnectable={data.editable} position={Position.Right} type="source" />
    </div>
  );
}

export const GraphNodeCard = memo(
  GraphNodeCardComponent,
  (previous, next) =>
    previous.selected === next.selected &&
    previous.data.label === next.data.label &&
    previous.data.detailLevel === next.data.detailLevel &&
    previous.data.editable === next.data.editable &&
    previous.data.validationError === next.data.validationError &&
    previous.data.runtimeState === next.data.runtimeState &&
    previous.data.runtimeStale === next.data.runtimeStale &&
    previous.data.runtimeFiltered === next.data.runtimeFiltered &&
    previous.data.visualState.selected === next.data.visualState.selected &&
    previous.data.visualState.hovered === next.data.visualState.hovered &&
    previous.data.visualState.dimmed === next.data.visualState.dimmed &&
    previous.data.visualState.routeRole === next.data.visualState.routeRole,
);
