"use client";

import { useMemo, useRef, useState } from "react";

import { PipelinePanel } from "@/components/layout/pipeline-panel";
import { PipelineProgressBar } from "@/components/layout/pipeline-progress-bar";
import { StepDetailPanel } from "@/components/layout/step-detail-panel";
import { emptyValidationSessionState } from "@/components/validation/validation-session";
import { buildEnvisioningRestoreTasks } from "@/lib/envisioning/build-restore-tasks";
import { isEnvisioningRestoreComplete } from "@/lib/envisioning/envisioning-restore-progress";
import type { TaskAttemptState } from "@/components/envisioning/envisioning-panel";
import { EvidenceDetailPanel } from "@/components/visualization/evidence-detail-panel";
import { OntologyGraphView } from "@/components/visualization/ontology-graph-view";
import {
  buildBenchmarkGraphModel,
  buildCandidateGraphModel,
  buildLearnerFacingGraphModel,
  type GraphEdgeModel,
  type GraphModel,
} from "@/domain/visualization/build-graph-model";
import { pipelineFlowSteps } from "@/lib/config/pipeline-flow-config";
import { applyDemoSnapshotStep } from "@/lib/pipeline/apply-demo-snapshot-stage";
import {
  applyBenchmarkStage,
  applyEnvisioningStage,
  applyIngestStage,
  applyNodesStage,
  applyRelationsStage,
  applyVerifyStage,
  createEmptyPipelineSession,
  resetSessionFromStep,
  toPrepareResponse,
  type PipelineSession,
} from "@/lib/pipeline/pipeline-session";
import { postPipelineStage } from "@/lib/pipeline/run-stage";
import type { ApiResult } from "@/schemas/api-result";
import type {
  BenchmarkOntologyPrepareResponse,
  Concept,
  NodeCandidate,
} from "@/schemas/benchmark-ontology";
import type {
  benchmarkStageDataSchema,
  envisioningStageDataSchema,
  ingestStageDataSchema,
  nodesStageDataSchema,
  relationsStageDataSchema,
  verifyStageDataSchema,
} from "@/schemas/pipeline-stages";
import type { z } from "zod";
import type { LearnerAttemptResult } from "@/schemas/learner-attempt";
import type { ValidationSessionState } from "@/components/validation/validation-session";

type DefaultCourseNoteResponse = {
  title: string;
  text: string;
  sourcePath: string;
  isDemoSnapshot?: boolean;
  pipelineSnapshot?: BenchmarkOntologyPrepareResponse;
  completedPipelineStepCount?: number;
};

type IngestData = z.infer<typeof ingestStageDataSchema>;
type NodesData = z.infer<typeof nodesStageDataSchema>;
type RelationsData = z.infer<typeof relationsStageDataSchema>;
type VerifyData = z.infer<typeof verifyStageDataSchema>;
type BenchmarkData = z.infer<typeof benchmarkStageDataSchema>;
type EnvisioningData = z.infer<typeof envisioningStageDataSchema>;

const sampleCourseNote = `1 Representation:
KRR uses constraints. Constraints organize concepts.

2 Reasoning:
Reasoning depends on representations. Constraint networks support reasoning.`;

function candidatesAsConcepts(candidates: NodeCandidate[]): Concept[] {
  return candidates.map((candidate) => ({
    id: candidate.id,
    name: candidate.name,
    type: candidate.type,
    abstractionDepth: candidate.abstractionDepth,
    sourceChunkIds: candidate.sourceChunkIds,
  }));
}

