import type {
  EvaluateQuizAnswerRequest,
  EvaluateQuizAnswerResponse,
} from "@/schemas/quiz";
import {
  evaluateQuizAnswerRequestSchema,
  evaluateQuizAnswerResponseSchema,
} from "@/schemas/quiz";

export function evaluateQuizAnswer(
  input: EvaluateQuizAnswerRequest,
): EvaluateQuizAnswerResponse {
  const request = evaluateQuizAnswerRequestSchema.parse(input);
  const isCorrect =
    request.relationTypeId === request.question.correctRelationTypeId;

  if (isCorrect) {
    return evaluateQuizAnswerResponseSchema.parse({
      evaluation: {
        questionId: request.question.id,
        result: "correct",
        proposedRelationTypeId: request.relationTypeId,
        correctRelationTypeId: request.question.correctRelationTypeId,
        message: "You selected the relation type that matches the verified relation.",
      },
    });
  }

  return evaluateQuizAnswerResponseSchema.parse({
    evaluation: {
      questionId: request.question.id,
      result: "incorrect",
      proposedRelationTypeId: request.relationTypeId,
      correctRelationTypeId: request.question.correctRelationTypeId,
      message:
        "The selected relation type does not match the verified ontology relation. Review the evidence and try again.",
      misunderstoodRelationTypeId: request.relationTypeId,
    },
  });
}
