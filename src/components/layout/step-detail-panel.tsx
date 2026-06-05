"use client";

import {
  EnvisioningPanel,
  type TaskAttemptState,
} from "@/components/envisioning/envisioning-panel";
import { DiagnosisPanel } from "@/components/validation/diagnosis-panel";
import type { ValidationSessionState } from "@/components/validation/validation-session";
import type { HiddenRelationTask } from "@/schemas/benchmark-ontology";
import type { PipelineSession } from "@/lib/pipeline/pipeline-session";
import type { BenchmarkOntologyPrepareResponse } from "@/schemas/benchmark-ontology";
import type { LearnerAttemptResult } from "@/schemas/learner-attempt";

type StepDetailPanelProps = {
  activeStep: number;
  session: PipelineSession;
  title: string;
  text: string;
  onTitleChange: (value: string) => void;
  onTextChange: (value: string) => void;
  onLoadCourseNote: (source: "default" | "excerpt" | "session") => void;
  isLoadingCourseNote: boolean;
  isLoadingCourseNoteExcerpt: boolean;
  isLoadingSessionNote: boolean;
  prepareResponse: BenchmarkOntologyPrepareResponse | null;
  attemptResults: LearnerAttemptResult[];
  attemptsByTaskId: Record<string, TaskAttemptState>;
  onAttemptsChange: (
    updater: (
      current: Record<string, TaskAttemptState>,
    ) => Record<string, TaskAttemptState>,
  ) => void;
  activeEnvisioningTaskIndex: number;
  onActiveEnvisioningTaskIndexChange: (index: number) => void;
  onAttemptResult: (attempt: LearnerAttemptResult) => void;
  onRegenerateEnvisioning: () => Promise<void>;
  isRegeneratingEnvisioning: boolean;
  validationSession: ValidationSessionState;
  onValidationSessionChange: (
    updater: (current: ValidationSessionState) => ValidationSessionState,
  ) => void;
  validationError: string | null;
  onValidationErrorChange: (message: string | null) => void;
  restoreTasks: HiddenRelationTask[];
};

