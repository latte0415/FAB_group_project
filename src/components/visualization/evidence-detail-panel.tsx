"use client";

import type { GraphEdgeModel } from "@/domain/visualization/build-graph-model";
import { graphEdgeVisualByStatus } from "@/domain/visualization/graph-edge-status";

type EvidenceDetailPanelProps = {
  selectedEdge: GraphEdgeModel | null;
  nodeNameById: Map<string, string>;
};

export function EvidenceDetailPanel({
  selectedEdge,
  nodeNameById,
}: EvidenceDetailPanelProps) {
  if (!selectedEdge) {
    return (
      <div className="viz-card evidence-detail-empty">
        <p className="empty-state-message">
          Click an edge on the graph to view evidence and relation details.
        </p>
      </div>
    );
  }

  const sourceName =
    nodeNameById.get(selectedEdge.sourceNodeId) ?? selectedEdge.sourceNodeId;
  const targetName =
    nodeNameById.get(selectedEdge.targetNodeId) ?? selectedEdge.targetNodeId;

  return (
    <article className="viz-card evidence-detail-card">
      <div className="panel-heading">
        <h3>Evidence detail</h3>
        <span className={`edge-status-badge status-${selectedEdge.status}`}>
          {graphEdgeVisualByStatus[selectedEdge.status].label}
        </span>
      </div>

      <p className="evidence-relation-title">
        {sourceName} → {selectedEdge.relationTypeLabel} → {targetName}
      </p>

      {selectedEdge.evidenceChunkId ? (
        <small className="evidence-meta">
          {selectedEdge.evidenceChunkId}
          {selectedEdge.sectionTitle ? ` · ${selectedEdge.sectionTitle}` : ""}
        </small>
      ) : null}

      {selectedEdge.evidenceText ? (
        <blockquote className="evidence-quote">{selectedEdge.evidenceText}</blockquote>
      ) : (
        <p className="empty">
          {selectedEdge.status === "hidden"
            ? "This relation is hidden. Restore it to view the evidence."
            : "This edge has no linked evidence text."}
        </p>
      )}
    </article>
  );
}
