import { z } from "zod";

export const conceptTypeSchema = z.enum([
  "problem",
  "approach",
  "structure",
  "element",
  "property",
]);

export const abstractionDepthSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);

export const sourceChunkSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  sourceTitle: z.string().optional(),
  sectionId: z.string(),
  sectionTitle: z.string().optional(),
  pageNumber: z.number().int().positive().optional(),
  sentenceIndex: z.number().int().nonnegative(),
});

export const conceptSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  definition: z.string().optional(),
  type: conceptTypeSchema,
  abstractionDepth: abstractionDepthSchema,
  sourceChunkIds: z.array(z.string()).default([]),
});

export const relationCategorySchema = z.enum([
  "problem",
  "approach",
  "structure",
  "element",
  "property",
  "knowledge_reasoning",
  "same_type",
]);

export const relationTypeSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  category: relationCategorySchema,
  description: z.string(),
  allowedSourceTypes: z.array(conceptTypeSchema).optional(),
  allowedTargetTypes: z.array(conceptTypeSchema).optional(),
  bidirectional: z.boolean().default(false),
});

export const evidenceSourceSchema = z.object({
  chunkId: z.string(),
  text: z.string().min(1),
});

export const ontologyRelationSchema = z.object({
  id: z.string(),
  relationTypeId: z.string(),
  sourceConceptId: z.string(),
  targetConceptId: z.string(),
  contextConceptId: z.string().optional(),
  constraintConceptIds: z.array(z.string()).default([]),
  constraintLogic: z.enum(["and", "or"]).optional(),
  author: z.string().optional(),
  evidenceSource: evidenceSourceSchema,
});

export const benchmarkOntologyPrepareRequestSchema = z.object({
  courseNote: z.object({
    title: z.string().optional(),
    text: z.string().min(1),
    source: z.string().optional(),
  }),
  relationTypes: z.array(relationTypeSchema).optional(),
});

export const benchmarkOntologyPrepareResponseSchema = z.object({
  sourceChunks: z.array(sourceChunkSchema),
  relationTypes: z.array(relationTypeSchema),
  summary: z.object({
    sourceTitle: z.string().optional(),
    chunkCount: z.number().int().nonnegative(),
    relationTypeCount: z.number().int().nonnegative(),
  }),
});

export type ConceptType = z.infer<typeof conceptTypeSchema>;
export type SourceChunk = z.infer<typeof sourceChunkSchema>;
export type RelationType = z.infer<typeof relationTypeSchema>;
export type BenchmarkOntologyPrepareRequest = z.infer<
  typeof benchmarkOntologyPrepareRequestSchema
>;
export type BenchmarkOntologyPrepareResponse = z.infer<
  typeof benchmarkOntologyPrepareResponseSchema
>;
