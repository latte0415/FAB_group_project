"use client";

import { useMemo, useState } from "react";

import type { ApiResult } from "@/schemas/api-result";
import type {
  BenchmarkOntologyPrepareResponse,
  HiddenRelationTask,
} from "@/schemas/benchmark-ontology";
import type { GenerateDiagnosisResponse } from "@/schemas/diagnosis";
import type { LearnerAttemptResult } from "@/schemas/learner-attempt";

import type { ValidationSessionState } from "@/components/validation/validation-session";

type DiagnosisPanelProps = {
  result: BenchmarkOntologyPrepareResponse;
  restoreTasks: HiddenRelationTask[];
  attemptResults: LearnerAttemptResult[];
  session: ValidationSessionState;
  onSessionChange: (
    updater: (current: ValidationSessionState) => ValidationSessionState,
  ) => void;
  error: string | null;
  onErrorChange: (message: string | null) => void;
};

export function DiagnosisPanel({
  result,
  restoreTasks,
  attemptResults,
  session,
  onSessionChange,
  onErrorChange,
}: DiagnosisPanelProps) {
  const { benchmarkOntology, relationTypes } = result;
  const { diagnosis } = session;
  const [isGeneratingDiagnosis, setIsGeneratingDiagnosis] = useState(false);

  const relationTypeNameById = useMemo(
    () =>
      new Map(
        relationTypes.map((relationType) => [relationType.id, relationType.name]),
      ),
    [relationTypes],
  );

  const attemptMistakeCount = attemptResults.filter(
    (attempt) =>
      attempt.result === "incorrect" &&
      !restoreTasks
        .find((task) => task.id === attempt.hiddenTaskId)
        ?.selectionReasons.includes("edge_quiz_selection"),
  ).length;
  const edgeQuizMistakeCount = attemptResults.filter(
    (attempt) =>
      attempt.result === "incorrect" &&
      restoreTasks
        .find((task) => task.id === attempt.hiddenTaskId)
        ?.selectionReasons.includes("edge_quiz_selection"),
  ).length;
  const attemptCount = attemptResults.length;
  const quizEvaluations = session.questions
    .map((question) => session.questionStateById[question.id]?.evaluation)
    .filter((evaluation) => evaluation !== null);
  const quizMistakeCount = quizEvaluations.filter(
    (evaluation) => evaluation.result === "incorrect",
  ).length;

  async function handleGenerateDiagnosis() {
    setIsGeneratingDiagnosis(true);
    onErrorChange(null);

    try {
      const response = await fetch("/api/diagnosis/generate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          benchmarkOntology,
          restoreTasks,
          attemptResults,
          quizEvaluations,
        }),
      });

      const payload =
        (await response.json()) as ApiResult<GenerateDiagnosisResponse>;

      if (!payload.ok) {
        onErrorChange(payload.error.message);
        return;
      }

      onSessionChange((current) => ({
        ...current,
        diagnosis: payload.data.diagnosis,
      }));
    } catch {
      onErrorChange("Failed to generate diagnosis.");
    } finally {
      setIsGeneratingDiagnosis(false);
    }
  }

  return (
    <div className="detail-content">
      <p className="validation-hint">
        Synthesizes restoration and validation results into a relation-level
        misunderstanding summary.
      </p>

      <dl className="summary-metrics">
        <div>
          <dt>Submitted attempts</dt>
          <dd>{attemptCount}</dd>
        </div>
        <div>
          <dt>Reconstruction mistakes</dt>
          <dd>{attemptMistakeCount}</dd>
        </div>
        <div>
          <dt>Edge quiz mistakes</dt>
          <dd>{edgeQuizMistakeCount + quizMistakeCount}</dd>
        </div>
      </dl>

      <button
        className="primary-action"
        disabled={isGeneratingDiagnosis}
        onClick={handleGenerateDiagnosis}
        type="button"
      >
        {isGeneratingDiagnosis ? "Generating…" : "Generate summary"}
      </button>

      {diagnosis ? (
        <article className="diagnosis-card">
          <p className="diagnosis-summary">{diagnosis.summary}</p>
          {diagnosis.misunderstoodRelations.length > 0 ? (
            <div className="diagnosis-relation-list">
              {diagnosis.misunderstoodRelations.map((relation) => (
                <article
                  className="diagnosis-relation-row"
                  key={relation.relationTypeId}
                >
                  <strong>
                    {relationTypeNameById.get(relation.relationTypeId) ??
                      relation.relationTypeId}
                  </strong>
                  <ul>
                    {relation.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty">No clear relation-level misunderstandings.</p>
          )}
        </article>
      ) : (
        <p className="empty">
          Click Generate summary to view relation-level misunderstandings.
        </p>
      )}

    </div>
  );
}
