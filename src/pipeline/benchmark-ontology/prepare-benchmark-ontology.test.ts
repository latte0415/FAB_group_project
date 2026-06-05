import { describe, expect, it } from "vitest";

import { getDefaultRelationTypes } from "../../domain/ontology/relation-taxonomy";
import { prepareBenchmarkOntologyInput } from "./prepare-benchmark-ontology";

describe("prepareBenchmarkOntologyInput", () => {
  it("validates input, chunks source text, and loads default relation taxonomy", async () => {
    const result = await prepareBenchmarkOntologyInput({
      courseNote: {
        title: "KRR note",
        text: "1 Representation:\nKRR uses constraints. Constraints organize concepts. Constraint networks support reasoning.",
      },
    });

    expect(result.sourceChunks).toHaveLength(3);
    expect(result.sourceChunks[0]).toMatchObject({
      id: "chunk-0001",
      sectionId: "section-001",
      sectionTitle: "1 Representation:",
      sourceTitle: "KRR note",
      text: "KRR uses constraints.",
    });
    expect(result.relationTypes).toHaveLength(getDefaultRelationTypes().length);
    expect(result.relationTypes[0]).toMatchObject({
      argumentPattern: expect.any(String),
      examples: expect.any(Array),
    });
    expect(result.nodeCandidates.length).toBeGreaterThan(0);
    expect(result.nodeCandidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Constraint networks",
          heuristics: expect.arrayContaining(["relation_argument_phrase"]),
        }),
        expect.objectContaining({
          name: "reasoning",
          heuristics: expect.arrayContaining(["relation_argument_phrase"]),
        }),
      ]),
    );
    expect(result.candidateRelations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          relationTypeId: "supports",
          evidenceSource: expect.objectContaining({
            text: "Constraint networks support reasoning.",
          }),
          status: "supported",
        }),
      ]),
    );
    expect(result.verifiedRelations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          relationTypeId: "supports",
          status: "verified",
          evidenceChunkId: "chunk-0003",
          evidenceText: "Constraint networks support reasoning.",
        }),
      ]),
    );
    expect(
      result.verifiedRelations.every(
        (relation) => relation.evidenceChunkId && relation.evidenceText,
      ),
    ).toBe(true);
    expect(result.benchmarkOntology.summary).toEqual({
      nodeCount: 2,
      verifiedRelationCount: 1,
      evidenceChunkCount: 1,
    });
    expect(result.learnerFacingOntology.hiddenTasks).toEqual([
      expect.objectContaining({
        benchmarkRelationId: result.benchmarkOntology.relations[0].id,
        relationTypeId: "supports",
        sourceNodeId: result.benchmarkOntology.relations[0].sourceNodeId,
        targetNodeId: result.benchmarkOntology.relations[0].targetNodeId,
        status: "active",
      }),
    ]);
    expect(result.learnerFacingOntology.visibleRelations).toHaveLength(0);
    expect(
      result.learnerFacingOntology.hiddenTasks.every((task) =>
        result.benchmarkOntology.relations.some(
          (relation) => relation.id === task.benchmarkRelationId,
        ),
      ),
    ).toBe(true);
    expect(result.stages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "node_candidate_generation",
          status: "completed",
        }),
        expect.objectContaining({
          name: "evidence_grounded_relation_extraction",
          status: "completed",
        }),
        expect.objectContaining({
          name: "evidence_verification",
          status: "completed",
        }),
        expect.objectContaining({
          name: "benchmark_ontology_generation",
          status: "completed",
        }),
        expect.objectContaining({
          name: "envisioning_task_generation",
          status: "completed",
        }),
      ]),
    );
    expect(result.summary).toEqual({
      sourceTitle: "KRR note",
      chunkCount: 3,
      relationTypeCount: getDefaultRelationTypes().length,
      nodeCandidateCount: result.nodeCandidates.length,
      relationCandidateCount: result.candidateRelations.length,
      verifiedRelationCount: result.verifiedRelations.length,
      hiddenRelationCount: result.learnerFacingOntology.hiddenTasks.length,
      llmValidationEnabled: false,
    });
  });

  it("accepts caller-provided relation taxonomy instead of the default seed", async () => {
    const result = await prepareBenchmarkOntologyInput({
      courseNote: {
        text: "A method solves a problem.",
      },
      relationTypes: [
        {
          id: "solves",
          name: "solves",
          category: "problem",
          description: "An approach resolves a problem.",
          argumentPattern: "approach -> problem",
          examples: ["method solves problem"],
          allowedSourceTypes: ["approach"],
          allowedTargetTypes: ["problem"],
          bidirectional: false,
        },
      ],
    });

    expect(result.relationTypes).toHaveLength(1);
    expect(result.relationTypes[0].id).toBe("solves");
  });
});
