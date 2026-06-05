import {
  cleanRelationPhrase,
  findNodesInText,
  resolveNodeCandidate,
} from "@/domain/ontology/resolve-node-candidate";
import { getRelationVerbPatterns } from "@/lib/config/relation-extraction-config";
import type {
  NodeCandidate,
  RelationCandidate,
  RelationType,
  SourceChunk,
} from "@/schemas/benchmark-ontology";

export function extractRelationCandidates(input: {
  sourceChunks: SourceChunk[];
  nodeCandidates: NodeCandidate[];
  relationTypes: RelationType[];
}): RelationCandidate[] {
  const allowedRelationTypeIds = new Set(
    input.relationTypes.map((relationType) => relationType.id),
  );
  const relationTypeById = new Map(
    input.relationTypes.map((relationType) => [relationType.id, relationType]),
  );
  const patterns = getRelationVerbPatterns().filter((pattern) =>
    allowedRelationTypeIds.has(pattern.relationTypeId),
  );
  const relationCandidates: RelationCandidate[] = [];
  const seen = new Set<string>();

  for (const chunk of input.sourceChunks) {
    const nodesInText = findNodesInText(input.nodeCandidates, chunk.text);

    for (const proseCandidate of extractProsePatternCandidates({
      chunk,
      nodesInText,
      relationTypeById,
      seen,
      relationCandidates,
    })) {
      relationCandidates.push(proseCandidate);
    }

    for (const pattern of patterns) {
      const relationType = relationTypeById.get(pattern.relationTypeId);
      const verbAlternation = pattern.verbs.map(escapeRegExp).join("|");
      const regex = new RegExp(
        `\\b([A-Za-z][A-Za-z'’\\s-]{0,78}?)\\s+(${verbAlternation})\\s+([A-Za-z][A-Za-z'’\\s-]{0,78}?)(?=[.,;:!?）)]|$)`,
        "giu",
      );

      for (const match of chunk.text.matchAll(regex)) {
        const verb = match[2] ?? "";
        const sourcePhrase = cleanRelationPhrase(match[1] ?? "");
        const targetPhrase = cleanRelationPhrase(match[3] ?? "");
        const sourceCandidate = resolveNodeCandidate(nodesInText, sourcePhrase);
        const targetCandidate = resolveNodeCandidate(nodesInText, targetPhrase);

        if (!sourceCandidate || !targetCandidate) {
          continue;
        }

        if (sourceCandidate.id === targetCandidate.id) {
          continue;
        }

        if (
          !isOrderedEvidenceMatch(
            chunk.text,
            sourceCandidate.name,
            verb,
            targetCandidate.name,
          )
        ) {
          continue;
        }

        const key = `${chunk.id}:${pattern.relationTypeId}:${sourceCandidate.id}:${targetCandidate.id}`;

        if (seen.has(key)) {
          continue;
        }

        seen.add(key);
        const typeCheck = evaluateTypeConstraints(
          relationType,
          sourceCandidate,
          targetCandidate,
        );

        relationCandidates.push({
          id: `relation-candidate-${String(relationCandidates.length + 1).padStart(4, "0")}`,
          relationTypeId: pattern.relationTypeId,
          sourceCandidateId: sourceCandidate.id,
          targetCandidateId: targetCandidate.id,
          evidenceSource: {
            chunkId: chunk.id,
            text: chunk.text,
          },
          confidence: typeCheck.ok ? 0.72 : 0.48,
          extractionRationale: `Matched "${sourceCandidate.name} ${verb} ${targetCandidate.name}" in source evidence.`,
          status: typeCheck.ok ? "supported" : "unsupported",
          unsupportedReason: typeCheck.ok ? undefined : typeCheck.reason,
        });
      }
    }
  }

  return relationCandidates;
}

function extractProsePatternCandidates(input: {
  chunk: SourceChunk;
  nodesInText: NodeCandidate[];
  relationTypeById: Map<string, RelationType>;
  seen: Set<string>;
  relationCandidates: RelationCandidate[];
}): RelationCandidate[] {
  const proseCandidates: RelationCandidate[] = [];
  const referPattern =
    /\brefer(?:s|red)?\s+to\s+(.{2,60}?)\s+as\s+[“"']([^”"']{2,60})[”"']/giu;

  for (const match of input.chunk.text.matchAll(referPattern)) {
    const sourcePhrase = cleanRelationPhrase(match[1] ?? "");
    const targetPhrase = cleanRelationPhrase(match[2] ?? "");
    const sourceCandidate = resolveNodeCandidate(input.nodesInText, sourcePhrase);
    const targetCandidate = resolveNodeCandidate(input.nodesInText, targetPhrase);
    const relationType = input.relationTypeById.get("represents");

    if (!sourceCandidate || !targetCandidate || !relationType) {
      continue;
    }

    const key = `${input.chunk.id}:represents:${sourceCandidate.id}:${targetCandidate.id}`;

    if (input.seen.has(key)) {
      continue;
    }

    input.seen.add(key);
    const typeCheck = evaluateTypeConstraints(
      relationType,
      sourceCandidate,
      targetCandidate,
    );

    proseCandidates.push({
      id: `relation-candidate-${String(input.relationCandidates.length + proseCandidates.length + 1).padStart(4, "0")}`,
      relationTypeId: "represents",
      sourceCandidateId: sourceCandidate.id,
      targetCandidateId: targetCandidate.id,
      evidenceSource: {
        chunkId: input.chunk.id,
        text: input.chunk.text,
      },
      confidence: typeCheck.ok ? 0.7 : 0.46,
      extractionRationale: `Matched prose pattern "${sourceCandidate.name} refer to ${targetCandidate.name}" in source evidence.`,
      status: typeCheck.ok ? "supported" : "unsupported",
      unsupportedReason: typeCheck.ok ? undefined : typeCheck.reason,
    });
  }

  return proseCandidates;
}

function evaluateTypeConstraints(
  relationType: RelationType | undefined,
  sourceCandidate: NodeCandidate,
  targetCandidate: NodeCandidate,
): { ok: true } | { ok: false; reason: string } {
  if (
    relationType?.allowedSourceTypes &&
    !relationType.allowedSourceTypes.includes(sourceCandidate.type)
  ) {
    return {
      ok: false,
      reason: `Source type "${sourceCandidate.type}" is outside allowed source types for "${relationType.id}".`,
    };
  }

  if (
    relationType?.allowedTargetTypes &&
    !relationType.allowedTargetTypes.includes(targetCandidate.type)
  ) {
    return {
      ok: false,
      reason: `Target type "${targetCandidate.type}" is outside allowed target types for "${relationType.id}".`,
    };
  }

  return { ok: true };
}

function isOrderedEvidenceMatch(
  evidenceText: string,
  sourceName: string,
  verb: string,
  targetName: string,
): boolean {
  const lowerEvidence = evidenceText.toLowerCase();
  const sourceIndex = lowerEvidence.indexOf(sourceName.toLowerCase());
  const verbIndex = lowerEvidence.indexOf(verb.toLowerCase());
  const targetIndex = lowerEvidence.indexOf(targetName.toLowerCase());

  return sourceIndex >= 0 && verbIndex > sourceIndex && targetIndex > verbIndex;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
