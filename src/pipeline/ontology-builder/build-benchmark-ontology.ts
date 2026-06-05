import type {
  BenchmarkOntologyGraph,
  Concept,
  NodeCandidate,
  OntologyRelation,
} from "@/schemas/benchmark-ontology";

export function buildBenchmarkOntology(input: {
  nodeCandidates: NodeCandidate[];
  verifiedRelations: OntologyRelation[];
}): BenchmarkOntologyGraph {
  const requiredNodeIds = new Set<string>();

  for (const relation of input.verifiedRelations) {
    requiredNodeIds.add(relation.sourceNodeId);
    requiredNodeIds.add(relation.targetNodeId);
  }

  const nodes = input.nodeCandidates
    .filter((candidate) => requiredNodeIds.has(candidate.id))
    .map<Concept>((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      type: candidate.type,
      abstractionDepth: candidate.abstractionDepth,
      sourceChunkIds: candidate.sourceChunkIds,
    }));

  return {
    id: "benchmark-ontology-current",
    nodes,
    relations: input.verifiedRelations,
    summary: {
      nodeCount: nodes.length,
      verifiedRelationCount: input.verifiedRelations.length,
      evidenceChunkCount: new Set(
        input.verifiedRelations.map((relation) => relation.evidenceChunkId),
      ).size,
    },
  };
}
