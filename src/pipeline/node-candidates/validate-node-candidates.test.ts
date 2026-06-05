import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { buildCourseNoteExcerptFromParagraphs } from "@/lib/config/course-note-excerpt-config";
import { createMockLlmValidationClient } from "@/lib/llm/mock-validation-client";
import { prepareBenchmarkOntologyInput } from "@/pipeline/benchmark-ontology/prepare-benchmark-ontology";
import { generateNodeCandidates } from "@/pipeline/node-candidates/generate-node-candidates";
import { validateNodeCandidatesWithLlm } from "@/pipeline/node-candidates/validate-node-candidates";
import { chunkCourseNote } from "@/pipeline/source-parser/chunk-course-note";

describe("validateNodeCandidatesWithLlm", () => {
  it("filters junk heuristic concepts while keeping evidence-backed concepts", async () => {
    const excerptText = buildCourseNoteExcerptFromParagraphs(
      readFileSync("docs/course-note-full.txt", "utf-8"),
    );
    const sourceChunks = chunkCourseNote({
      text: excerptText,
      title: "Course note excerpt",
    });
    const heuristicCandidates = generateNodeCandidates(sourceChunks);
    const { nodeCandidates: validated } = await validateNodeCandidatesWithLlm({
      nodeCandidates: heuristicCandidates,
      sourceChunks,
      llmClient: createMockLlmValidationClient(),
      scoreThreshold: 0.6,
    });

    expect(heuristicCandidates.length).toBeGreaterThan(validated.length);
    expect(validated.length).toBeGreaterThan(0);
    expect(
      validated.every((candidate) => candidate.llmValidation?.isConcept),
    ).toBe(true);
    expect(
      validated.some((candidate) => candidate.name.toLowerCase().includes("information")),
    ).toBe(true);
    expect(
      validated.some((candidate) => candidate.name.startsWith("To explore")),
    ).toBe(false);
  });

  it("runs concept and relation LLM validation stages in the prepare pipeline", async () => {
    const result = await prepareBenchmarkOntologyInput(
      {
        courseNote: {
          title: "KRR note",
          text: "1 Representation:\nKRR uses constraints. Constraints organize concepts. Constraint networks support reasoning.",
        },
        enableLlmValidation: true,
      },
      { llmClient: createMockLlmValidationClient() },
    );

    expect(result.summary.llmValidationEnabled).toBe(true);
    expect(result.stages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "concept_llm_validation", status: "completed" }),
        expect.objectContaining({ name: "relation_llm_validation", status: "completed" }),
      ]),
    );
    expect(result.nodeCandidates[0]?.llmValidation?.score).toBeGreaterThan(0.6);
    expect(result.candidateRelations.length).toBeGreaterThan(0);
  });
});