export function StepDetailPanel({
  activeStep,
  session,
  title,
  text,
  onTitleChange,
  onTextChange,
  onLoadCourseNote,
  isLoadingCourseNote,
  isLoadingCourseNoteExcerpt,
  isLoadingSessionNote,
  prepareResponse,
  attemptResults,
  attemptsByTaskId,
  onAttemptsChange,
  activeEnvisioningTaskIndex,
  onActiveEnvisioningTaskIndexChange,
  onAttemptResult,
  onRegenerateEnvisioning,
  isRegeneratingEnvisioning,
  validationSession,
  onValidationSessionChange,
  validationError,
  onValidationErrorChange,
  restoreTasks,
}: StepDetailPanelProps) {
  const groupedRelations = Object.entries(
    session.relationTypes.reduce<Record<string, typeof session.relationTypes>>(
      (groups, relationType) => {
        groups[relationType.category] ??= [];
        groups[relationType.category].push(relationType);
        return groups;
      },
      {},
    ),
  );

  const relationTypeNameById = new Map(
    session.relationTypes.map((relationType) => [relationType.id, relationType.name]),
  );

  if (activeStep === 0) {
    return (
      <div className="detail-content">
        <div className="detail-actions">
          <button
            className="secondary-action"
            disabled={isLoadingCourseNote}
            onClick={() => onLoadCourseNote("default")}
            type="button"
          >
            {isLoadingCourseNote ? "Loading…" : "Session 2 full"}
          </button>
          <button
            className="secondary-action"
            disabled={isLoadingCourseNoteExcerpt}
            onClick={() => onLoadCourseNote("excerpt")}
            type="button"
          >
            {isLoadingCourseNoteExcerpt ? "Loading…" : "Excerpt"}
          </button>
          <button
            className="secondary-action"
            disabled={isLoadingSessionNote}
            onClick={() => onLoadCourseNote("session")}
            type="button"
          >
            {isLoadingSessionNote ? "Loading…" : "Envisioning demo"}
          </button>
        </div>
        <label>
          Title
          <input onChange={(event) => onTitleChange(event.target.value)} value={title} />
        </label>
        <label>
          Course note
          <textarea onChange={(event) => onTextChange(event.target.value)} rows={14} value={text} />
        </label>
        {session.sourceChunks.length > 0 ? (
          <>
            <div className="panel-heading">
              <h3>Ingest results · Source chunks</h3>
              <strong>{session.summary.chunkCount}</strong>
            </div>
            <div className="scroll-list compact-scroll">
              {session.sourceChunks.map((chunk) => (
                <article className="chunk-row" key={chunk.id}>
                  <small>
                    {chunk.id} · {chunk.sectionTitle ?? chunk.sectionId} · sentence{" "}
                    {chunk.sentenceIndex}
                  </small>
                  <p>{chunk.text}</p>
                </article>
              ))}
            </div>
            <div className="panel-heading">
              <h3>Relation taxonomy</h3>
              <strong>{session.summary.relationTypeCount}</strong>
            </div>
            <div className="scroll-list compact-scroll">
              {groupedRelations.map(([category, relationTypes]) => (
                <article className="taxonomy-group" key={category}>
                  <h3>{category}</h3>
                  <div className="relation-chip-list">
                    {relationTypes.map((relationType) => (
                      <span className="relation-chip" key={relationType.id}>
                        {relationType.name}
                        <small>{relationType.argumentPattern}</small>
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <p className="empty">Enter a course note, then run the Ingest stage.</p>
        )}
      </div>
    );
  }

  if (activeStep === 1) {
    return (
      <div className="detail-content">
        <div className="panel-heading">
          <h3>Node candidates</h3>
          <strong>{session.summary.nodeCandidateCount}</strong>
        </div>
        <div className="scroll-list">
          {session.nodeCandidates.map((candidate) => (
            <article className="candidate-row" key={candidate.id}>
              <small>
                {candidate.id} · {candidate.type} · depth {candidate.abstractionDepth}
              </small>
              <h3>{candidate.name}</h3>
              <p>{candidate.rationale}</p>
            </article>
          ))}
          {session.nodeCandidates.length === 0 ? (
            <p className="empty">Run the Concept extraction stage.</p>
          ) : null}
        </div>
      </div>
    );
  }

  if (activeStep === 2) {
    return (
      <div className="detail-content">
        <div className="panel-heading">
          <h3>Relation candidates</h3>
          <strong>{session.summary.relationCandidateCount}</strong>
        </div>
        <div className="scroll-list">
          {session.candidateRelations.map((relation) => {
            const sourceCandidate = session.nodeCandidates.find(
              (candidate) => candidate.id === relation.sourceCandidateId,
            );
            const targetCandidate = session.nodeCandidates.find(
              (candidate) => candidate.id === relation.targetCandidateId,
            );

            return (
              <article
                className={`candidate-row ${relation.status === "unsupported" ? "unsupported" : ""}`}
                key={relation.id}
              >
                <small>
                  {relation.id} · {relation.status} · confidence {relation.confidence}
                </small>
                <h3>
                  {sourceCandidate?.name ?? relation.sourceCandidateId} →{" "}
                  {relationTypeNameById.get(relation.relationTypeId) ??
                    relation.relationTypeId}{" "}
                  → {targetCandidate?.name ?? relation.targetCandidateId}
                </h3>
                <p>{relation.evidenceSource.text}</p>
              </article>
            );
          })}
          {session.candidateRelations.length === 0 ? (
            <p className="empty">Run the Relation extraction stage.</p>
          ) : null}
        </div>
      </div>
    );
  }

  if (activeStep === 3) {
    return (
      <div className="detail-content">
        <div className="panel-heading">
          <h3>Verified relations</h3>
          <strong>{session.summary.verifiedRelationCount}</strong>
        </div>
        <div className="scroll-list">
          {session.verifiedRelations.map((relation) => {
            const sourceNode = session.nodeCandidates.find(
              (node) => node.id === relation.sourceNodeId,
            );
            const targetNode = session.nodeCandidates.find(
              (node) => node.id === relation.targetNodeId,
            );

            return (
              <article className="candidate-row verified" key={relation.id}>
                <small>
                  {relation.id} · {relation.evidenceChunkId} · verified
                </small>
                <h3>
                  {sourceNode?.name ?? relation.sourceNodeId} →{" "}
                  {relationTypeNameById.get(relation.relationTypeId) ??
                    relation.relationTypeId}{" "}
                  → {targetNode?.name ?? relation.targetNodeId}
                </h3>
                <p>{relation.evidenceText}</p>
              </article>
            );
          })}
          {session.verifiedRelations.length === 0 ? (
            <p className="empty">Run the Evidence verification stage.</p>
          ) : null}
        </div>
      </div>
    );
  }

  if (activeStep === 4) {
    return (
      <div className="detail-content">
        <div className="panel-heading">
          <h3>Benchmark ontology</h3>
          <strong>{session.benchmarkOntology?.summary.nodeCount ?? 0}</strong>
        </div>
        {session.benchmarkOntology ? (
          <>
            <p className="graph-summary">
              {session.benchmarkOntology.summary.verifiedRelationCount} verified relation ·{" "}
              {session.benchmarkOntology.summary.evidenceChunkCount} evidence chunk
            </p>
            <div className="scroll-list">
              {session.benchmarkOntology.relations.map((relation) => {
                const sourceNode = session.benchmarkOntology?.nodes.find(
                  (node) => node.id === relation.sourceNodeId,
                );
                const targetNode = session.benchmarkOntology?.nodes.find(
                  (node) => node.id === relation.targetNodeId,
                );

                return (
                  <article className="candidate-row verified" key={relation.id}>
                    <small>{relation.id} · verified</small>
                    <h3>
                      {sourceNode?.name ?? relation.sourceNodeId} →{" "}
                      {relationTypeNameById.get(relation.relationTypeId) ??
                        relation.relationTypeId}{" "}
                      → {targetNode?.name ?? relation.targetNodeId}
                    </h3>
                    <p>{relation.evidenceText}</p>
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          <p className="empty">Run the Benchmark ontology stage.</p>
        )}
      </div>
    );
  }

  if (activeStep === 5) {
    return prepareResponse ? (
      <EnvisioningPanel
        activeTaskIndex={activeEnvisioningTaskIndex}
        attemptsByTaskId={attemptsByTaskId}
        isRegeneratingEnvisioning={isRegeneratingEnvisioning}
        onActiveTaskIndexChange={onActiveEnvisioningTaskIndexChange}
        onAttemptResult={onAttemptResult}
        onAttemptsChange={onAttemptsChange}
        onRegenerateEnvisioning={onRegenerateEnvisioning}
        result={prepareResponse}
        view="overview"
      />
    ) : (
      <p className="empty">Run the Envisioning task stage.</p>
    );
  }

  if (!prepareResponse) {
    return (
      <p className="empty">
        Complete benchmark ontology and envisioning before starting validation.
      </p>
    );
  }

  if (activeStep === 6) {
    return (
      <EnvisioningPanel
        activeTaskIndex={activeEnvisioningTaskIndex}
        attemptsByTaskId={attemptsByTaskId}
        onActiveTaskIndexChange={onActiveEnvisioningTaskIndexChange}
        onAttemptResult={onAttemptResult}
        onAttemptsChange={onAttemptsChange}
        restoreTasks={restoreTasks}
        result={prepareResponse}
        view="restore"
      />
    );
  }

  return (
    <DiagnosisPanel
      attemptResults={attemptResults}
      error={validationError}
      onErrorChange={onValidationErrorChange}
      onSessionChange={onValidationSessionChange}
      result={prepareResponse}
      session={validationSession}
    />
  );
}
