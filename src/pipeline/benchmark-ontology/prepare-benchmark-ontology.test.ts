import { describe, expect, it } from "vitest";

import { getDefaultRelationTypes } from "../../domain/ontology/relation-taxonomy";
import { prepareBenchmarkOntologyInput } from "./prepare-benchmark-ontology";

describe("prepareBenchmarkOntologyInput", () => {
  it("validates input, chunks source text, and loads default relation taxonomy", () => {
    const result = prepareBenchmarkOntologyInput({
      courseNote: {
        title: "KRR note",
        text: "1 Representation:\nKRR uses constraints. Constraints organize concepts.",
      },
    });

    expect(result.sourceChunks).toHaveLength(2);
    expect(result.sourceChunks[0]).toMatchObject({
      id: "chunk-0001",
      sectionId: "section-001",
      sectionTitle: "1 Representation:",
      sourceTitle: "KRR note",
      text: "KRR uses constraints.",
    });
    expect(result.relationTypes).toHaveLength(getDefaultRelationTypes().length);
    expect(result.summary).toEqual({
      sourceTitle: "KRR note",
      chunkCount: 2,
      relationTypeCount: getDefaultRelationTypes().length,
    });
  });

  it("accepts caller-provided relation taxonomy instead of the default seed", () => {
    const result = prepareBenchmarkOntologyInput({
      courseNote: {
        text: "A method solves a problem.",
      },
      relationTypes: [
        {
          id: "solves",
          name: "solves",
          category: "problem",
          description: "An approach resolves a problem.",
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
