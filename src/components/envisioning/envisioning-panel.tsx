"use client";

import { useMemo } from "react";

import {
  isEdgeQuizRestoreTask,
} from "@/lib/envisioning/build-restore-tasks";
import {
  isRestoreTaskInteractionComplete,
} from "@/lib/envisioning/envisioning-restore-progress";
import type { ApiResult } from "@/schemas/api-result";
import type {
  BenchmarkOntologyPrepareResponse,
  HiddenRelationTask,
} from "@/schemas/benchmark-ontology";
import type { DebugGuidance, GenerateDebugGuidanceResponse } from "@/schemas/debugging";
import type {
  EvaluateLearnerAttemptResponse,
  LearnerAttemptResult,
} from "@/schemas/learner-attempt";

type EnvisioningPanelProps = {
  result: BenchmarkOntologyPrepareResponse;
  restoreTasks?: HiddenRelationTask[];
  view?: "overview" | "restore" | "full";
  attemptsByTaskId: Record<string, TaskAttemptState>;
  onAttemptsChange: (
    updater: (
      current: Record<string, TaskAttemptState>,
    ) => Record<string, TaskAttemptState>,
  ) => void;
  activeTaskIndex: number;
  onActiveTaskIndexChange: (index: number) => void;
  onAttemptResult?: (attempt: LearnerAttemptResult) => void;
  onRegenerateEnvisioning?: () => Promise<void>;
  isRegeneratingEnvisioning?: boolean;
};

export type TaskAttemptState = {
  sourceNodeId: string;
  targetNodeId: string;
  relationTypeId: string;
  explanation: string;
  feedback: LearnerAttemptResult | null;
  debugGuidance: DebugGuidance | null;
  isSubmitting: boolean;
  isLoadingDebug: boolean;
  isRestored: boolean;
};

export function createTaskAttemptStateForTask(
  task: HiddenRelationTask,
  result: BenchmarkOntologyPrepareResponse,
): TaskAttemptState {
  return {
    sourceNodeId: task.sourceNodeId,
    targetNodeId: task.targetNodeId,
    relationTypeId: "",
    explanation: "",
    feedback: null,
    debugGuidance: null,
    isSubmitting: false,
    isLoadingDebug: false,
    isRestored: false,
  };
}

export function createDefaultTaskAttemptState(
  result: BenchmarkOntologyPrepareResponse,
): TaskAttemptState {
  const firstTask = result.learnerFacingOntology.hiddenTasks[0];

  if (firstTask) {
    return createTaskAttemptStateForTask(firstTask, result);
  }

  return {
    sourceNodeId: result.learnerFacingOntology.nodes[0]?.id ?? "",
    targetNodeId:
      result.learnerFacingOntology.nodes[1]?.id ??
      result.learnerFacingOntology.nodes[0]?.id ??
      "",
    relationTypeId: "",
    explanation: "",
    feedback: null,
    debugGuidance: null,
    isSubmitting: false,
    isLoadingDebug: false,
    isRestored: false,
  };
}

const mismatchFieldLabels = {
  sourceNodeId: "source node",
  targetNodeId: "target node",
  relationTypeId: "relation type",
} as const;

