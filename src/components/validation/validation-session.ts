import type { DebugGuidance } from "@/schemas/debugging";
import type { QualitativeDiagnosis } from "@/schemas/diagnosis";
import type { QuizAnswerEvaluation, QuizQuestion } from "@/schemas/quiz";

export type QuestionState = {
  relationTypeId: string;
  explanation: string;
  evaluation: QuizAnswerEvaluation | null;
  debugGuidance: DebugGuidance | null;
  isSubmitting: boolean;
  isLoadingDebug: boolean;
};

export type ValidationSessionState = {
  questions: QuizQuestion[];
  questionStateById: Record<string, QuestionState>;
  diagnosis: QualitativeDiagnosis | null;
};

export const emptyValidationSessionState: ValidationSessionState = {
  questions: [],
  questionStateById: {},
  diagnosis: null,
};

export function createInitialQuestionState(
  questions: QuizQuestion[],
): Record<string, QuestionState> {
  return Object.fromEntries(
    questions.map((question) => [
      question.id,
      {
        relationTypeId: "",
        explanation: "",
        evaluation: null,
        debugGuidance: null,
        isSubmitting: false,
        isLoadingDebug: false,
      },
    ]),
  );
}

export function areAllQuizQuestionsEvaluated(session: ValidationSessionState) {
  if (session.questions.length === 0) {
    return false;
  }

  return session.questions.every(
    (question) => session.questionStateById[question.id]?.evaluation !== null,
  );
}

export function isQuizDebugPhaseComplete(session: ValidationSessionState) {
  if (!areAllQuizQuestionsEvaluated(session)) {
    return false;
  }

  return session.questions.every((question) => {
    const state = session.questionStateById[question.id];

    if (!state?.evaluation) {
      return false;
    }

    if (state.evaluation.result === "correct") {
      return true;
    }

    return state.debugGuidance !== null;
  });
}

export function countQuizEvaluations(session: ValidationSessionState) {
  return Object.values(session.questionStateById).filter(
    (state) => state.evaluation !== null,
  ).length;
}
