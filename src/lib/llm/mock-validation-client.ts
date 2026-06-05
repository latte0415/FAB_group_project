import type {
  ConceptValidationInput,
  LlmValidationClient,
  RelationValidationInput,
} from "@/lib/llm/types";
import type {
  LlmConceptValidationResult,
  LlmRelationValidationResult,
} from "@/schemas/llm-validation";
import type { ConceptType } from "@/schemas/benchmark-ontology";

const junkNamePrefix =
  /^(as|by|in|on|for|the|this|that|we|you|they|however|hence|note|first|second|third|fourth|fifth|rather|such|while|when|where|what|defining|learning|approach|his|her|its|our|their|finally|likewise|to explore)\b/iu;

export function createMockLlmValidationClient(): LlmValidationClient {
  return {
    validateConcepts: async (input) => input.map(scoreConceptCandidate),
    validateRelations: async (input) => input.map(scoreRelationCandidate),
  };
}

function scoreConceptCandidate(
  input: ConceptValidationInput,
): LlmConceptValidationResult {
  const name = input.candidate.name.trim();
  const lowerName = name.toLowerCase();
  const evidenceJoined = input.evidenceSnippets.join(" ").toLowerCase();
  let score = 0.45;

  if (junkNamePrefix.test(name)) {
    score = 0.15;
  } else if (input.candidate.heuristics.includes("section_heading")) {
    score = 0.78;
  } else if (name.split(/\s+/u).length >= 2 && evidenceJoined.includes(lowerName)) {
    score = 0.86;
  } else if (evidenceJoined.includes(lowerName)) {
    score = 0.72;
  } else if (name.length <= 3) {
    score = 0.2;
  }

  const isConcept = score >= 0.6;

  return {
    candidateId: input.candidate.id,
    isConcept,
    score,
    rationale: isConcept
      ? `Mock validator accepted "${name}" as a concept candidate grounded in source evidence.`
      : `Mock validator rejected "${name}" as a sentence fragment or unstable phrase.`,
    suggestedType: isConcept ? inferSuggestedType(name, input.candidate.type) : undefined,
  };
}

function scoreRelationCandidate(
  input: RelationValidationInput,
): LlmRelationValidationResult {
  const evidence = input.evidenceText.toLowerCase();
  const source = input.sourceNodeName.toLowerCase();
  const target = input.targetNodeName.toLowerCase();
  const relationTypeId = input.candidate.relationTypeId;
  const sourceIndex = evidence.indexOf(source);
  const targetIndex = evidence.indexOf(target);
  const hasOrderedEvidence =
    sourceIndex >= 0 && targetIndex > sourceIndex;

  let score = input.candidate.status === "supported" ? 0.74 : 0.42;

  if (hasOrderedEvidence) {
    score = Math.max(score, 0.84);
  }

  if (!hasOrderedEvidence) {
    score = Math.min(score, 0.4);
  }

  const allowedTypeIds = new Set(input.relationTypes.map((relationType) => relationType.id));
  const isValid = score >= 0.65 && allowedTypeIds.has(relationTypeId);

  return {
    candidateId: input.candidate.id,
    isValid,
    score,
    rationale: isValid
      ? `Mock validator accepted "${input.sourceNodeName} -> ${relationTypeId} -> ${input.targetNodeName}" against evidence.`
      : `Mock validator could not confirm the relation from the provided evidence.`,
    confirmedRelationTypeId: isValid ? relationTypeId : undefined,
  };
}

function inferSuggestedType(name: string, fallback: ConceptType): ConceptType {
  const lowerName = name.toLowerCase();

  if (/(problem|complexity|challenge)/u.test(lowerName)) {
    return "problem";
  }

  if (/(processing|learning|reasoning|approach)/u.test(lowerName)) {
    return "approach";
  }

  if (/(system|network|channel|structure)/u.test(lowerName)) {
    return "structure";
  }

  if (/(capacity|entropy|syntactic|semantic|property)/u.test(lowerName)) {
    return "property";
  }

  return fallback;
}
