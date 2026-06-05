import type {
  LlmConceptValidationResult,
  LlmRelationValidationResult,
} from "@/schemas/llm-validation";
import type { NodeCandidate, RelationCandidate, RelationType } from "@/schemas/benchmark-ontology";

export type ConceptValidationInput = {
  candidate: NodeCandidate;
  evidenceSnippets: string[];
};

export type RelationValidationInput = {
  candidate: RelationCandidate;
  sourceNodeName: string;
  targetNodeName: string;
  evidenceText: string;
  relationTypes: RelationType[];
};

export type LlmValidationClient = {
  validateConcepts(input: ConceptValidationInput[]): Promise<LlmConceptValidationResult[]>;
  validateRelations(input: RelationValidationInput[]): Promise<LlmRelationValidationResult[]>;
};
