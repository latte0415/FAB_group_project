import type {
  BenchmarkOntologyGraph,
  HiddenRelationTask,
  SourceChunk,
} from "@/schemas/benchmark-ontology";
import type { LearnerAttemptResult } from "@/schemas/learner-attempt";
import type { QuizAnswerEvaluation, QuizQuestion } from "@/schemas/quiz";

export function buildEdgeQuizHiddenTask(question: QuizQuestion): HiddenRelationTask {
  return {
    id: `edge-quiz-task-${question.id}`,
    benchmarkRelationId: question.benchmarkRelationId,
    sourceNodeId: question.sourceNodeId,
    targetNodeId: question.targetNodeId,
    relationTypeId: question.correctRelationTypeId,
    evidenceChunkId: question.evidenceChunkId,
    prompt: question.prompt,
    selectionReasons: ["edge_quiz_selection"],
    status: "active",
  };
}

export function buildEdgeQuizAttemptResult(input: {
  question: QuizQuestion;
  evaluation: QuizAnswerEvaluation;
  evidenceChunk?: SourceChunk;
}): LearnerAttemptResult {
  const hiddenTaskId = buildEdgeQuizHiddenTask(input.question).id;

  if (input.evaluation.result === "correct") {
    return {
      hiddenTaskId,
      result: "correct",
      message: input.evaluation.message,
      mismatches: [],
    };
  }

  return {
    hiddenTaskId,
    result: "incorrect",
    message: input.evaluation.message,
    mismatches: [
      {
        field: "relationTypeId",
        expected: input.evaluation.correctRelationTypeId,
        proposed: input.evaluation.proposedRelationTypeId,
      },
    ],
    debugEvidence: input.evidenceChunk
      ? {
          chunkId: input.evidenceChunk.id,
          text: input.evidenceChunk.text,
          sectionTitle: input.evidenceChunk.sectionTitle,
        }
      : undefined,
  };
}

export function findBenchmarkRelation(
  benchmarkOntology: BenchmarkOntologyGraph,
  question: QuizQuestion,
) {
  return (
    benchmarkOntology.relations.find(
      (relation) => relation.id === question.benchmarkRelationId,
    ) ?? null
  );
}
