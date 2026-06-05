export type GraphEdgeStatus =
  | "verified"
  | "visible"
  | "hidden"
  | "restored"
  | "unsupported"
  | "candidate";

export type GraphEdgeVisual = {
  stroke: string;
  strokeDasharray: string;
  marker: string;
  label: string;
};

export const graphEdgeVisualByStatus: Record<GraphEdgeStatus, GraphEdgeVisual> = {
  verified: {
    stroke: "var(--edge-verified)",
    strokeDasharray: "none",
    marker: "url(#arrow-verified)",
    label: "verified",
  },
  visible: {
    stroke: "var(--edge-visible)",
    strokeDasharray: "none",
    marker: "url(#arrow-visible)",
    label: "visible",
  },
  hidden: {
    stroke: "var(--edge-hidden)",
    strokeDasharray: "6 4",
    marker: "url(#arrow-hidden)",
    label: "hidden",
  },
  restored: {
    stroke: "var(--edge-restored)",
    strokeDasharray: "none",
    marker: "url(#arrow-restored)",
    label: "restored",
  },
  unsupported: {
    stroke: "var(--edge-unsupported)",
    strokeDasharray: "2 4",
    marker: "url(#arrow-unsupported)",
    label: "unsupported",
  },
  candidate: {
    stroke: "var(--edge-candidate)",
    strokeDasharray: "4 3",
    marker: "url(#arrow-candidate)",
    label: "candidate",
  },
};
