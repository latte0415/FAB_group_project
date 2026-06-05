import type {
  NodeCandidate,
  OntologyRelation,
  RelationCandidate,
  SourceChunk,
} from "@/schemas/benchmark-ontology";

export function verifyRelationEvidence(input: {
  candidateRelations: RelationCandidate[];
  nodeCandidates: NodeCandidate[];
  sourceChunks: SourceChunk[];
}): OntologyRelation[] {
  const nodeCandidateById = new Map(
    input.nodeCandidates.map((candidate) => [candidate.id, candidate]),
  );
  const chunkById = new Map(input.sourceChunks.map((chunk) => [chunk.id, chunk]));
  const verifiedRelations: OntologyRelation[] = [];

  for (const candidateRelation of input.candidateRelations) {
    const sourceCandidate = nodeCandidateById.get(candidateRelation.sourceCandidateId);
    const targetCandidate = nodeCandidateById.get(candidateRelation.targetCandidateId);
    const evidenceChunk = chunkById.get(candidateRelation.evidenceSource.chunkId);

    if (!sourceCandidate || !targetCandidate || !evidenceChunk) {
      continue;
    }

    if (candidateRelation.status !== "supported") {
      continue;
    }

    if (!evidenceChunk.text.includes(candidateRelation.evidenceSource.text)) {
      continue;
    }

    if (
      !evidenceChunk.text.toLowerCase().includes(sourceCandidate.name.toLowerCase()) ||
      !evidenceChunk.text.toLowerCase().includes(targetCandidate.name.toLowerCase())
    ) {
      continue;
    }

    verifiedRelations.push({
      id: `verified-relation-${String(verifiedRelations.length + 1).padStart(4, "0")}`,
      relationTypeId: candidateRelation.relationTypeId,
      sourceConceptId: sourceCandidate.id,
      targetConceptId: targetCandidate.id,
      sourceNodeId: sourceCandidate.id,
      targetNodeId: targetCandidate.id,
      constraintConceptIds: [],
      status: "verified",
      evidenceChunkId: evidenceChunk.id,
      evidenceText: candidateRelation.evidenceSource.text,
      evidenceSource: candidateRelation.evidenceSource,
    });
  }

  return verifiedRelations;
}
