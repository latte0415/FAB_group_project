import type { Concept } from "@/schemas/benchmark-ontology";

export type PositionedNode = {
  node: Concept;
  x: number;
  y: number;
};

export function layoutNodesInCircle(
  nodes: Concept[],
  width: number,
  height: number,
): PositionedNode[] {
  if (nodes.length === 0) {
    return [];
  }

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.38;

  return nodes.map((node, index) => {
    const angle = (2 * Math.PI * index) / nodes.length - Math.PI / 2;

    return {
      node,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });
}

export function getNodePosition(
  positionedNodes: PositionedNode[],
  nodeId: string,
): { x: number; y: number } | null {
  const match = positionedNodes.find((entry) => entry.node.id === nodeId);
  return match ? { x: match.x, y: match.y } : null;
}

export function buildEdgePath(
  source: { x: number; y: number },
  target: { x: number; y: number },
): string {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const distance = Math.hypot(dx, dy) || 1;
  const offset = 22;
  const startX = source.x + (dx / distance) * offset;
  const startY = source.y + (dy / distance) * offset;
  const endX = target.x - (dx / distance) * offset;
  const endY = target.y - (dy / distance) * offset;
  const curve = Math.min(36, distance * 0.2);
  const controlX = (startX + endX) / 2 + (-dy / distance) * curve;
  const controlY = (startY + endY) / 2 + (dx / distance) * curve;

  return `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
}
