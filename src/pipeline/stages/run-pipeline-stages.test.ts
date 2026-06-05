import { describe, expect, it } from "vitest";

import { createMockLlmValidationClient } from "@/lib/llm/mock-validation-client";
import { prepareBenchmarkOntologyInput } from "@/pipeline/benchmark-ontology/prepare-benchmark-ontology";
import {
  runBenchmarkStage,
  runEnvisioningStage,
  runIngestStage,
  runNodesStage,
  runRelationsStage,
  runVerifyStage,
} from "@/pipeline/stages/run-pipeline-stages";
import { envisioningDemoCourseNote } from "@/test/fixtures/envisioning-demo-course-note";

const sampleCourseNote = {
  title: "KRR note",
  text: "1 Representation:\nKRR uses constraints. Constraints organize concepts. Constraint networks support reasoning.",
};

describe("runPipelineStages", () => {
  it("runs each stage independently and chains outputs through nextStage", async () => {
    const ingest = await runIngestStage({ courseNote: sampleCourseNote });
    expect(ingest.nextStage).toBe("nodes");
    expect(ingest.data.sourceChunks.length).toBeGreaterThan(0);

    const nodes = await runNodesStage({
      sourceChunks: ingest.data.sourceChunks,
    });
    expect(nodes.nextStage).toBe("relations");
    expect(nodes.data.nodeCandidates.length).toBeGreaterThan(0);

    const relations = await runRelationsStage({
      sourceChunks: ingest.data.sourceChunks,
      nodeCandidates: nodes.data.nodeCandidates,
      relationTypes: ingest.data.relationTypes,
    });
    expect(relations.nextStage).toBe("verify");

    const verify = await runVerifyStage({
      sourceChunks: ingest.data.sourceChunks,
      nodeCandidates: nodes.data.nodeCandidates,
      candidateRelations: relations.data.candidateRelations,
    });
    expect(verify.nextStage).toBe("benchmark");

    const benchmark = await runBenchmarkStage({
      nodeCandidates: nodes.data.nodeCandidates,
      verifiedRelations: verify.data.verifiedRelations,
    });
    expect(benchmark.nextStage).toBe("envisioning");

    const envisioning = await runEnvisioningStage({
      benchmarkOntology: benchmark.data.benchmarkOntology,
    });
    expect(envisioning.nextStage).toBe("attempts");
    expect(envisioning.data.learnerFacingOntology.hiddenTasks.length).toBeGreaterThan(0);
  });

  it("matches the composed full pipeline output for the envisioning demo note", async () => {
    const staged = await runStagedPipeline(envisioningDemoCourseNote);
    const full = await prepareBenchmarkOntologyInput({
      courseNote: envisioningDemoCourseNote,
    });

    expect(staged.nodeCandidates.length).toBe(full.nodeCandidates.length);
    expect(staged.candidateRelations.length).toBe(full.candidateRelations.length);
    expect(staged.verifiedRelations.length).toBe(full.verifiedRelations.length);
    expect(staged.benchmarkOntology.summary).toEqual(full.benchmarkOntology.summary);
    expect(staged.learnerFacingOntology.summary).toEqual(
      full.learnerFacingOntology.summary,
    );
  });

  it("supports LLM validation only on nodes and relations stages", async () => {
    const ingest = await runIngestStage({ courseNote: sampleCourseNote });
    const nodes = await runNodesStage(
      {
        sourceChunks: ingest.data.sourceChunks,
        enableLlmValidation: true,
      },
      { llmClient: createMockLlmValidationClient() },
    );

    expect(nodes.data.summary.llmValidationEnabled).toBe(true);
    expect(nodes.data.nodeCandidates[0]?.llmValidation?.score).toBeGreaterThan(0);
  });
});

async function runStagedPipeline(courseNote: {
  title: string;
  text: string;
}) {
  const ingest = await runIngestStage({ courseNote });
  const nodes = await runNodesStage({ sourceChunks: ingest.data.sourceChunks });
  const relations = await runRelationsStage({
    sourceChunks: ingest.data.sourceChunks,
    nodeCandidates: nodes.data.nodeCandidates,
    relationTypes: ingest.data.relationTypes,
  });
  const verify = await runVerifyStage({
    sourceChunks: ingest.data.sourceChunks,
    nodeCandidates: nodes.data.nodeCandidates,
    candidateRelations: relations.data.candidateRelations,
  });
  const benchmark = await runBenchmarkStage({
    nodeCandidates: nodes.data.nodeCandidates,
    verifiedRelations: verify.data.verifiedRelations,
  });
  const envisioning = await runEnvisioningStage({
    benchmarkOntology: benchmark.data.benchmarkOntology,
  });

  return {
    nodeCandidates: nodes.data.nodeCandidates,
    candidateRelations: relations.data.candidateRelations,
    verifiedRelations: verify.data.verifiedRelations,
    benchmarkOntology: benchmark.data.benchmarkOntology,
    learnerFacingOntology: envisioning.data.learnerFacingOntology,
  };
}