export function EnvisioningPanel({
  result,
  restoreTasks,
  view = "full",
  attemptsByTaskId,
  onAttemptsChange,
  activeTaskIndex,
  onActiveTaskIndexChange,
  onAttemptResult,
  onRegenerateEnvisioning,
  isRegeneratingEnvisioning = false,
}: EnvisioningPanelProps) {
  const { learnerFacingOntology, relationTypes, sourceChunks, benchmarkOntology } =
    result;

  const tasksForRestore = restoreTasks ?? learnerFacingOntology.hiddenTasks;
  const activeTask = tasksForRestore[activeTaskIndex];
  const isEdgeQuizTask = activeTask ? isEdgeQuizRestoreTask(activeTask) : false;
  const activeBenchmarkRelation = useMemo(() => {
    if (!activeTask) {
      return null;
    }

    return (
      benchmarkOntology.relations.find(
        (relation) => relation.id === activeTask.benchmarkRelationId,
      ) ?? null
    );
  }, [activeTask, benchmarkOntology.relations]);

  const nodeNameById = useMemo(
    () => new Map(learnerFacingOntology.nodes.map((node) => [node.id, node.name])),
    [learnerFacingOntology.nodes],
  );

  const relationTypeNameById = useMemo(
    () => new Map(relationTypes.map((relationType) => [relationType.id, relationType.name])),
    [relationTypes],
  );

  const restoredRelationIds = useMemo(() => {
    return new Set(
      learnerFacingOntology.hiddenTasks
        .filter((task) => attemptsByTaskId[task.id]?.isRestored)
        .map((task) => task.benchmarkRelationId),
    );
  }, [attemptsByTaskId, learnerFacingOntology.hiddenTasks]);

  if (view === "overview" && learnerFacingOntology.hiddenTasks.length === 0) {
    return (
      <div className="envisioning-empty">
        <p className="empty">
          Could not generate envisioning tasks because there are no verified
          relations to hide. Load the Envisioning course note and re-run the
          pipeline.
        </p>
      </div>
    );
  }

  if (view === "restore" && tasksForRestore.length === 0) {
    return (
      <p className="empty">
        No envisioning tasks to restore. Run the Envisioning stage first.
      </p>
    );
  }

  if (!activeTask || !activeBenchmarkRelation) {
    return null;
  }

  const attemptState =
    attemptsByTaskId[activeTask.id] ??
    createTaskAttemptStateForTask(activeTask, result);

  async function handleSubmitAttempt() {
    if (!attemptState.relationTypeId) {
      onAttemptsChange((current) => ({
        ...current,
        [activeTask.id]: {
          ...attemptState,
          feedback: {
            hiddenTaskId: activeTask.id,
            result: "incorrect",
            message: "Select a relation type before submitting your proposal.",
            mismatches: [],
          },
        },
      }));
      return;
    }

    const evidenceChunk = sourceChunks.find(
      (chunk) => chunk.id === activeTask.evidenceChunkId,
    );

    onAttemptsChange((current) => ({
      ...current,
      [activeTask.id]: {
        ...attemptState,
        isSubmitting: true,
      },
    }));

    try {
      const response = await fetch("/api/attempts/evaluate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          hiddenTask: activeTask,
          benchmarkRelation: activeBenchmarkRelation,
          evidenceChunk,
          proposal: {
            hiddenTaskId: activeTask.id,
            sourceNodeId: attemptState.sourceNodeId,
            targetNodeId: attemptState.targetNodeId,
            relationTypeId: attemptState.relationTypeId,
            explanation: attemptState.explanation || undefined,
          },
        }),
      });

      const payload = (await response.json()) as ApiResult<EvaluateLearnerAttemptResponse>;

      if (!payload.ok) {
        onAttemptsChange((current) => ({
          ...current,
          [activeTask.id]: {
            ...attemptState,
            isSubmitting: false,
            feedback: {
              hiddenTaskId: activeTask.id,
              result: "incorrect",
              message: payload.error.message,
              mismatches: [],
            },
          },
        }));
        return;
      }

      const attempt = payload.data.attempt;

      onAttemptsChange((current) => ({
        ...current,
        [activeTask.id]: {
          ...attemptState,
          isSubmitting: false,
          feedback: attempt,
          debugGuidance: null,
          isRestored: attempt.result === "correct",
        },
      }));
      onAttemptResult?.(attempt);
    } catch {
      onAttemptsChange((current) => ({
        ...current,
        [activeTask.id]: {
          ...attemptState,
          isSubmitting: false,
          feedback: {
            hiddenTaskId: activeTask.id,
            result: "incorrect",
            message: "Failed to call the proposal evaluation API.",
            mismatches: [],
          },
        },
      }));
    }
  }

  function updateAttemptState(patch: Partial<TaskAttemptState>) {
    onAttemptsChange((current) => ({
      ...current,
      [activeTask.id]: {
        ...attemptState,
        ...patch,
      },
    }));
  }

  function resolveNodeLabel(nodeId: string) {
    return nodeNameById.get(nodeId) ?? nodeId;
  }

  function resolveRelationTypeLabel(relationTypeId: string) {
    return relationTypeNameById.get(relationTypeId) ?? relationTypeId;
  }

  async function handleGenerateDebugGuidance() {
    if (!attemptState.feedback || attemptState.feedback.result === "correct") {
      return;
    }

    const evidenceChunk = sourceChunks.find(
      (chunk) => chunk.id === activeTask.evidenceChunkId,
    );

    onAttemptsChange((current) => ({
      ...current,
      [activeTask.id]: {
        ...attemptState,
        isLoadingDebug: true,
      },
    }));

    try {
      const response = await fetch("/api/debugging/generate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          hiddenTask: activeTask,
          benchmarkRelation: activeBenchmarkRelation,
          attempt: attemptState.feedback,
          evidenceChunk,
        }),
      });

      const payload =
        (await response.json()) as ApiResult<GenerateDebugGuidanceResponse>;

      if (!payload.ok) {
        onAttemptsChange((current) => ({
          ...current,
          [activeTask.id]: {
            ...attemptState,
            isLoadingDebug: false,
            feedback: {
              ...attemptState.feedback!,
              message: payload.error.message,
            },
          },
        }));
        return;
      }

      onAttemptsChange((current) => ({
        ...current,
        [activeTask.id]: {
          ...attemptState,
          isLoadingDebug: false,
          debugGuidance: payload.data.guidance,
        },
      }));
    } catch {
      onAttemptsChange((current) => ({
        ...current,
        [activeTask.id]: {
          ...attemptState,
          isLoadingDebug: false,
          feedback: {
            ...attemptState.feedback!,
            message: "Failed to generate debugging guidance.",
          },
        },
      }));
    }
  }

  const showOverview = view === "overview" || view === "full";
  const showRestore = view === "restore" || view === "full";

  return (
    <div
      className={`envisioning-layout ${
        view === "full" ? "envisioning-layout-split" : "envisioning-layout-single"
      }`}
    >
      {showOverview ? (
      <div className="envisioning-section-block">
        <div className="panel-heading">
          <div>
            <h3>Learner-facing graph</h3>
            <p>
              The benchmark graph with selected relations hidden for reconstruction.
            </p>
          </div>
          <strong>
            {learnerFacingOntology.summary.visibleRelationCount} visible ·{" "}
            {learnerFacingOntology.summary.hiddenRelationCount} hidden
          </strong>
        </div>
        {onRegenerateEnvisioning ? (
          <div className="detail-actions">
            <button
              className="secondary-action"
              disabled={isRegeneratingEnvisioning}
              onClick={() => onRegenerateEnvisioning()}
              type="button"
            >
              {isRegeneratingEnvisioning
                ? "Regenerating…"
                : "Regenerate envisioning tasks"}
            </button>
          </div>
        ) : null}
        <div className="envisioning-graph">
          {learnerFacingOntology.nodes.map((node) => (
            <div className="envisioning-node" key={node.id}>
              <small>{node.type}</small>
              <strong>{node.name}</strong>
            </div>
          ))}
        </div>
        <div className="envisioning-edge-list">
          {learnerFacingOntology.visibleRelations.map((relation) => (
            <article className="envisioning-edge visible" key={relation.id}>
              <span>
                {nodeNameById.get(relation.sourceNodeId)} →{" "}
                {relationTypeNameById.get(relation.relationTypeId) ??
                  relation.relationTypeId}{" "}
                → {nodeNameById.get(relation.targetNodeId)}
              </span>
              <small>visible</small>
            </article>
          ))}
          {learnerFacingOntology.hiddenTasks.map((task) => {
            const isRestored = restoredRelationIds.has(task.benchmarkRelationId);
            const sourceName = nodeNameById.get(task.sourceNodeId);
            const targetName = nodeNameById.get(task.targetNodeId);

            return (
              <article
                className={`envisioning-edge ${isRestored ? "restored" : "hidden"}`}
                key={task.id}
              >
                <span>
                  {sourceName} → {isRestored ? (
                    relationTypeNameById.get(task.relationTypeId) ?? task.relationTypeId
                  ) : (
                    "???"
                  )}{" "}
                  → {targetName}
                </span>
                <small>{isRestored ? "restored" : "hidden"}</small>
              </article>
            );
          })}
        </div>
      </div>
      ) : null}

      {showRestore ? (
      <div className="envisioning-section-block envisioning-quiz-panel">
        <div className="panel-heading">
          <div>
            <h3>Envisioning restoration</h3>
            <p>
              Hidden relation tasks answered from visible graph structure and evidence.
            </p>
          </div>
          <strong>
            {activeTaskIndex + 1} / {tasksForRestore.length}
          </strong>
        </div>

        <p className="validation-hint">
          Complete three edges in order. If your proposal is incorrect, use the
          debugging guidance to review the evidence again.
        </p>

        {tasksForRestore.length > 1 ? (
          <div className="envisioning-task-tabs">
            {tasksForRestore.map((task, index) => {
              const taskState = attemptsByTaskId[task.id];
              const isCompleted = isRestoreTaskInteractionComplete(task, taskState);
              const sourceName = resolveNodeLabel(task.sourceNodeId);
              const targetName = resolveNodeLabel(task.targetNodeId);
              const label = `${index + 1}. ${sourceName} -> ${targetName}`;

              return (
                <button
                  className={`envisioning-task-tab ${
                    activeTaskIndex === index ? "selected" : ""
                  } ${isCompleted ? "completed" : ""}`}
                  key={task.id}
                  onClick={() => onActiveTaskIndexChange(index)}
                  title={`${sourceName} -> ??? -> ${targetName}`}
                  type="button"
                >
                  {label}
                </button>
              );
            })}
          </div>
        ) : null}

        <p className="envisioning-prompt">{activeTask.prompt}</p>
        {isEdgeQuizTask ? (
          <p className="envisioning-edge-headline">
            {resolveNodeLabel(activeTask.sourceNodeId)} → ??? →{" "}
            {resolveNodeLabel(activeTask.targetNodeId)}
          </p>
        ) : null}
        <p className="envisioning-hint">
          {isEdgeQuizTask
            ? "Source and target are fixed. Select the relation type that matches the evidence."
            : "Restore the hidden edge on the graph. You must match the source node, target node, and relation type."}
        </p>

        <div className="envisioning-form">
          <label>
            Source node
            <select
              disabled={isEdgeQuizTask || attemptState.isRestored}
              value={attemptState.sourceNodeId}
              onChange={(event) =>
                updateAttemptState({ sourceNodeId: event.target.value, feedback: null })
              }
            >
              {learnerFacingOntology.nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Relation type
            <select
              value={attemptState.relationTypeId}
              onChange={(event) =>
                updateAttemptState({ relationTypeId: event.target.value, feedback: null })
              }
            >
              <option disabled value="">
                Select relation type
              </option>
              {relationTypes.map((relationType) => (
                <option key={relationType.id} value={relationType.id}>
                  {relationType.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Target node
            <select
              disabled={isEdgeQuizTask || attemptState.isRestored}
              value={attemptState.targetNodeId}
              onChange={(event) =>
                updateAttemptState({ targetNodeId: event.target.value, feedback: null })
              }
            >
              {learnerFacingOntology.nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Explanation (optional)
            <textarea
              className="envisioning-explanation-input"
              rows={2}
              value={attemptState.explanation}
              onChange={(event) =>
                updateAttemptState({ explanation: event.target.value, feedback: null })
              }
            />
          </label>
        </div>

        <button
          className="primary-action"
          disabled={
            attemptState.isSubmitting ||
            attemptState.isRestored ||
            !attemptState.relationTypeId
          }
          onClick={handleSubmitAttempt}
          type="button"
        >
          {attemptState.isRestored
            ? "Restoration complete"
            : attemptState.isSubmitting
              ? "Evaluating…"
              : "Submit proposal"}
        </button>

        {attemptState.feedback ? (
          <article
            className={`envisioning-feedback ${
              attemptState.feedback.result === "correct" ? "correct" : "incorrect"
            }`}
          >
            <strong>
              {attemptState.feedback.result === "correct" ? "Correct" : "Try again"}
            </strong>
            <p>{attemptState.feedback.message}</p>
            {attemptState.feedback.mismatches.length > 0 ? (
              <ul className="envisioning-mismatch-list">
                {attemptState.feedback.mismatches.map((mismatch) => (
                  <li key={mismatch.field}>
                    {mismatchFieldLabels[mismatch.field]} mismatch: proposed{" "}
                    {mismatch.field === "relationTypeId"
                      ? resolveRelationTypeLabel(mismatch.proposed)
                      : resolveNodeLabel(mismatch.proposed)}{" "}
                    · expected{" "}
                    {mismatch.field === "relationTypeId"
                      ? resolveRelationTypeLabel(mismatch.expected)
                      : resolveNodeLabel(mismatch.expected)}
                  </li>
                ))}
              </ul>
            ) : null}
            {attemptState.feedback.restoredRelation ? (
              <div className="envisioning-evidence restored-relation">
                <small>Restored relation</small>
                <p>
                  {resolveNodeLabel(attemptState.feedback.restoredRelation.sourceNodeId)}{" "}
                  →{" "}
                  {resolveRelationTypeLabel(
                    attemptState.feedback.restoredRelation.relationTypeId,
                  )}{" "}
                  →{" "}
                  {resolveNodeLabel(attemptState.feedback.restoredRelation.targetNodeId)}
                </p>
              </div>
            ) : null}
            {attemptState.feedback.debugEvidence ? (
              <div className="envisioning-evidence">
                <small>
                  Evidence · {attemptState.feedback.debugEvidence.chunkId}
                  {attemptState.feedback.debugEvidence.sectionTitle
                    ? ` · ${attemptState.feedback.debugEvidence.sectionTitle}`
                    : ""}
                </small>
                <p>{attemptState.feedback.debugEvidence.text}</p>
              </div>
            ) : null}
            {attemptState.feedback.result === "incorrect" ? (
              <>
                <p className="callout-info">
                  Debugging guidance does not reveal the benchmark answer. It
                  points back to the evidence sentence so you can check the
                  relation wording, relation type, and source-to-target direction
                  before trying again.
                </p>
                <button
                  className="secondary-action"
                  disabled={attemptState.isLoadingDebug}
                  onClick={handleGenerateDebugGuidance}
                  type="button"
                >
                  {attemptState.isLoadingDebug
                    ? "Generating guidance…"
                    : "Get debugging guidance"}
                </button>
              </>
            ) : null}
            {attemptState.debugGuidance ? (
              <div className="debug-guidance">
                <p>{attemptState.debugGuidance.message}</p>
                <p className="callout-info">
                  Self-debugging loop: reread the source evidence, compare your
                  proposed relation with the taxonomy, then revise the same
                  hidden relation instead of receiving the answer immediately.
                </p>
                <ul className="debug-prompt-list">
                  {attemptState.debugGuidance.prompts.map((prompt) => (
                    <li key={prompt.id}>
                      <small>{prompt.focus}</small>
                      <span>{prompt.text}</span>
                    </li>
                  ))}
                </ul>
                <div className="envisioning-evidence">
                  <small>
                    Evidence · {attemptState.debugGuidance.evidence.chunkId}
                    {attemptState.debugGuidance.evidence.sectionTitle
                      ? ` · ${attemptState.debugGuidance.evidence.sectionTitle}`
                      : ""}
                  </small>
                  <p>{attemptState.debugGuidance.evidence.text}</p>
                </div>
              </div>
            ) : null}
          </article>
        ) : null}
      </div>
      ) : null}
    </div>
  );
}
