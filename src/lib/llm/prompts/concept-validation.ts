import type { ConceptValidationInput } from "@/lib/llm/types";

export const conceptValidationPromptVersion = "concept-relation-validation-v1";

export function buildConceptValidationPrompt(input: {
  candidates: ConceptValidationInput[];
}): { system: string; user: string } {
  const payload = input.candidates.map((item) => ({
    candidateId: item.candidate.id,
    name: item.candidate.name,
    heuristicType: item.candidate.type,
    heuristics: item.candidate.heuristics,
    evidenceSnippets: item.evidenceSnippets,
  }));

  return {
    system: `You validate whether heuristic concept candidates from course notes are real ontology concepts.

Rules:
- Score whether the phrase is a stable concept worth keeping in an ontology graph.
- Reject sentence fragments, pronouns, verbs, discourse markers, and incomplete phrases.
- Prefer domain concepts, named constructs, and repeated technical terms.
- Use only the provided evidence snippets; do not invent outside knowledge.
- Return JSON only.`,
    user: `Validate these concept candidates.

Return JSON with this exact shape:
{
  "results": [
    {
      "candidateId": "node-candidate-0001",
      "isConcept": true,
      "score": 0.84,
      "rationale": "short reason grounded in evidence",
      "suggestedType": "structure"
    }
  ]
}

Allowed suggestedType values: problem, approach, structure, element, property.
Omit suggestedType when isConcept is false. Never return null or an empty string for suggestedType.

Candidates:
${JSON.stringify(payload, null, 2)}`,
  };
}