export function LearningWorkspace() {
  const sessionRef = useRef<PipelineSession>(createEmptyPipelineSession());
  const demoSnapshotRef = useRef<BenchmarkOntologyPrepareResponse | null>(null);
  const [title, setTitle] = useState("KRR note");
  const [text, setText] = useState(sampleCourseNote);
  const [session, setSession] = useState<PipelineSession>(sessionRef.current);
  const [completedStepIndexes, setCompletedStepIndexes] = useState<Set<number>>(
    new Set(),
  );
  const [error, setError] = useState<string | null>(null);
  const [isRunningStep, setIsRunningStep] = useState(false);
  const [runProgressPercent, setRunProgressPercent] = useState<number | null>(null);
  const [isLoadingCourseNote, setIsLoadingCourseNote] = useState(false);
  const [isLoadingCourseNoteExcerpt, setIsLoadingCourseNoteExcerpt] =
    useState(false);
  const [isLoadingSessionNote, setIsLoadingSessionNote] = useState(false);
  const [isRegeneratingEnvisioning, setIsRegeneratingEnvisioning] = useState(false);
  const [attemptResults, setAttemptResults] = useState<LearnerAttemptResult[]>([]);
  const [attemptsByTaskId, setAttemptsByTaskId] = useState<
    Record<string, TaskAttemptState>
  >({});
  const [activeEnvisioningTaskIndex, setActiveEnvisioningTaskIndex] = useState(0);
  const [validationSession, setValidationSession] =
    useState<ValidationSessionState>(emptyValidationSessionState);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdgeModel | null>(null);

  function commitSession(
    updater: (current: PipelineSession) => PipelineSession,
  ): PipelineSession {
    const nextSession = updater(sessionRef.current);
    sessionRef.current = nextSession;
    setSession(nextSession);
    return nextSession;
  }

  const prepareResponse = useMemo(() => toPrepareResponse(session), [session]);

  const restoreTasks = useMemo(() => {
    if (!prepareResponse?.learnerFacingOntology || !prepareResponse.benchmarkOntology) {
      return [];
    }

    return buildEnvisioningRestoreTasks({
      benchmarkOntology: prepareResponse.benchmarkOntology,
      learnerFacingOntology: prepareResponse.learnerFacingOntology,
    });
  }, [prepareResponse]);

  const relationTypeNameById = useMemo(
    () =>
      new Map(session.relationTypes.map((relationType) => [relationType.id, relationType.name])),
    [session.relationTypes],
  );

  const nodeNameById = useMemo(() => {
    const names = new Map<string, string>();

    for (const candidate of session.nodeCandidates) {
      names.set(candidate.id, candidate.name);
    }

    for (const node of session.benchmarkOntology?.nodes ?? []) {
      names.set(node.id, node.name);
    }

    for (const node of session.learnerFacingOntology?.nodes ?? []) {
      names.set(node.id, node.name);
    }

    return names;
  }, [session]);

  const restoredRelationIds = useMemo(() => {
    if (restoreTasks.length === 0) {
      return new Set<string>();
    }

    return new Set(
      restoreTasks
        .filter((task) => attemptsByTaskId[task.id]?.isRestored)
        .map((task) => task.benchmarkRelationId),
    );
  }, [attemptsByTaskId, restoreTasks]);

  const graphModel = useMemo((): GraphModel | null => {
    if (session.learnerFacingOntology && activeStep >= 5) {
      return buildLearnerFacingGraphModel({
        learnerFacingOntology: session.learnerFacingOntology,
        relationTypeNameById,
        restoredRelationIds,
      });
    }

    if (session.benchmarkOntology && activeStep >= 4) {
      return buildBenchmarkGraphModel({
        nodes: session.benchmarkOntology.nodes,
        relations: session.benchmarkOntology.relations,
        relationTypeNameById,
      });
    }

    if (session.verifiedRelations.length > 0 && activeStep >= 3) {
      return buildBenchmarkGraphModel({
        nodes: candidatesAsConcepts(session.nodeCandidates),
        relations: session.verifiedRelations,
        relationTypeNameById,
      });
    }

    if (session.candidateRelations.length > 0 && activeStep >= 2) {
      return buildCandidateGraphModel({
        nodes: candidatesAsConcepts(session.nodeCandidates),
        candidateRelations: session.candidateRelations,
        nodeNameById,
        relationTypeNameById,
      });
    }

    return null;
  }, [activeStep, nodeNameById, relationTypeNameById, restoredRelationIds, session]);

  const pipelineWarnings = useMemo(
    () =>
      session.stages.flatMap((stage) =>
        stage.warnings.map((warning) => `${stage.name}: ${warning}`),
      ),
    [session.stages],
  );

  const highestCompletedStep = useMemo(() => {
    if (completedStepIndexes.size === 0) {
      return -1;
    }

    return Math.max(...completedStepIndexes);
  }, [completedStepIndexes]);

  const maxNavigableStep = useMemo(() => {
    if (highestCompletedStep < 0) {
      return 0;
    }

    if (highestCompletedStep >= 5) {
      return pipelineFlowSteps.length - 1;
    }

    return Math.min(highestCompletedStep + 1, pipelineFlowSteps.length - 1);
  }, [highestCompletedStep]);

  const activeStepMeta = pipelineFlowSteps[activeStep];
  const isCurrentStepCompleted = completedStepIndexes.has(activeStep);
  const canGoPrev = activeStep > 0;
  const canGoNext =
    activeStep < pipelineFlowSteps.length - 1 && canAdvanceFromStep(activeStep);

  function canAdvanceFromStep(stepIndex: number) {
    if (pipelineFlowSteps[stepIndex].apiPath) {
      return completedStepIndexes.has(stepIndex);
    }

    if (highestCompletedStep < 5) {
      return false;
    }

    if (stepIndex === 6) {
      return isEnvisioningRestoreComplete(restoreTasks, attemptsByTaskId);
    }

    return false;
  }
  const isStreamingStep = isRunningStep || isRegeneratingEnvisioning;

  function resetLearningSession() {
    const emptySession = createEmptyPipelineSession();
    sessionRef.current = emptySession;
    setSession(emptySession);
    setCompletedStepIndexes(new Set());
    setError(null);
    setAttemptResults([]);
    setAttemptsByTaskId({});
    setActiveEnvisioningTaskIndex(0);
    setValidationSession(emptyValidationSessionState);
    setValidationError(null);
    setSelectedEdge(null);
    setRunProgressPercent(null);
    setActiveStep(0);
    demoSnapshotRef.current = null;
  }

  function markStepCompleted(stepIndex: number) {
    setCompletedStepIndexes((current) => new Set([...current, stepIndex]));
  }

  function handleAttemptResult(attempt: LearnerAttemptResult) {
    setAttemptResults((current) => {
      const withoutCurrent = current.filter(
        (existing) => existing.hiddenTaskId !== attempt.hiddenTaskId,
      );
      return [...withoutCurrent, attempt];
    });
  }

  async function handleRegenerateEnvisioning() {
    if (!session.benchmarkOntology) {
      return;
    }

    setIsRegeneratingEnvisioning(true);
    setRunProgressPercent(0);
    setError(null);

    try {
      const payload = await postPipelineStage<EnvisioningData>(
        "/api/pipeline/stages/envisioning",
        {
          benchmarkOntology: session.benchmarkOntology,
        },
        setRunProgressPercent,
      );

      if (!payload.ok) {
        setError(payload.error.message);
        return;
      }

      commitSession((current) =>
        applyEnvisioningStage(current, payload.data.stage, payload.data.data),
      );
      setAttemptResults([]);
      setAttemptsByTaskId({});
      setActiveEnvisioningTaskIndex(0);
      markStepCompleted(5);
    } catch {
      setError("Failed to regenerate envisioning tasks.");
    } finally {
      setIsRegeneratingEnvisioning(false);
      setRunProgressPercent(null);
    }
  }

  async function handleLoadCourseNote(source: "default" | "excerpt" | "session") {
    const setLoading =
      source === "default"
        ? setIsLoadingCourseNote
        : source === "excerpt"
          ? setIsLoadingCourseNoteExcerpt
          : setIsLoadingSessionNote;

    setLoading(true);
    setError(null);

    const endpoint =
      source === "default"
        ? "/api/course-note/default"
        : source === "excerpt"
          ? "/api/course-note/excerpt"
          : "/api/course-note/envisioning-demo";

    try {
      const response = await fetch(endpoint);
      const payload =
        (await response.json()) as ApiResult<DefaultCourseNoteResponse>;

      if (!payload.ok) {
        setError(payload.error.message);
        return;
      }

      setTitle(payload.data.title);
      setText(payload.data.text);

      resetLearningSession();

      if (source === "session" && payload.data.pipelineSnapshot) {
        demoSnapshotRef.current = payload.data.pipelineSnapshot;
      }
    } catch {
      setError("Failed to load the course note.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRunCurrentStep() {
    const step = pipelineFlowSteps[activeStep];

    if (!step.apiPath) {
      return;
    }

    setError(null);

    const requestSession = sessionRef.current;

    if (demoSnapshotRef.current) {
      commitSession((current) => resetSessionFromStep(current, activeStep));
      commitSession((current) =>
        applyDemoSnapshotStep(current, demoSnapshotRef.current!, activeStep),
      );
      markStepCompleted(activeStep);
      setSelectedEdge(null);
      return;
    }

    setIsRunningStep(true);
    setRunProgressPercent(0);

    if (activeStep === 1 && requestSession.sourceChunks.length === 0) {
      setError("Run the Ingest stage first to create source chunks.");
      setIsRunningStep(false);
      setRunProgressPercent(null);
      return;
    }

    if (activeStep === 2 && requestSession.nodeCandidates.length === 0) {
      setError("Run the Concept extraction stage first to create node candidates.");
      setIsRunningStep(false);
      setRunProgressPercent(null);
      return;
    }

    if (activeStep === 3 && requestSession.candidateRelations.length === 0) {
      setError("Run the Relation extraction stage first to create relation candidates.");
      setIsRunningStep(false);
      setRunProgressPercent(null);
      return;
    }

    if (activeStep === 4 && requestSession.verifiedRelations.length === 0) {
      setError("Run the Evidence verification stage first to create verified relations.");
      setIsRunningStep(false);
      setRunProgressPercent(null);
      return;
    }

    if (activeStep === 5 && !requestSession.benchmarkOntology) {
      setError("Run the Benchmark ontology stage first.");
      setIsRunningStep(false);
      setRunProgressPercent(null);
      return;
    }

    commitSession((current) => resetSessionFromStep(current, activeStep));

    try {
      if (activeStep === 0) {
        const payload = await postPipelineStage<IngestData>(
          step.apiPath,
          {
            courseNote: { title, text },
          },
          setRunProgressPercent,
        );

        if (!payload.ok) {
          setError(payload.error.message);
          return;
        }

        commitSession((current) =>
          applyIngestStage(current, payload.data.stage, payload.data.data),
        );
      } else if (activeStep === 1) {
        const payload = await postPipelineStage<NodesData>(
          step.apiPath,
          {
            sourceChunks: requestSession.sourceChunks,
          },
          setRunProgressPercent,
        );

        if (!payload.ok) {
          setError(payload.error.message);
          return;
        }

        commitSession((current) =>
          applyNodesStage(current, payload.data.stage, payload.data.data),
        );
      } else if (activeStep === 2) {
        const payload = await postPipelineStage<RelationsData>(
          step.apiPath,
          {
            sourceChunks: requestSession.sourceChunks,
            nodeCandidates: requestSession.nodeCandidates,
            relationTypes: requestSession.relationTypes,
          },
          setRunProgressPercent,
        );

        if (!payload.ok) {
          setError(payload.error.message);
          return;
        }

        commitSession((current) =>
          applyRelationsStage(current, payload.data.stage, payload.data.data),
        );
      } else if (activeStep === 3) {
        const payload = await postPipelineStage<VerifyData>(
          step.apiPath,
          {
            sourceChunks: requestSession.sourceChunks,
            nodeCandidates: requestSession.nodeCandidates,
            candidateRelations: requestSession.candidateRelations,
          },
          setRunProgressPercent,
        );

        if (!payload.ok) {
          setError(payload.error.message);
          return;
        }

        commitSession((current) =>
          applyVerifyStage(current, payload.data.stage, payload.data.data),
        );
      } else if (activeStep === 4) {
        const payload = await postPipelineStage<BenchmarkData>(
          step.apiPath,
          {
            nodeCandidates: requestSession.nodeCandidates,
            verifiedRelations: requestSession.verifiedRelations,
          },
          setRunProgressPercent,
        );

        if (!payload.ok) {
          setError(payload.error.message);
          return;
        }

        commitSession((current) =>
          applyBenchmarkStage(current, payload.data.stage, payload.data.data),
        );
      } else if (activeStep === 5) {
        const payload = await postPipelineStage<EnvisioningData>(
          step.apiPath,
          {
            benchmarkOntology: requestSession.benchmarkOntology!,
          },
          setRunProgressPercent,
        );

        if (!payload.ok) {
          setError(payload.error.message);
          return;
        }

        commitSession((current) =>
          applyEnvisioningStage(current, payload.data.stage, payload.data.data),
        );
      } else {
        return;
      }

      markStepCompleted(activeStep);
      setSelectedEdge(null);
    } catch {
      setError(`Failed to run the ${activeStepMeta.label} stage.`);
    } finally {
      setIsRunningStep(false);
      setRunProgressPercent(null);
    }
  }

  function handleStepSelect(index: number) {
    if (index > maxNavigableStep) {
      return;
    }

    setActiveStep(index);
    setSelectedEdge(null);
  }

  return (
    <main className="learning-shell">
      <header className="site-header">
        <h1>Qualitative Ontology Reconstruction</h1>
        <p>Evidence-based benchmark ontology creation and relation restoration learning</p>
      </header>

      <PipelinePanel
        activeStep={activeStep}
        completedStepIndexes={completedStepIndexes}
        maxNavigableStep={maxNavigableStep}
        onStepSelect={handleStepSelect}
        steps={pipelineFlowSteps}
      />

      <PipelineProgressBar
        percent={runProgressPercent ?? 0}
        visible={isStreamingStep}
      />

      <div className="workspace-panels">
        <section aria-live="polite" className="operation-panel">
          <header className="detail-panel-header">
            <div>
              <span className="detail-step-index">
                {String(activeStep + 1).padStart(2, "0")}
              </span>
              <h2>{activeStepMeta.label}</h2>
            </div>
            {activeStepMeta.apiPath ? (
              <span className="step-status-badge">
                {isCurrentStepCompleted ? "Complete" : "Pending"}
              </span>
            ) : (
              <span className="step-status-badge learner">Learner step</span>
            )}
          </header>

          {error || validationError ? (
            <p className="error-message">{error ?? validationError}</p>
          ) : null}
          {pipelineWarnings.length > 0 ? (
            <div className="warning-banner">
              <strong>Pipeline warnings</strong>
              <ul>
                {pipelineWarnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="operation-panel-body">
            <StepDetailPanel
              activeEnvisioningTaskIndex={activeEnvisioningTaskIndex}
              activeStep={activeStep}
              attemptResults={attemptResults}
              attemptsByTaskId={attemptsByTaskId}
              isLoadingCourseNote={isLoadingCourseNote}
              isLoadingCourseNoteExcerpt={isLoadingCourseNoteExcerpt}
              isLoadingSessionNote={isLoadingSessionNote}
              isRegeneratingEnvisioning={isRegeneratingEnvisioning}
              onActiveEnvisioningTaskIndexChange={setActiveEnvisioningTaskIndex}
              onAttemptResult={handleAttemptResult}
              onAttemptsChange={setAttemptsByTaskId}
              onLoadCourseNote={handleLoadCourseNote}
              onRegenerateEnvisioning={handleRegenerateEnvisioning}
              onTextChange={setText}
              onTitleChange={setTitle}
              onValidationErrorChange={setValidationError}
              onValidationSessionChange={setValidationSession}
              prepareResponse={prepareResponse}
              session={session}
              text={text}
              title={title}
              restoreTasks={restoreTasks}
              validationError={validationError}
              validationSession={validationSession}
            />
          </div>
        </section>

        <aside className="visualization-panel">
          <header className="viz-panel-header">
            <h2>Visualization</h2>
            <p>Review the graph and evidence together.</p>
          </header>
          <OntologyGraphView
            graph={graphModel}
            onSelectEdge={setSelectedEdge}
            selectedEdgeId={selectedEdge?.id ?? null}
          />
          <EvidenceDetailPanel
            nodeNameById={nodeNameById}
            selectedEdge={selectedEdge}
          />
        </aside>
      </div>

      <footer className="step-nav">
        <button
          className="secondary-action"
          disabled={!canGoPrev}
          onClick={() => handleStepSelect(activeStep - 1)}
          type="button"
        >
          Previous
        </button>

        <span className="step-nav-indicator">
          {activeStep + 1} / {pipelineFlowSteps.length}
        </span>

        <div className="step-nav-actions">
          <button
            className="secondary-action"
            disabled={isRunningStep}
            onClick={resetLearningSession}
            type="button"
          >
            Reset
          </button>
          {activeStepMeta.apiPath ? (
            <button
              className="primary-action"
              disabled={isRunningStep || (activeStep > 0 && !completedStepIndexes.has(activeStep - 1))}
              onClick={handleRunCurrentStep}
              type="button"
            >
              {isRunningStep
                ? "Running…"
                : isCurrentStepCompleted
                  ? "Run again"
                  : "Run this stage"}
            </button>
          ) : null}
          <button
            className="secondary-action"
            disabled={!canGoNext}
            onClick={() => handleStepSelect(activeStep + 1)}
            type="button"
          >
            Next
          </button>
        </div>
      </footer>
    </main>
  );
}
