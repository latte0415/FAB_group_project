"use client";

import { useMemo, useState } from "react";

import type { ApiResult } from "@/schemas/api-result";
import type { BenchmarkOntologyPrepareResponse } from "@/schemas/benchmark-ontology";
import type { GenerateQuizResponse } from "@/schemas/quiz";

import {
  createInitialQuestionState,
  type ValidationSessionState,
} from "@/components/validation/validation-session";

type QuizGeneratePanelProps = {
  result: BenchmarkOntologyPrepareResponse;
  session: ValidationSessionState;
  onSessionChange: (
    updater: (current: ValidationSessionState) => ValidationSessionState,
  ) => void;
  error: string | null;
  onErrorChange: (message: string | null) => void;
};

export function QuizGeneratePanel({
  result,
  session,
  onSessionChange,
  onErrorChange,
}: QuizGeneratePanelProps) {
  const { benchmarkOntology, relationTypes } = result;
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  const nodeNameById = useMemo(
    () => new Map(benchmarkOntology.nodes.map((node) => [node.id, node.name])),
    [benchmarkOntology.nodes],
  );

  async function handleGenerateQuiz() {
    setIsGeneratingQuiz(true);
    onErrorChange(null);

    try {
      const response = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          benchmarkOntology,
          relationTypes,
        }),
      });

      const payload = (await response.json()) as ApiResult<GenerateQuizResponse>;

      if (!payload.ok) {
        onErrorChange(payload.error.message);
        return;
      }

      onSessionChange(() => ({
        questions: payload.data.questions,
        questionStateById: createInitialQuestionState(payload.data.questions),
        diagnosis: null,
      }));
    } catch {
      onErrorChange("Failed to select quiz edges.");
    } finally {
      setIsGeneratingQuiz(false);
    }
  }

  return (
    <div className="detail-content">
      <p className="validation-hint">
        Selects 3 quiz questions from {benchmarkOntology.relations.length} verified
        edges.
      </p>

      <button
        className="primary-action"
        disabled={isGeneratingQuiz || benchmarkOntology.relations.length === 0}
        onClick={handleGenerateQuiz}
        type="button"
      >
        {isGeneratingQuiz
          ? "Selecting…"
          : session.questions.length > 0
            ? "Reselect edges"
            : "Select 3 edges"}
      </button>

      {session.questions.length > 0 ? (
        <>
          <div className="panel-heading">
            <h3>Selected edges</h3>
            <strong>{session.questions.length}</strong>
          </div>
          <div className="scroll-list compact-scroll">
            {session.questions.map((question, index) => {
              const sourceName =
                nodeNameById.get(question.sourceNodeId) ?? question.sourceNodeId;
              const targetName =
                nodeNameById.get(question.targetNodeId) ?? question.targetNodeId;

              return (
                <article className="quiz-preview-row" key={question.id}>
                  <small>
                    Edge {index + 1} · {sourceName} → ??? → {targetName}
                  </small>
                  <p>{question.prompt}</p>
                </article>
              );
            })}
          </div>
          <p className="callout-info">Answer the three edge questions in the next step.</p>
        </>
      ) : (
        <p className="empty">Click Select edges to prepare quiz questions.</p>
      )}
    </div>
  );
}
