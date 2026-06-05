import { getLlmConfig } from "@/lib/config/llm-config";
import { reportBatchProgress } from "@/lib/pipeline/stage-progress";
import type { LlmValidationClient, RelationValidationInput } from "@/lib/llm/types";
import type {
  NodeCandidate,
  RelationCandidate,
  RelationType,
} from "@/schemas/benchmark-ontology";
import type { LlmRelationValidationRecord } from "@/schemas/llm-validation";

export function buildRelationValidationInputs(input: {
  candidateRelations: RelationCandidate[];
  nodeCandidates: NodeCandidate[];
  relationTypes: RelationType[];
}): RelationValidationInput[] {
  const nodeById = new Map(
    input.nodeCandidates.map((candidate) => [candidate.id, candidate]),
  );

  return input.candidateRelations.flatMap((candidate) => {
    const sourceNode = nodeById.get(candidate.sourceCandidateId);
    const targetNode = nodeById.get(candidate.targetCandidateId);

    if (!sourceNode || !targetNode) {
      return [];
    }

    return [
      {
        candidate,
        sourceNodeName: sourceNode.name,
        targetNodeName: targetNode.name,
        evidenceText: candidate.evidenceSource.text,
        relationTypes: input.relationTypes,
      },
    ];
  });
}

export async function validateRelationCandidatesWithLlm(input: {
  candidateRelations: RelationCandidate[];
  nodeCandidates: NodeCandidate[];
  relationTypes: RelationType[];
  llmClient: LlmValidationClient;
  scoreThreshold?: number;
  onProgress?: (percent: number) => void;
  progressRange?: { start: number; end: number };
}): Promise<{ candidateRelations: RelationCandidate[]; warnings: string[] }> {
  const threshold = input.scoreThreshold ?? getLlmConfig().relationScoreThreshold;
  const batchSize = getLlmConfig().batchSize;
  const validationInputs = buildRelationValidationInputs({
    candidateRelations: input.candidateRelations,
    nodeCandidates: input.nodeCandidates,
    relationTypes: input.relationTypes,
  });
  const validationByCandidateId = new Map<string, LlmRelationValidationRecord>();
  const warnings: string[] = [];
  const allowedRelationTypeIds = new Set(
    input.relationTypes.map((relationType) => relationType.id),
  );
  const totalBatches = Math.max(1, Math.ceil(validationInputs.length / batchSize));
  const progressRange = input.progressRange ?? { start: 0, end: 100 };

  for (let index = 0; index < validationInputs.length; index += batchSize) {
    const batch = validationInputs.slice(index, index + batchSize);
    const completedBatches = Math.floor(index / batchSize) + 1;

    try {
      const results = await input.llmClient.validateRelations(batch);

      for (const result of results) {
        validationByCandidateId.set(result.candidateId, {
          isValid: result.isValid,
          score: result.score,
          rationale: result.rationale,
          confirmedRelationTypeId: result.confirmedRelationTypeId,
        });
      }
    } catch {
      warnings.push(
        `Relation LLM validation batch ${completedBatches}/${totalBatches} failed; retained heuristic candidates from that batch.`,
      );

      for (const validationInput of batch) {
        if (validationInput.candidate.status !== "supported") {
          continue;
        }

        validationByCandidateId.set(validationInput.candidate.id, {
          isValid: true,
          score: threshold,
          rationale: "LLM batch validation failed; retained heuristic candidate.",
          confirmedRelationTypeId: validationInput.candidate.relationTypeId,
        });
      }
    }

    reportBatchProgress({
      onProgress: input.onProgress,
      startPercent: progressRange.start,
      endPercent: progressRange.end,
      completedBatches,
      totalBatches,
    });
  }

  const validatedCandidates: RelationCandidate[] = [];

  for (const candidate of input.candidateRelations) {
    const validation = validationByCandidateId.get(candidate.id);

    if (!validation || !validation.isValid || validation.score < threshold) {
      continue;
    }

    const confirmedRelationTypeId = validation.confirmedRelationTypeId;

    if (
      confirmedRelationTypeId &&
      !allowedRelationTypeIds.has(confirmedRelationTypeId)
    ) {
      continue;
    }

    validatedCandidates.push({
      ...candidate,
      relationTypeId: confirmedRelationTypeId ?? candidate.relationTypeId,
      status: "supported",
      confidence: validation.score,
      llmValidation: validation,
      extractionRationale: `${candidate.extractionRationale} LLM validation score ${validation.score.toFixed(2)}.`,
      unsupportedReason: undefined,
    });
  }

  return {
    candidateRelations: validatedCandidates.map((candidate, index) => ({
      ...candidate,
      id: `relation-candidate-${String(index + 1).padStart(4, "0")}`,
    })),
    warnings,
  };
}
