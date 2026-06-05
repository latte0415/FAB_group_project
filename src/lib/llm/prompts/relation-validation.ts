import type { RelationValidationInput } from "@/lib/llm/types";

export const relationValidationPromptVersion = "concept-relation-validation-v1";

export function buildRelationValidationPrompt(input: {
  relations: RelationValidationInput[];
}): { system: string; user: string } {
  const payload = input.relations.map((item) => ({
    candidateId: item.candidate.id,
    sourceNodeName: item.sourceNodeName,
    targetNodeName: item.targetNodeName,
    proposedRelationTypeId: item.candidate.relationTypeId,
    evidenceText: item.evidenceText,
    allowedRelationTypes: item.relationTypes.map((relationType) => ({
      id: relationType.id,
      description: relationType.description,
      argumentPattern: relationType.argumentPattern,
    })),
  }));

  return {
    system: `You validate whether a proposed ontology relation is directly supported by source evidence.

Rules:
- Use only the predefined relation types provided for each candidate.
- Do not create new relation types.
- Mark isValid=false when evidence is insufficient or direction/type is wrong.
- confirmedRelationTypeId must be one of the allowed relation type ids when isValid=true.
- Omit confirmedRelationTypeId when isValid is false. Never return null or an empty string.
- Return JSON only.`,
    user: `Validate these relation candidates.

Return JSON with this exact shape:
{
  "results": [
    {
      "candidateId": "relation-candidate-0001",
      "isValid": true,
      "score": 0.81,
      "rationale": "short evidence-grounded reason",
      "confirmedRelationTypeId": "supports"
    }
  ]
}

Candidates:
${JSON.stringify(payload, null, 2)}`,
  };
}
