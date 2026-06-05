"use client";

import { useMemo, useState } from "react";

import {
  buildEdgePath,
  getNodePosition,
  layoutNodesInCircle,
} from "@/domain/visualization/graph-layout";
import {
  graphEdgeVisualByStatus,
  type GraphEdgeStatus,
} from "@/domain/visualization/graph-edge-status";
import type { GraphEdgeModel, GraphModel } from "@/domain/visualization/build-graph-model";

type OntologyGraphViewProps = {
  graph: GraphModel | null;
  selectedEdgeId: string | null;
  onSelectEdge: (edge: GraphEdgeModel | null) => void;
};

const graphWidth = 560;
const graphHeight = 520;
const minZoom = 0.75;
const maxZoom = 2.5;
const zoomStep = 0.25;

const edgeStatuses = [
  "verified",
  "visible",
  "hidden",
  "restored",
  "unsupported",
  "candidate",
] as const satisfies readonly GraphEdgeStatus[];

export function OntologyGraphView({
  graph,
  selectedEdgeId,
  onSelectEdge,
}: OntologyGraphViewProps) {
  const [zoom, setZoom] = useState(1);

  const positionedNodes = useMemo(() => {
    if (!graph) {
      return [];
    }

    return layoutNodesInCircle(graph.nodes, graphWidth, graphHeight);
  }, [graph]);

  const activeStatuses = useMemo(() => {
    if (!graph) {
      return [];
    }

    const statuses = new Set(graph.edges.map((edge) => edge.status));
    return edgeStatuses.filter((status) => statuses.has(status));
  }, [graph]);

  const viewBox = useMemo(() => {
    const width = graphWidth / zoom;
    const height = graphHeight / zoom;
    const x = (graphWidth - width) / 2;
    const y = (graphHeight - height) / 2;

    return `${x} ${y} ${width} ${height}`;
  }, [zoom]);

  function clampZoom(value: number) {
    return Math.min(maxZoom, Math.max(minZoom, value));
  }

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    const direction = event.deltaY > 0 ? -zoomStep : zoomStep;
    setZoom((current) => clampZoom(Number((current + direction).toFixed(2))));
  }

  if (!graph || graph.nodes.length === 0) {
    return (
      <div className="viz-card ontology-graph-empty">
        <p className="empty-state-message">
          Run pipeline steps to display the ontology graph.
        </p>
      </div>
    );
  }

  return (
    <div className="viz-card ontology-graph-card">
      <div className="panel-heading">
        <h3>Ontology graph</h3>
        <strong>
          {graph.nodes.length} nodes · {graph.edges.length} edges
        </strong>
      </div>

      <div className="ontology-graph-toolbar">
        <span className="ontology-graph-zoom-label">
          Zoom {Math.round(zoom * 100)}%
        </span>
        <div className="ontology-graph-zoom-actions">
          <button
            aria-label="Zoom out"
            className="secondary-action ontology-graph-zoom-button"
            disabled={zoom <= minZoom}
            onClick={() => setZoom((current) => clampZoom(current - zoomStep))}
            type="button"
          >
            −
          </button>
          <button
            className="secondary-action ontology-graph-zoom-button"
            onClick={() => setZoom(1)}
            type="button"
          >
            Reset
          </button>
          <button
            aria-label="Zoom in"
            className="secondary-action ontology-graph-zoom-button"
            disabled={zoom >= maxZoom}
            onClick={() => setZoom((current) => clampZoom(current + zoomStep))}
            type="button"
          >
            +
          </button>
        </div>
      </div>

      {activeStatuses.length > 0 ? (
        <div className="graph-legend">
          {activeStatuses.map((status) => (
            <span className={`graph-legend-item status-${status}`} key={status}>
              <span className="graph-legend-line" />
              {graphEdgeVisualByStatus[status].label}
            </span>
          ))}
        </div>
      ) : null}

      <div className="ontology-graph-viewport" onWheel={handleWheel}>
        <svg
          aria-label="Ontology graph"
          className="ontology-graph-svg"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          viewBox={viewBox}
        >
          <defs>
            {edgeStatuses.map((status) => (
              <marker
                id={`arrow-${status}`}
                key={status}
                markerHeight="8"
                markerUnits="strokeWidth"
                markerWidth="8"
                orient="auto"
                refX="8"
                refY="4"
              >
                <path
                  d="M0,0 L8,4 L0,8 z"
                  fill={graphEdgeVisualByStatus[status].stroke}
                />
              </marker>
            ))}
          </defs>

          {graph.edges.map((edge) => {
            const source = getNodePosition(positionedNodes, edge.sourceNodeId);
            const target = getNodePosition(positionedNodes, edge.targetNodeId);

            if (!source || !target) {
              return null;
            }

            const visual = graphEdgeVisualByStatus[edge.status];
            const path = buildEdgePath(source, target);
            const isSelected = selectedEdgeId === edge.id;
            const midX = (source.x + target.x) / 2;
            const midY = (source.y + target.y) / 2;

            function handleEdgeSelect() {
              onSelectEdge(edge);
            }

            return (
              <g key={edge.id}>
                <path
                  className="graph-edge-hit"
                  d={path}
                  fill="none"
                  onClick={handleEdgeSelect}
                  stroke="transparent"
                  strokeWidth={16}
                />
                <path
                  className={`graph-edge-path ${isSelected ? "selected" : ""}`}
                  d={path}
                  fill="none"
                  markerEnd={visual.marker}
                  pointerEvents="none"
                  stroke={visual.stroke}
                  strokeDasharray={visual.strokeDasharray}
                  strokeWidth={isSelected ? 2.8 : 1.8}
                />
                <text
                  className={`graph-edge-label ${isSelected ? "selected" : ""}`}
                  onClick={handleEdgeSelect}
                  x={midX}
                  y={midY - 6}
                >
                  {edge.relationTypeLabel}
                </text>
              </g>
            );
          })}

          {positionedNodes.map(({ node, x, y }) => (
            <g className="graph-node-group" key={node.id} transform={`translate(${x}, ${y})`}>
              <circle className="graph-node-circle" cx={0} cy={0} r={24} />
              <text className="graph-node-type" dy={-30} textAnchor="middle">
                {node.type}
              </text>
              <text className="graph-node-label" dy={4} textAnchor="middle">
                {truncateLabel(node.name, 14)}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

function truncateLabel(label: string, maxLength: number) {
  if (label.length <= maxLength) {
    return label;
  }

  return `${label.slice(0, maxLength - 1)}…`;
}
