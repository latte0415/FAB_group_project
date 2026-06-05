import { z } from "zod";

import {
  hiddenRelationTaskSchema,
  ontologyRelationSchema,
  sourceChunkSchema,
} from "@/schemas/benchmark-ontology";
import { learnerAttemptResultSchema } from "@/schemas/learner-attempt";

export const debugPromptSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  focus: z.enum(["evidence", "source_node", "target_node", "relation_type"]),
});

export const debugGuidanceSchema = z.object({
  hiddenTaskId: z.string(),
  attemptResult: learnerAttemptResultSchema,
  message: z.string().min(1),
  prompts: z.array(debugPromptSchema).min(1),
  evidence: z.object({
    chunkId: z.string(),
    text: z.string().min(1),
    sectionTitle: z.string().optional(),
  }),
  revealAnswer: z.literal(false),
});

export const generateDebugGuidanceRequestSchema = z.object({
  hiddenTask: hiddenRelationTaskSchema,
  benchmarkRelation: ontologyRelationSchema,
  attempt: learnerAttemptResultSchema,
  evidenceChunk: sourceChunkSchema.optional(),
});

export const generateDebugGuidanceResponseSchema = z.object({
  guidance: debugGuidanceSchema,
});

export type DebugGuidance = z.infer<typeof debugGuidanceSchema>;
export type GenerateDebugGuidanceRequest = z.infer<
  typeof generateDebugGuidanceRequestSchema
>;
export type GenerateDebugGuidanceResponse = z.infer<
  typeof generateDebugGuidanceResponseSchema
>;
