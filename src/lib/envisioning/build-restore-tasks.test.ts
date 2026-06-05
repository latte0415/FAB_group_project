import { describe, expect, it } from "vitest";

import {
  buildEnvisioningRestoreTasks,
  isEdgeQuizRestoreTask,
} from "@/lib/envisioning/build-restore-tasks";
import type { BenchmarkOntologyGraph } from "@/schemas/benchmark-ontology";

describe("buildEnvisioningRestoreTasks", () => {
  it("builds three edge quiz restore tasks from all verified relations", () => {
    const benchmarkOntology = {
      id: "benchmark-test",
      nodes: [
        {
          id: "node-a",
          name: "A",
          type: "element" as const,
          abstractionDepth: 1 as const,
          sourceChunkIds: ["chunk-01"],
        },
        {
          id: "node-b",
          name: "B",
          type: "element" as const,
          abstractionDepth: 1 as const,
          sourceChunkIds: ["chunk-02"],
        },
        {
          id: "node-c",
          name: "C",
          type: "element" as const,
          abstractionDepth: 1 as const,
          sourceChunkIds: ["chunk-03"],
        },
        {
          id: "node-d",
          name: "D",
          type: "element" as const,
          abstractionDepth: 1 as const,
          sourceChunkIds: ["chunk-04"],
        },
      ],
      relations: [
        {
          id: "relation-01",
          sourceNodeId: "node-a",
          targetNodeId: "node-b",
          relationTypeId: "supports",
          evidenceChunkId: "chunk-01",
          evidenceText: "evidence 1",
          status: "verified" as const,
        },
        {
          id: "relation-02",
          sourceNodeId: "node-b",
          targetNodeId: "node-c",
          relationTypeId: "uses",
          evidenceChunkId: "chunk-02",
          evidenceText: "evidence 2",
          status: "verified" as const,
        },
        {
          id: "relation-03",
          sourceNodeId: "node-c",
          targetNodeId: "node-d",
          relationTypeId: "depends_on",
          evidenceChunkId: "chunk-03",
          evidenceText: "evidence 3",
          status: "verified" as const,
        },
        {
          id: "relation-04",
          sourceNodeId: "node-a",
          targetNodeId: "node-d",
          relationTypeId: "organizes",
          evidenceChunkId: "chunk-04",
          evidenceText: "evidence 4",
          status: "verified" as const,
        },
      ],
      summary: {
        nodeCount: 4,
        verifiedRelationCount: 4,
        evidenceChunkCount: 4,
      },
    } as BenchmarkOntologyGraph;
    const restoreTasks = buildEnvisioningRestoreTasks({
      benchmarkOntology,
    });

    expect(restoreTasks).toHaveLength(3);
    expect(restoreTasks.every(isEdgeQuizRestoreTask)).toBe(true);
  });
});
