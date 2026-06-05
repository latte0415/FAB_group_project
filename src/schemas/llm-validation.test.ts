import { describe, expect, it } from "vitest";

import {
  llmConceptValidationBatchResponseSchema,
  llmRelationValidationBatchResponseSchema,
} from "@/schemas/llm-validation";

describe("llmConceptValidationBatchResponseSchema", () => {
  it("accepts null, empty, and invalid suggestedType values", () => {
    const parsed = llmConceptValidationBatchResponseSchema.parse({
      results: [
        {
          candidateId: "node-candidate-0001",
          isConcept: false,
          score: 0.2,
          rationale: "Rejected fragment.",
          suggestedType: null,
        },
        {
          candidateId: "node-candidate-0002",
          isConcept: false,
          score: 0.1,
          rationale: "Rejected fragment.",
          suggestedType: "",
        },
        {
          candidateId: "node-candidate-0003",
          isConcept: true,
          score: "0.84",
          rationale: "Accepted concept.",
          suggestedType: "Structure",
        },
        {
          candidateId: "node-candidate-0004",
          isConcept: true,
          score: 84,
          rationale: "Accepted concept.",
          suggestedType: "concept",
        },
      ],
    });

    expect(parsed.results[0]?.suggestedType).toBeUndefined();
    expect(parsed.results[1]?.suggestedType).toBeUndefined();
    expect(parsed.results[2]?.suggestedType).toBe("structure");
    expect(parsed.results[2]?.score).toBeCloseTo(0.84);
    expect(parsed.results[3]?.suggestedType).toBeUndefined();
    expect(parsed.results[3]?.score).toBeCloseTo(0.84);
  });

  it("accepts alternate batch payload keys", () => {
    const parsed = llmConceptValidationBatchResponseSchema.parse({
      candidates: [
        {
          candidateId: "node-candidate-0001",
          isConcept: true,
          score: 0.7,
          rationale: "Accepted concept.",
        },
      ],
    });

    expect(parsed.results).toHaveLength(1);
  });
});

describe("llmRelationValidationBatchResponseSchema", () => {
  it("accepts empty confirmedRelationTypeId values", () => {
    const parsed = llmRelationValidationBatchResponseSchema.parse({
      results: [
        {
          candidateId: "relation-candidate-0001",
          isValid: false,
          score: 0.2,
          rationale: "Insufficient evidence.",
          confirmedRelationTypeId: "",
        },
      ],
    });

    expect(parsed.results[0]?.confirmedRelationTypeId).toBeUndefined();
  });
});
