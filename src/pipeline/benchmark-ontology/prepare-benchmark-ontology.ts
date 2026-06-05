import {
  runBenchmarkStage,
  runEnvisioningStage,
  runIngestStage,
  runNodesStage,
  runRelationsStage,
  runVerifyStage,
} from "@/pipeline/stages/run-pipeline-stages";
import { type PipelineStageOptions } from "@/pipeline/stages/shared";
import {
  benchmarkOntologyPrepareRequestSchema,
  benchmarkOntologyPrepareResponseSchema,
  type BenchmarkOntologyPrepareRequest,
  type BenchmarkOntologyPrepareResponse,
  type PipelineStage,
} from "@/schemas/benchmark-ontology";

export type PrepareBenchmarkOntologyOptions = PipelineStageOptions;

export async function prepareBenchmarkOntologyInput(
  input: BenchmarkOntologyPrepareRequest,
  options: PrepareBenchmarkOntologyOptions = {},
): Promise<BenchmarkOntologyPrepareResponse> {
  const request = benchmarkOntologyPrepareRequestSchema.parse(input);
  const stages: PipelineStage[] = [
    {
      name: "input_schema",
      status: "completed",
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      warnings: [],
      errors: [],
    },
  ];

  const ingest = await runIngestStage(
    {
      courseNote: request.courseNote,
      relationTypes: request.relationTypes,
    },
    options,
  );
  stages.push(ingest.stage, {
    name: "relation_taxonomy_loading",
    status: "completed",
    startedAt: ingest.stage.startedAt,
    finishedAt: ingest.stage.finishedAt,
    warnings: [],
    errors: [],
  });

  const nodes = await runNodesStage(
    {
      sourceChunks: ingest.data.sourceChunks,
      enableLlmValidation: request.enableLlmValidation,
    },
    options,
  );
  stages.push(nodes.stage);

  const relations = await runRelationsStage(
    {
      sourceChunks: ingest.data.sourceChunks,
      nodeCandidates: nodes.data.nodeCandidates,
      relationTypes: ingest.data.relationTypes,
      enableLlmValidation: request.enableLlmValidation,
    },
    options,
  );
  stages.push(relations.stage);

  const verify = await runVerifyStage(
    {
      sourceChunks: ingest.data.sourceChunks,
      nodeCandidates: nodes.data.nodeCandidates,
      candidateRelations: relations.data.candidateRelations,
    },
    options,
  );
  stages.push(verify.stage);

  const benchmark = await runBenchmarkStage(
    {
      nodeCandidates: nodes.data.nodeCandidates,
      verifiedRelations: verify.data.verifiedRelations,
    },
    options,
  );
  stages.push(benchmark.stage);

  const envisioning = await runEnvisioningStage(
    {
      benchmarkOntology: benchmark.data.benchmarkOntology,
    },
    options,
  );
  stages.push(envisioning.stage);

  return benchmarkOntologyPrepareResponseSchema.parse({
    sourceChunks: ingest.data.sourceChunks,
    relationTypes: ingest.data.relationTypes,
    nodeCandidates: nodes.data.nodeCandidates,
    candidateRelations: relations.data.candidateRelations,
    verifiedRelations: verify.data.verifiedRelations,
    benchmarkOntology: benchmark.data.benchmarkOntology,
    learnerFacingOntology: envisioning.data.learnerFacingOntology,
    stages,
    summary: {
      sourceTitle: ingest.data.summary.sourceTitle,
      chunkCount: ingest.data.summary.chunkCount,
      relationTypeCount: ingest.data.summary.relationTypeCount,
      nodeCandidateCount: nodes.data.summary.nodeCandidateCount,
      relationCandidateCount: relations.data.summary.relationCandidateCount,
      verifiedRelationCount: verify.data.summary.verifiedRelationCount,
      hiddenRelationCount: envisioning.data.summary.hiddenRelationCount,
      llmValidationEnabled:
        nodes.data.summary.llmValidationEnabled ||
        relations.data.summary.llmValidationEnabled,
    },
  });
}
