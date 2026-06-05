import { getDefaultRelationTypes } from "@/domain/ontology/relation-taxonomy";
import { defaultEnvisioningTaskConfig } from "@/lib/config/envisioning-task-config";
import { verifyRelationEvidence } from "@/pipeline/evidence-verification/verify-relation-evidence";
import { generateNodeCandidates } from "@/pipeline/node-candidates/generate-node-candidates";
import { validateNodeCandidatesWithLlm } from "@/pipeline/node-candidates/validate-node-candidates";
import { buildBenchmarkOntology } from "@/pipeline/ontology-builder/build-benchmark-ontology";
import { extractRelationCandidates } from "@/pipeline/relation-extraction/extract-relation-candidates";
import { validateRelationCandidatesWithLlm } from "@/pipeline/relation-extraction/validate-relation-candidates";
import { chunkCourseNote } from "@/pipeline/source-parser/chunk-course-note";
import {
  buildStageEnvelope,
  resolveLlmClient,
  type PipelineStageOptions,
} from "@/pipeline/stages/shared";
import { generateEnvisioningTasks } from "@/pipeline/task-masker/generate-envisioning-tasks";
import {
  benchmarkStageResponseSchema,
  envisioningStageResponseSchema,
  ingestStageResponseSchema,
  nodesStageResponseSchema,
  relationsStageResponseSchema,
  verifyStageResponseSchema,
  type BenchmarkStageRequest,
  type EnvisioningStageRequest,
  type IngestStageRequest,
  type NodesStageRequest,
  type RelationsStageRequest,
  type VerifyStageRequest,
} from "@/schemas/pipeline-stages";

export async function runIngestStage(
  input: IngestStageRequest,
  options: PipelineStageOptions = {},
) {
  options.onProgress?.(15);

  const sourceChunks = chunkCourseNote({
    text: input.courseNote.text,
    title: input.courseNote.title,
  });
  const relationTypes = input.relationTypes ?? getDefaultRelationTypes();

  options.onProgress?.(100);

  return ingestStageResponseSchema.parse(
    buildStageEnvelope({
      stageName: "source_chunking",
      nextStage: "nodes",
      data: {
        sourceChunks,
        relationTypes,
        summary: {
          sourceTitle: input.courseNote.title,
          chunkCount: sourceChunks.length,
          relationTypeCount: relationTypes.length,
        },
      },
    }),
  );
}

export async function runNodesStage(
  input: NodesStageRequest,
  options: PipelineStageOptions = {},
) {
  options.onProgress?.(10);

  const heuristicNodeCandidates = generateNodeCandidates(input.sourceChunks);
  const llmClient = resolveLlmClient(input.enableLlmValidation, options);

  options.onProgress?.(20);

  const nodeValidation = llmClient
    ? await validateNodeCandidatesWithLlm({
        nodeCandidates: heuristicNodeCandidates,
        sourceChunks: input.sourceChunks,
        llmClient,
        onProgress: options.onProgress,
        progressRange: { start: 20, end: 100 },
      })
    : { nodeCandidates: heuristicNodeCandidates, warnings: [] as string[] };

  options.onProgress?.(100);

  return nodesStageResponseSchema.parse(
    buildStageEnvelope({
      stageName: llmClient ? "concept_llm_validation" : "node_candidate_generation",
      nextStage: "relations",
      warnings: nodeValidation.warnings,
      data: {
        nodeCandidates: nodeValidation.nodeCandidates,
        summary: {
          nodeCandidateCount: nodeValidation.nodeCandidates.length,
          heuristicCandidateCount: heuristicNodeCandidates.length,
          llmValidationEnabled: llmClient !== null,
        },
      },
    }),
  );
}

export async function runRelationsStage(
  input: RelationsStageRequest,
  options: PipelineStageOptions = {},
) {
  options.onProgress?.(10);

  const heuristicRelations = extractRelationCandidates({
    sourceChunks: input.sourceChunks,
    nodeCandidates: input.nodeCandidates,
    relationTypes: input.relationTypes,
  });
  const llmClient = resolveLlmClient(input.enableLlmValidation, options);

  options.onProgress?.(20);

  const relationValidation = llmClient
    ? await validateRelationCandidatesWithLlm({
        candidateRelations: heuristicRelations,
        nodeCandidates: input.nodeCandidates,
        relationTypes: input.relationTypes,
        llmClient,
        onProgress: options.onProgress,
        progressRange: { start: 20, end: 100 },
      })
    : { candidateRelations: heuristicRelations, warnings: [] as string[] };

  options.onProgress?.(100);

  return relationsStageResponseSchema.parse(
    buildStageEnvelope({
      stageName: llmClient
        ? "relation_llm_validation"
        : "evidence_grounded_relation_extraction",
      nextStage: "verify",
      warnings: relationValidation.warnings,
      data: {
        candidateRelations: relationValidation.candidateRelations,
        summary: {
          relationCandidateCount: relationValidation.candidateRelations.length,
          heuristicCandidateCount: heuristicRelations.length,
          llmValidationEnabled: llmClient !== null,
        },
      },
    }),
  );
}

export async function runVerifyStage(
  input: VerifyStageRequest,
  options: PipelineStageOptions = {},
) {
  options.onProgress?.(20);

  const verifiedRelations = verifyRelationEvidence({
    candidateRelations: input.candidateRelations,
    nodeCandidates: input.nodeCandidates,
    sourceChunks: input.sourceChunks,
  });

  options.onProgress?.(100);

  return verifyStageResponseSchema.parse(
    buildStageEnvelope({
      stageName: "evidence_verification",
      nextStage: "benchmark",
      data: {
        verifiedRelations,
        summary: {
          verifiedRelationCount: verifiedRelations.length,
        },
      },
    }),
  );
}

export async function runBenchmarkStage(
  input: BenchmarkStageRequest,
  options: PipelineStageOptions = {},
) {
  options.onProgress?.(25);

  const benchmarkOntology = buildBenchmarkOntology({
    nodeCandidates: input.nodeCandidates,
    verifiedRelations: input.verifiedRelations,
  });

  options.onProgress?.(100);

  return benchmarkStageResponseSchema.parse(
    buildStageEnvelope({
      stageName: "benchmark_ontology_generation",
      nextStage: "envisioning",
      data: {
        benchmarkOntology,
      },
    }),
  );
}

export async function runEnvisioningStage(
  input: EnvisioningStageRequest,
  options: PipelineStageOptions = {},
) {
  options.onProgress?.(25);

  const learnerFacingOntology = generateEnvisioningTasks({
    benchmarkOntology: input.benchmarkOntology,
    config: {
      maxHiddenRelations:
        input.maxHiddenRelations ?? defaultEnvisioningTaskConfig.maxHiddenRelations,
      relationTypePriority:
        input.relationTypePriority ?? defaultEnvisioningTaskConfig.relationTypePriority,
    },
  });

  options.onProgress?.(100);

  return envisioningStageResponseSchema.parse(
    buildStageEnvelope({
      stageName: "envisioning_task_generation",
      nextStage: "attempts",
      data: {
        learnerFacingOntology,
        summary: {
          hiddenRelationCount: learnerFacingOntology.summary.hiddenRelationCount,
          visibleRelationCount: learnerFacingOntology.summary.visibleRelationCount,
        },
      },
    }),
  );
}
