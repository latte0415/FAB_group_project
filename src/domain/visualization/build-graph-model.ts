import type {
  Concept,
  LearnerFacingOntology,
  OntologyRelation,
  RelationCandidate,
} from "@/schemas/benchmark-ontology";

import type { GraphEdgeStatus } from "@/domain/visualization/graph-edge-status";

export type GraphEdgeModel = {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationTypeId: string;
  relationTypeLabel: string;
  status: GraphEdgeStatus;
  evidenceText?: string;
  evidenceChunkId?: string;
  sectionTitle?: string;
};

export type GraphModel = {
  nodes: Concept[];
  edges: GraphEdgeModel[];
};

export function buildBenchmarkGraphModel(input: {
  nodes: Concept[];
  relations: OntologyRelation[];
  relationTypeNameById: Map<string, string>;
}): GraphModel {
  return {
    nodes: input.nodes,
    edges: input.relations.map((relation) => ({
      id: relation.id,
      sourceNodeId: relation.sourceNodeId,
      targetNodeId: relation.targetNodeId,
      relationTypeId: relation.relationTypeId,
      relationTypeLabel:
        input.relationTypeNameById.get(relation.relationTypeId) ??
        relation.relationTypeId,
      status: "verified",
      evidenceText: relation.evidenceText,
      evidenceChunkId: relation.evidenceChunkId,
    })),
  };
}

export function buildLearnerFacingGraphModel(input: {
  learnerFacingOntology: LearnerFacingOntology;
  relationTypeNameById: Map<string, string>;
  restoredRelationIds: Set<string>;
}): GraphModel {
  const visibleEdges: GraphEdgeModel[] =
    input.learnerFacingOntology.visibleRelations.map((relation) => ({
      id: relation.id,
      sourceNodeId: relation.sourceNodeId,
      targetNodeId: relation.targetNodeId,
      relationTypeId: relation.relationTypeId,
      relationTypeLabel:
        input.relationTypeNameById.get(relation.relationTypeId) ??
        relation.relationTypeId,
      status: "visible",
      evidenceText: relation.evidenceText,
      evidenceChunkId: relation.evidenceChunkId,
    }));

  const hiddenEdges: GraphEdgeModel[] =
    input.learnerFacingOntology.hiddenTasks.map((task) => {
      const isRestored = input.restoredRelationIds.has(task.benchmarkRelationId);

      return {
        id: task.id,
        sourceNodeId: task.sourceNodeId,
        targetNodeId: task.targetNodeId,
        relationTypeId: task.relationTypeId,
        relationTypeLabel: isRestored
          ? (input.relationTypeNameById.get(task.relationTypeId) ??
            task.relationTypeId)
          : "???",
        status: isRestored ? "restored" : "hidden",
      };
    });

  return {
    nodes: input.learnerFacingOntology.nodes,
    edges: [...visibleEdges, ...hiddenEdges],
  };
}

export function buildCandidateGraphModel(input: {
  nodes: Concept[];
  candidateRelations: RelationCandidate[];
  nodeNameById: Map<string, string>;
  relationTypeNameById: Map<string, string>;
}): GraphModel {
  return {
    nodes: input.nodes,
    edges: input.candidateRelations.map((relation) => ({
      id: relation.id,
      sourceNodeId: relation.sourceCandidateId,
      targetNodeId: relation.targetCandidateId,
      relationTypeId: relation.relationTypeId,
      relationTypeLabel:
        input.relationTypeNameById.get(relation.relationTypeId) ??
        relation.relationTypeId,
      status: relation.status === "supported" ? "candidate" : "unsupported",
      evidenceText: relation.evidenceSource.text,
      evidenceChunkId: relation.evidenceSource.chunkId,
    })),
  };
}
