import { getLlmConfig } from "@/lib/config/llm-config";
import { reportBatchProgress } from "@/lib/pipeline/stage-progress";
import type { ConceptValidationInput, LlmValidationClient } from "@/lib/llm/types";
import type { NodeCandidate, SourceChunk } from "@/schemas/benchmark-ontology";
import type { LlmConceptValidationRecord } from "@/schemas/llm-validation";

export function buildConceptValidationInputs(input: {
  nodeCandidates: NodeCandidate[];
  sourceChunks: SourceChunk[];
}): ConceptValidationInput[] {
  const chunkTextById = new Map(
    input.sourceChunks.map((chunk) => [chunk.id, chunk.text]),
  );

  return input.nodeCandidates.map((candidate) => ({
    candidate,
    evidenceSnippets: candidate.sourceChunkIds
      .map((chunkId) => chunkTextById.get(chunkId))
      .filter((text): text is string => Boolean(text))
      .slice(0, 3),
  }));
}

export async function validateNodeCandidatesWithLlm(input: {
  nodeCandidates: NodeCandidate[];
  sourceChunks: SourceChunk[];
  llmClient: LlmValidationClient;
  scoreThreshold?: number;
  onProgress?: (percent: number) => void;
  progressRange?: { start: number; end: number };
}): Promise<{ nodeCandidates: NodeCandidate[]; warnings: string[] }> {
  const threshold = input.scoreThreshold ?? getLlmConfig().conceptScoreThreshold;
  const batchSize = getLlmConfig().batchSize;
  const validationInputs = buildConceptValidationInputs({
    nodeCandidates: input.nodeCandidates,
    sourceChunks: input.sourceChunks,
  });
  const validationByCandidateId = new Map<string, LlmConceptValidationRecord>();
  const warnings: string[] = [];
  const totalBatches = Math.max(1, Math.ceil(validationInputs.length / batchSize));
  const progressRange = input.progressRange ?? { start: 0, end: 100 };

  for (let index = 0; index < validationInputs.length; index += batchSize) {
    const batch = validationInputs.slice(index, index + batchSize);
    const completedBatches = Math.floor(index / batchSize) + 1;

    try {
      const results = await input.llmClient.validateConcepts(batch);

      for (const result of results) {
        validationByCandidateId.set(result.candidateId, {
          isConcept: result.isConcept,
          score: result.score,
          rationale: result.rationale,
          suggestedType: result.suggestedType,
        });
      }
    } catch {
      warnings.push(
        `Concept LLM validation batch ${completedBatches}/${totalBatches} failed; retained heuristic candidates from that batch.`,
      );

      for (const validationInput of batch) {
        validationByCandidateId.set(validationInput.candidate.id, {
          isConcept: true,
          score: threshold,
          rationale: "LLM batch validation failed; retained heuristic candidate.",
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

  const validatedCandidates: NodeCandidate[] = [];

  for (const candidate of input.nodeCandidates) {
    const validation = validationByCandidateId.get(candidate.id);

    if (!validation || !validation.isConcept || validation.score < threshold) {
      continue;
    }

    validatedCandidates.push({
      ...candidate,
      type: validation.suggestedType ?? candidate.type,
      llmValidation: validation,
      rationale: `${candidate.rationale} LLM validation score ${validation.score.toFixed(2)}.`,
    });
  }

  return {
    nodeCandidates: validatedCandidates.map((candidate, index) => ({
      ...candidate,
      id: `node-candidate-${String(index + 1).padStart(4, "0")}`,
    })),
    warnings,
  };
}
