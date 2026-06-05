import {
  applyBenchmarkStage,
  applyEnvisioningStage,
  applyIngestStage,
  applyNodesStage,
  applyRelationsStage,
  applyVerifyStage,
  type PipelineSession,
} from "@/lib/pipeline/pipeline-session";
import type {
  BenchmarkOntologyPrepareResponse,
  PipelineStage,
} from "@/schemas/benchmark-ontology";

const demoStageNamesByStep: readonly (readonly string[])[] = [
  ["source_chunking"],
  ["node_candidate_generation", "concept_llm_validation"],
  [
    "evidence_grounded_relation_extraction",
    "relation_llm_validation",
  ],
  ["evidence_verification"],
  ["benchmark_ontology_generation"],
  ["envisioning_task_generation"],
] as const;

function findDemoStage(
  snapshot: BenchmarkOntologyPrepareResponse,
  stepIndex: number,
): PipelineStage {
  const stageNames = demoStageNamesByStep[stepIndex];
  const stage = snapshot.stages.find((candidate) =>
    stageNames?.includes(candidate.name),
  );

  if (!stage) {
    throw new Error(`Demo snapshot is missing pipeline stage for step ${stepIndex}.`);
  }

  return stage;
}

export function applyDemoSnapshotStep(
  session: PipelineSession,
  snapshot: BenchmarkOntologyPrepareResponse,
  stepIndex: number,
): PipelineSession {
  const stage = findDemoStage(snapshot, stepIndex);

  switch (stepIndex) {
    case 0:
      return applyIngestStage(session, stage, {
        sourceChunks: snapshot.sourceChunks,
        relationTypes: snapshot.relationTypes,
        summary: {
          sourceTitle: snapshot.summary.sourceTitle,
          chunkCount: snapshot.summary.chunkCount,
          relationTypeCount: snapshot.summary.relationTypeCount,
        },
      });
    case 1:
      return applyNodesStage(session, stage, {
        nodeCandidates: snapshot.nodeCandidates,
        summary: {
          nodeCandidateCount: snapshot.summary.nodeCandidateCount,
          heuristicCandidateCount: snapshot.summary.nodeCandidateCount,
          llmValidationEnabled: snapshot.summary.llmValidationEnabled ?? false,
        },
      });
    case 2:
      return applyRelationsStage(session, stage, {
        candidateRelations: snapshot.candidateRelations,
        summary: {
          relationCandidateCount: snapshot.summary.relationCandidateCount,
          heuristicCandidateCount: snapshot.summary.relationCandidateCount,
          llmValidationEnabled: snapshot.summary.llmValidationEnabled ?? false,
        },
      });
    case 3:
      return applyVerifyStage(session, stage, {
        verifiedRelations: snapshot.verifiedRelations,
        summary: {
          verifiedRelationCount: snapshot.summary.verifiedRelationCount,
        },
      });
    case 4:
      return applyBenchmarkStage(session, stage, {
        benchmarkOntology: snapshot.benchmarkOntology,
      });
    case 5:
      return applyEnvisioningStage(session, stage, {
        learnerFacingOntology: snapshot.learnerFacingOntology,
        summary: {
          hiddenRelationCount: snapshot.summary.hiddenRelationCount,
          visibleRelationCount:
            snapshot.learnerFacingOntology.summary.visibleRelationCount,
        },
      });
    default:
      return session;
  }
}
