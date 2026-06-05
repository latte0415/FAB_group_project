import { z } from "zod";

import {
  hiddenRelationTaskSchema,
  ontologyRelationSchema,
  sourceChunkSchema,
} from "@/schemas/benchmark-ontology";

export const learnerAttemptProposalSchema = z.object({
  hiddenTaskId: z.string(),
  sourceNodeId: z.string(),
  targetNodeId: z.string(),
  relationTypeId: z.string(),
  explanation: z.string().optional(),
});

export const learnerAttemptMismatchSchema = z.object({
  field: z.enum(["sourceNodeId", "targetNodeId", "relationTypeId"]),
  expected: z.string(),
  proposed: z.string(),
});

export const learnerAttemptResultSchema = z.object({
  hiddenTaskId: z.string(),
  result: z.enum(["correct", "incorrect"]),
  message: z.string(),
  mismatches: z.array(learnerAttemptMismatchSchema),
  debugEvidence: z
    .object({
      chunkId: z.string(),
      text: z.string(),
      sectionTitle: z.string().optional(),
    })
    .optional(),
  restoredRelation: ontologyRelationSchema.optional(),
});

export const evaluateLearnerAttemptRequestSchema = z.object({
  hiddenTask: hiddenRelationTaskSchema,
  benchmarkRelation: ontologyRelationSchema,
  evidenceChunk: sourceChunkSchema.optional(),
  proposal: learnerAttemptProposalSchema,
});

export const evaluateLearnerAttemptResponseSchema = z.object({
  attempt: learnerAttemptResultSchema,
});

export type LearnerAttemptProposal = z.infer<typeof learnerAttemptProposalSchema>;
export type LearnerAttemptMismatch = z.infer<typeof learnerAttemptMismatchSchema>;
export type LearnerAttemptResult = z.infer<typeof learnerAttemptResultSchema>;
export type EvaluateLearnerAttemptRequest = z.infer<
  typeof evaluateLearnerAttemptRequestSchema
>;
export type EvaluateLearnerAttemptResponse = z.infer<
  typeof evaluateLearnerAttemptResponseSchema
>;
