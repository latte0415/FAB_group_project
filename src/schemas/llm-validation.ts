import { z } from "zod";

import {
  normalizeCandidateId,
  normalizeConceptType,
  normalizeLlmBoolean,
  normalizeLlmRationale,
  normalizeLlmScore,
  normalizeRelationTypeId,
  normalizeValidationBatchPayload,
} from "@/lib/llm/normalize-validation-response";

const optionalConceptTypeSchema = z
  .unknown()
  .transform((value) => normalizeConceptType(value));

const optionalRelationTypeIdSchema = z
  .unknown()
  .transform((value) => normalizeRelationTypeId(value));

const llmScoreSchema = z.unknown().transform((value) => normalizeLlmScore(value));

const llmBooleanSchema = z.unknown().transform((value) => normalizeLlmBoolean(value));

const llmRationaleSchema = z
  .unknown()
  .transform((value) => normalizeLlmRationale(value));

const candidateIdSchema = z
  .unknown()
  .transform((value) => normalizeCandidateId(value))
  .pipe(z.string().min(1));

export const llmConceptValidationResultSchema = z.object({
  candidateId: candidateIdSchema,
  isConcept: llmBooleanSchema,
  score: llmScoreSchema,
  rationale: llmRationaleSchema,
  suggestedType: optionalConceptTypeSchema,
});

export const llmConceptValidationBatchResponseSchema = z.preprocess(
  normalizeValidationBatchPayload,
  z.object({
    results: z.array(llmConceptValidationResultSchema),
  }),
);

export const llmRelationValidationResultSchema = z.object({
  candidateId: candidateIdSchema,
  isValid: llmBooleanSchema,
  score: llmScoreSchema,
  rationale: llmRationaleSchema,
  confirmedRelationTypeId: optionalRelationTypeIdSchema,
});

export const llmRelationValidationBatchResponseSchema = z.preprocess(
  normalizeValidationBatchPayload,
  z.object({
    results: z.array(llmRelationValidationResultSchema),
  }),
);

export const llmConceptValidationRecordSchema = z.object({
  isConcept: llmBooleanSchema,
  score: llmScoreSchema,
  rationale: llmRationaleSchema,
  suggestedType: optionalConceptTypeSchema,
});

export const llmRelationValidationRecordSchema = z.object({
  isValid: llmBooleanSchema,
  score: llmScoreSchema,
  rationale: llmRationaleSchema,
  confirmedRelationTypeId: optionalRelationTypeIdSchema,
});

export type LlmConceptValidationResult = z.infer<typeof llmConceptValidationResultSchema>;
export type LlmRelationValidationResult = z.infer<typeof llmRelationValidationResultSchema>;
export type LlmConceptValidationRecord = z.infer<typeof llmConceptValidationRecordSchema>;
export type LlmRelationValidationRecord = z.infer<typeof llmRelationValidationRecordSchema>;
