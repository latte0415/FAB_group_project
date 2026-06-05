import { beforeAll, describe, expect, it } from "vitest";

import { evaluateLearnerAttempt } from "@/pipeline/attempt-evaluator/evaluate-learner-attempt";
import { prepareBenchmarkOntologyInput } from "@/pipeline/benchmark-ontology/prepare-benchmark-ontology";
import type { BenchmarkOntologyPrepareResponse } from "@/schemas/benchmark-ontology";
import { envisioningDemoCourseNote } from "@/test/fixtures/envisioning-demo-course-note";

describe("evaluateLearnerAttempt", () => {
  let prepared: BenchmarkOntologyPrepareResponse;

  beforeAll(async () => {
    prepared = await prepareBenchmarkOntologyInput({
      courseNote: envisioningDemoCourseNote,
    });
  });

  it("marks a fully matching proposal as correct and returns the restored relation", () => {
    const hiddenTask = prepared.learnerFacingOntology.hiddenTasks[0];
    const benchmarkRelation = prepared.benchmarkOntology.relations.find(
      (relation) => relation.id === hiddenTask.benchmarkRelationId,
    )!;
    const evidenceChunk = prepared.sourceChunks.find(
      (chunk) => chunk.id === hiddenTask.evidenceChunkId,
    );
    const result = evaluateLearnerAttempt({
      hiddenTask,
      benchmarkRelation,
      evidenceChunk,
      proposal: {
        hiddenTaskId: hiddenTask.id,
        sourceNodeId: benchmarkRelation.sourceNodeId,
        targetNodeId: benchmarkRelation.targetNodeId,
        relationTypeId: benchmarkRelation.relationTypeId,
      },
    });

    expect(result.attempt.result).toBe("correct");
    expect(result.attempt.restoredRelation?.id).toBe(benchmarkRelation.id);
    expect(result.attempt.debugEvidence).toBeUndefined();
  });

  it("returns evidence-backed debugging feedback without revealing the answer on mismatch", () => {
    const hiddenTask = prepared.learnerFacingOntology.hiddenTasks[0];
    const benchmarkRelation = prepared.benchmarkOntology.relations.find(
      (relation) => relation.id === hiddenTask.benchmarkRelationId,
    )!;
    const evidenceChunk = prepared.sourceChunks.find(
      (chunk) => chunk.id === hiddenTask.evidenceChunkId,
    );
    const result = evaluateLearnerAttempt({
      hiddenTask,
      benchmarkRelation,
      evidenceChunk,
      proposal: {
        hiddenTaskId: hiddenTask.id,
        sourceNodeId: benchmarkRelation.sourceNodeId,
        targetNodeId: benchmarkRelation.targetNodeId,
        relationTypeId: "uses",
      },
    });

    expect(result.attempt.result).toBe("incorrect");
    expect(result.attempt.mismatches).toEqual([
      expect.objectContaining({
        field: "relationTypeId",
        proposed: "uses",
      }),
    ]);
    expect(result.attempt.debugEvidence?.text).toBe(evidenceChunk?.text);
    expect(result.attempt.restoredRelation).toBeUndefined();
  });
});
