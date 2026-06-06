"use client";

import { useMemo, useState } from "react";

import type { ApiResult } from "@/schemas/api-result";
import type { BenchmarkOntologyPrepareResponse } from "@/schemas/benchmark-ontology";
import type { GenerateDebugGuidanceResponse } from "@/schemas/debugging";
import type { EvaluateQuizAnswerResponse } from "@/schemas/quiz";
import {
  buildEdgeQuizAttemptResult,
  buildEdgeQuizHiddenTask,
  findBenchmarkRelation,
} from "@/lib/quiz/edge-quiz-debug";

import type { ValidationSessionState } from "@/components/validation/validation-session";
import {
  areAllQuizQuestionsEvaluated,
  isQuizDebugPhaseComplete,
} from "@/components/validation/validation-session";

type QuizTakePanelProps = {
  result: BenchmarkOntologyPrepareResponse;
  session: ValidationSessionState;
  onSessionChange: (
    updater: (current: ValidationSessionState) => ValidationSessionState,
  ) => void;
  error: string | null;
  onErrorChange: (message: string | null) => void;
};

export function QuizTakePanel({
  result,
  session,
  onSessionChange,
  onErrorChange,
}: QuizTakePanelProps) {
  const { questions, questionStateById } = session;
  const [isSubmittingAll, setIsSubmittingAll] = useState(false);

  const nodeNameById = useMemo(
    () =>
      new Map(result.benchmarkOntology.nodes.map((node) => [node.id, node.name])),
    [result.benchmarkOntology.nodes],
  );

  const allEvaluated = useMemo(
    () => areAllQuizQuestionsEvaluated(session),
    [session],
  );
  const debugPhaseComplete = useMemo(
    () => isQuizDebugPhaseComplete(session),
    [session],
  );

  if (questions.length === 0) {
    return (
      <p className="empty">Prepare three questions in the edge selection stage first.</p>
    );
  }

  function updateQuestionState(
    questionId: string,
    patch: Partial<(typeof questionStateById)[string]>,
  ) {
    onSessionChange((current) => ({
      ...current,
      questionStateById: {
        ...current.questionStateById,
        [questionId]: {
          ...current.questionStateById[questionId]!,
          ...patch,
        },
      },
      diagnosis: null,
    }));
  }

  async function loadDebugGuidance(
    questionId: string,
    evaluationOverride?: EvaluateQuizAnswerResponse["evaluation"],
  ) {
    const question = questions.find((item) => item.id === questionId);

    if (!question) {
      return;
    }

    const evaluation =
      evaluationOverride ?? questionStateById[questionId]?.evaluation ?? null;

    if (!evaluation || evaluation.result === "correct") {
      return;
    }

    const benchmarkRelation = findBenchmarkRelation(
      result.benchmarkOntology,
      question,
    );
    const evidenceChunk = result.sourceChunks.find(
      (chunk) => chunk.id === question.evidenceChunkId,
    );

    if (!benchmarkRelation) {
      return;
    }

    updateQuestionState(questionId, { isLoadingDebug: true });

    try {
      const response = await fetch("/api/debugging/generate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          hiddenTask: buildEdgeQuizHiddenTask(question),
          benchmarkRelation,
          attempt: buildEdgeQuizAttemptResult({
            question,
            evaluation,
            evidenceChunk,
          }),
          evidenceChunk,
        }),
      });

      const payload =
        (await response.json()) as ApiResult<GenerateDebugGuidanceResponse>;

      if (!payload.ok) {
        onErrorChange(payload.error.message);
        updateQuestionState(questionId, { isLoadingDebug: false });
        return;
      }

      updateQuestionState(questionId, {
        isLoadingDebug: false,
        debugGuidance: payload.data.guidance,
      });
    } catch {
      onErrorChange("Failed to generate debugging guidance.");
      updateQuestionState(questionId, { isLoadingDebug: false });
    }
  }

  async function handleSubmitAll() {
    const unanswered = questions.filter(
      (question) => !questionStateById[question.id]?.relationTypeId,
    );

    if (unanswered.length > 0) {
      onErrorChange("Select a relation type for every edge question.");
      return;
    }

    setIsSubmittingAll(true);
    onErrorChange(null);
    onSessionChange((current) => ({
      ...current,
      diagnosis: null,
    }));

    try {
      const evaluations = new Map<string, EvaluateQuizAnswerResponse["evaluation"]>();

      for (const question of questions) {
        const questionState = questionStateById[question.id]!;

        updateQuestionState(question.id, { isSubmitting: true });

        const response = await fetch("/api/quiz/evaluate", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            question,
            relationTypeId: questionState.relationTypeId,
          }),
        });

        const payload =
          (await response.json()) as ApiResult<EvaluateQuizAnswerResponse>;

        if (!payload.ok) {
          onErrorChange(payload.error.message);
          updateQuestionState(question.id, { isSubmitting: false });
          return;
        }

        evaluations.set(question.id, payload.data.evaluation);
        updateQuestionState(question.id, {
          isSubmitting: false,
          evaluation: payload.data.evaluation,
          debugGuidance: null,
        });
      }

      for (const question of questions) {
        const evaluation = evaluations.get(question.id);

        if (evaluation?.result === "incorrect") {
          await loadDebugGuidance(question.id, evaluation);
        }
      }
    } catch {
      onErrorChange("Failed to evaluate quiz answers.");
    } finally {
      setIsSubmittingAll(false);
    }
  }

  return (
    <div className="detail-content quiz-take-layout">
      <div className="quiz-progress-header">
        <span className="quiz-progress-count">Quiz + debugging loop · 3 rounds</span>
        <span className="quiz-progress-answered">
          Graded {questions.filter((q) => questionStateById[q.id]?.evaluation).length} /{" "}
          {questions.length}
        </span>
      </div>

      <div className="quiz-loop-tracker" aria-label="Three quiz and debugging rounds">
        {questions.map((question, index) => {
          const state = questionStateById[question.id];
          const evaluation = state?.evaluation;
          const isCorrect = evaluation?.result === "correct";
          const hasDebug = state?.debugGuidance !== null;
          const statusLabel = !evaluation
            ? "Answer"
            : isCorrect
              ? "Correct"
              : hasDebug
                ? "Debug ready"
                : "Debug";

          return (
            <span
              className={`quiz-loop-tracker-item ${
                !evaluation
                  ? ""
                  : isCorrect
                    ? "correct"
                    : hasDebug
                      ? "debugged"
                      : "needs-debug"
              }`}
              key={question.id}
            >
              <strong>{index + 1}</strong>
              {statusLabel}
            </span>
          );
        })}
      </div>

      <div className="edge-quiz-list">
        {questions.map((question, index) => {
          const questionState = questionStateById[question.id];
          const sourceName =
            nodeNameById.get(question.sourceNodeId) ?? question.sourceNodeId;
          const targetName =
            nodeNameById.get(question.targetNodeId) ?? question.targetNodeId;
          const isEvaluated = questionState?.evaluation !== null;

          return (
            <article className="edge-quiz-card" key={question.id}>
              <div className="edge-quiz-card-header">
                <p className="quiz-question-label">Round {index + 1} of 3</p>
                <span className="quiz-loop-mini">Answer → Debug → Diagnosis input</span>
              </div>
              <h3 className="quiz-question-prompt">
                {sourceName} → ??? → {targetName}
              </h3>
              <p className="validation-hint">{question.prompt}</p>

              <label>
                Relation type
                <select
                  disabled={isEvaluated || isSubmittingAll || questionState?.isSubmitting}
                  onChange={(event) =>
                    updateQuestionState(question.id, {
                      relationTypeId: event.target.value,
                      evaluation: null,
                      debugGuidance: null,
                    })
                  }
                  value={questionState?.relationTypeId ?? ""}
                >
                  <option value="">Select one</option>
                  {result.relationTypes.map((relationType) => (
                    <option key={relationType.id} value={relationType.id}>
                      {relationType.name}
                    </option>
                  ))}
                </select>
              </label>

              {isEvaluated ? (
                <article
                  className={`quiz-result-banner ${
                    questionState.evaluation?.result === "correct"
                      ? "correct"
                      : "incorrect"
                  }`}
                >
                  <strong>
                    {questionState.evaluation?.result === "correct" ? "Correct" : "Incorrect"}
                  </strong>
                  <p>{questionState.evaluation?.message}</p>
                  {questionState.evaluation?.result === "incorrect" ? (
                    <p>Use the debugging prompts below before revising your relation judgment.</p>
                  ) : null}
                </article>
              ) : null}

              {questionState?.evaluation?.result === "incorrect" ? (
                <div className="edge-quiz-debug-block">
                  {questionState.isLoadingDebug ? (
                    <p className="validation-hint">Generating debugging guidance…</p>
                  ) : questionState.debugGuidance ? (
                    <>
                      <p>{questionState.debugGuidance.message}</p>
                      <div className="debug-prompt-list">
                        {questionState.debugGuidance.prompts.map((prompt) => (
                          <article className="debug-prompt-card" key={prompt.id}>
                            <small>{prompt.focus}</small>
                            <p>{prompt.text}</p>
                          </article>
                        ))}
                      </div>
                      <details className="evidence-details">
                        <summary>View evidence</summary>
                        <p>{questionState.debugGuidance.evidence.text}</p>
                      </details>
                    </>
                  ) : (
                    <button
                      className="secondary-action"
                      onClick={() => loadDebugGuidance(question.id)}
                      type="button"
                    >
                      Get debugging guidance again
                    </button>
                  )}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      {!allEvaluated ? (
        <button
          className="primary-action quiz-submit-action"
          disabled={isSubmittingAll}
          onClick={handleSubmitAll}
          type="button"
        >
          {isSubmittingAll ? "Grading and preparing debugging…" : "Submit all"}
        </button>
      ) : debugPhaseComplete ? (
        <p className="callout-info">
          Grading and debugging are complete. You can generate a diagnosis in the
          next step.
        </p>
      ) : (
        <p className="validation-hint">Preparing debugging guidance for incorrect questions…</p>
      )}
    </div>
  );
}
