import type {
  EvaluateLearnerAttemptRequest,
  EvaluateLearnerAttemptResponse,
  LearnerAttemptMismatch,
} from "@/schemas/learner-attempt";
import {
  evaluateLearnerAttemptRequestSchema,
  evaluateLearnerAttemptResponseSchema,
} from "@/schemas/learner-attempt";

export function evaluateLearnerAttempt(
  input: EvaluateLearnerAttemptRequest,
): EvaluateLearnerAttemptResponse {
  const request = evaluateLearnerAttemptRequestSchema.parse(input);

  if (request.proposal.hiddenTaskId !== request.hiddenTask.id) {
    throw new Error("Proposal hidden task id does not match the active task.");
  }

  const mismatches = collectMismatches(request);
  const isCorrect = mismatches.length === 0;

  if (isCorrect) {
    return evaluateLearnerAttemptResponseSchema.parse({
      attempt: {
        hiddenTaskId: request.hiddenTask.id,
        result: "correct",
        message:
          "You restored the missing relation to match the evidence. The relation is shown on the graph again.",
        mismatches: [],
        restoredRelation: request.benchmarkRelation,
      },
    });
  }

  return evaluateLearnerAttemptResponseSchema.parse({
    attempt: {
      hiddenTaskId: request.hiddenTask.id,
      result: "incorrect",
      message:
        "Your proposed relation does not match the benchmark evidence. Review the evidence below and try again.",
      mismatches,
      debugEvidence: request.evidenceChunk
        ? {
            chunkId: request.evidenceChunk.id,
            text: request.evidenceChunk.text,
            sectionTitle: request.evidenceChunk.sectionTitle,
          }
        : undefined,
    },
  });
}

function collectMismatches(
  request: EvaluateLearnerAttemptRequest,
): LearnerAttemptMismatch[] {
  const mismatches: LearnerAttemptMismatch[] = [];
  const expected = {
    sourceNodeId: request.benchmarkRelation.sourceNodeId,
    targetNodeId: request.benchmarkRelation.targetNodeId,
    relationTypeId: request.benchmarkRelation.relationTypeId,
  };

  if (request.proposal.sourceNodeId !== expected.sourceNodeId) {
    mismatches.push({
      field: "sourceNodeId",
      expected: expected.sourceNodeId,
      proposed: request.proposal.sourceNodeId,
    });
  }

  if (request.proposal.targetNodeId !== expected.targetNodeId) {
    mismatches.push({
      field: "targetNodeId",
      expected: expected.targetNodeId,
      proposed: request.proposal.targetNodeId,
    });
  }

  if (request.proposal.relationTypeId !== expected.relationTypeId) {
    mismatches.push({
      field: "relationTypeId",
      expected: expected.relationTypeId,
      proposed: request.proposal.relationTypeId,
    });
  }

  return mismatches;
}
