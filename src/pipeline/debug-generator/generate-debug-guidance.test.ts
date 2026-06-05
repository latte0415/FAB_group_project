import { beforeAll, describe, expect, it } from "vitest";

import { evaluateLearnerAttempt } from "@/pipeline/attempt-evaluator/evaluate-learner-attempt";
import { prepareBenchmarkOntologyInput } from "@/pipeline/benchmark-ontology/prepare-benchmark-ontology";
import { generateDebugGuidance } from "@/pipeline/debug-generator/generate-debug-guidance";
import type { BenchmarkOntologyPrepareResponse } from "@/schemas/benchmark-ontology";
import type { LearnerAttemptResult } from "@/schemas/learner-attempt";
import { envisioningDemoCourseNote } from "@/test/fixtures/envisioning-demo-course-note";

describe("generateDebugGuidance", () => {
  let prepared: BenchmarkOntologyPrepareResponse;
  let incorrectAttempt: LearnerAttemptResult;

  beforeAll(async () => {
    prepared = await prepareBenchmarkOntologyInput({
      courseNote: envisioningDemoCourseNote,
    });

    const hiddenTask = prepared.learnerFacingOntology.hiddenTasks[0];
    const benchmarkRelation = prepared.benchmarkOntology.relations.find(
      (relation) => relation.id === hiddenTask.benchmarkRelationId,
    )!;
    const evidenceChunk = prepared.sourceChunks.find(
      (chunk) => chunk.id === hiddenTask.evidenceChunkId,
    );

    incorrectAttempt = evaluateLearnerAttempt({
      hiddenTask,
      benchmarkRelation,
      evidenceChunk,
      proposal: {
        hiddenTaskId: hiddenTask.id,
        sourceNodeId: benchmarkRelation.sourceNodeId,
        targetNodeId: benchmarkRelation.targetNodeId,
        relationTypeId: "uses",
      },
    }).attempt;
  });

  it("returns qualitative prompts and evidence without revealing the answer", () => {
    const hiddenTask = prepared.learnerFacingOntology.hiddenTasks[0];
    const benchmarkRelation = prepared.benchmarkOntology.relations.find(
      (relation) => relation.id === hiddenTask.benchmarkRelationId,
    )!;
    const evidenceChunk = prepared.sourceChunks.find(
      (chunk) => chunk.id === hiddenTask.evidenceChunkId,
    );
    const result = generateDebugGuidance({
      hiddenTask,
      benchmarkRelation,
      attempt: incorrectAttempt,
      evidenceChunk,
    });

    expect(result.guidance.revealAnswer).toBe(false);
    expect(result.guidance.prompts.length).toBeGreaterThan(0);
    expect(result.guidance.evidence.text).toBe(evidenceChunk?.text);
  });
});
