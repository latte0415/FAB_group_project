import { selectEdgeQuizRelations } from "@/domain/quiz/select-edge-quiz-relations";
import { defaultQuizGenerationConfig } from "@/lib/config/quiz-generation-config";
import type {
  GenerateQuizRequest,
  GenerateQuizResponse,
  QuizQuestion,
} from "@/schemas/quiz";
import {
  generateQuizRequestSchema,
  generateQuizResponseSchema,
} from "@/schemas/quiz";

export function generateQuizQuestions(input: GenerateQuizRequest): GenerateQuizResponse {
  const request = generateQuizRequestSchema.parse(input);
  const maxQuestions = request.maxQuestions ?? defaultQuizGenerationConfig.maxQuestions;
  const selectedRelations = selectEdgeQuizRelations(
    request.benchmarkOntology.relations,
    maxQuestions,
  );
  const questions: QuizQuestion[] = [];

  for (const relation of selectedRelations) {
    const sourceNode = request.benchmarkOntology.nodes.find(
      (node) => node.id === relation.sourceNodeId,
    );
    const targetNode = request.benchmarkOntology.nodes.find(
      (node) => node.id === relation.targetNodeId,
    );

    if (!sourceNode || !targetNode) {
      continue;
    }

    questions.push({
      id: `quiz-question-${String(questions.length + 1).padStart(4, "0")}`,
      sourceRelationId: relation.id,
      benchmarkRelationId: relation.id,
      sourceNodeId: relation.sourceNodeId,
      targetNodeId: relation.targetNodeId,
      evidenceChunkId: relation.evidenceChunkId,
      correctRelationTypeId: relation.relationTypeId,
      prompt: `Restore the relation type between "${sourceNode.name}" and "${targetNode.name}" based on the evidence.`,
    });
  }

  return generateQuizResponseSchema.parse({
    questions,
    summary: {
      questionCount: questions.length,
      sourceRelationCount: request.benchmarkOntology.relations.length,
    },
  });
}
