import { z } from "zod";

import {
  llmConceptValidationRecordSchema,
  llmRelationValidationRecordSchema,
} from "@/schemas/llm-validation";

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
  argumentPattern: z.string().min(1),
  examples: z.array(z.string().min(1)).min(1),
  allowedSourceTypes: z.array(conceptTypeSchema).optional(),
  allowedTargetTypes: z.array(conceptTypeSchema).optional(),
  bidirectional: z.boolean().default(false),
});

export const nodeCandidateHeuristicSchema = z.enum([
  "section_heading",
  "term_frequency",
  "relation_argument_phrase",
]);

export const nodeCandidateSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: conceptTypeSchema,
  abstractionDepth: abstractionDepthSchema,
  sourceChunkIds: z.array(z.string()).min(1),
  heuristics: z.array(nodeCandidateHeuristicSchema).min(1),
  rationale: z.string().min(1),
  llmValidation: llmConceptValidationRecordSchema.optional(),
});

export const evidenceSourceSchema = z.object({
  chunkId: z.string(),
  text: z.string().min(1),
});

export const relationCandidateStatusSchema = z.enum([
  "supported",
  "unsupported",
]);

export const relationCandidateSchema = z.object({
  id: z.string(),
  relationTypeId: z.string(),
  sourceCandidateId: z.string(),
  targetCandidateId: z.string(),
  evidenceSource: evidenceSourceSchema,
  confidence: z.number().min(0).max(1),
  extractionRationale: z.string().min(1),
  status: relationCandidateStatusSchema,
  unsupportedReason: z.string().optional(),
  llmValidation: llmRelationValidationRecordSchema.optional(),
});

export const ontologyRelationSchema = z.object({
  id: z.string(),
  relationTypeId: z.string(),
  sourceConceptId: z.string(),
  targetConceptId: z.string(),
  sourceNodeId: z.string(),
  targetNodeId: z.string(),
  contextConceptId: z.string().optional(),
  constraintConceptIds: z.array(z.string()).default([]),
  constraintLogic: z.enum(["and", "or"]).optional(),
  author: z.string().optional(),
  status: z.literal("verified"),
  evidenceChunkId: z.string(),
  evidenceText: z.string().min(1),
  evidenceSource: evidenceSourceSchema,
});

export const benchmarkOntologyGraphSchema = z.object({
  id: z.string(),
  nodes: z.array(conceptSchema),
  relations: z.array(ontologyRelationSchema),
  summary: z.object({
    nodeCount: z.number().int().nonnegative(),
    verifiedRelationCount: z.number().int().nonnegative(),
    evidenceChunkCount: z.number().int().nonnegative(),
  }),
});

export const hiddenRelationSelectionReasonSchema = z.enum([
  "first_verified_relation",
  "relation_type_priority",
  "graph_connectivity",
  "instructor_config",
  "edge_quiz_selection",
]);

export const hiddenRelationTaskSchema = z.object({
  id: z.string(),
  benchmarkRelationId: z.string(),
  sourceNodeId: z.string(),
  targetNodeId: z.string(),
  relationTypeId: z.string(),
  evidenceChunkId: z.string(),
  prompt: z.string().min(1),
  selectionReasons: z.array(hiddenRelationSelectionReasonSchema).min(1),
  status: z.literal("active"),
});

export const learnerFacingOntologySchema = z.object({
  id: z.string(),
  nodes: z.array(conceptSchema),
  visibleRelations: z.array(ontologyRelationSchema),
  hiddenTasks: z.array(hiddenRelationTaskSchema),
  summary: z.object({
    nodeCount: z.number().int().nonnegative(),
    visibleRelationCount: z.number().int().nonnegative(),
    hiddenRelationCount: z.number().int().nonnegative(),
  }),
});

export const pipelineStageSchema = z.object({
  name: z.string().min(1),
  status: z.enum(["completed", "failed", "pending"]),
  startedAt: z.string(),
  finishedAt: z.string().optional(),
  warnings: z.array(z.string()).default([]),
  errors: z.array(z.string()).default([]),
});

export const benchmarkOntologyPrepareRequestSchema = z.object({
  courseNote: z.object({
    title: z.string().optional(),
    text: z.string().min(1),
    source: z.string().optional(),
  }),
  relationTypes: z.array(relationTypeSchema).optional(),
  enableLlmValidation: z.boolean().optional(),
});

export const benchmarkOntologyPrepareResponseSchema = z.object({
  sourceChunks: z.array(sourceChunkSchema),
  relationTypes: z.array(relationTypeSchema),
  nodeCandidates: z.array(nodeCandidateSchema),
  candidateRelations: z.array(relationCandidateSchema),
  verifiedRelations: z.array(ontologyRelationSchema),
  benchmarkOntology: benchmarkOntologyGraphSchema,
  learnerFacingOntology: learnerFacingOntologySchema,
  stages: z.array(pipelineStageSchema),
  summary: z.object({
    sourceTitle: z.string().optional(),
    chunkCount: z.number().int().nonnegative(),
    relationTypeCount: z.number().int().nonnegative(),
    nodeCandidateCount: z.number().int().nonnegative(),
    relationCandidateCount: z.number().int().nonnegative(),
    verifiedRelationCount: z.number().int().nonnegative(),
    hiddenRelationCount: z.number().int().nonnegative(),
    llmValidationEnabled: z.boolean().optional(),
  }),
});

export type ConceptType = z.infer<typeof conceptTypeSchema>;
export type Concept = z.infer<typeof conceptSchema>;
export type SourceChunk = z.infer<typeof sourceChunkSchema>;
export type RelationType = z.infer<typeof relationTypeSchema>;
export type NodeCandidate = z.infer<typeof nodeCandidateSchema>;
export type RelationCandidate = z.infer<typeof relationCandidateSchema>;
export type OntologyRelation = z.infer<typeof ontologyRelationSchema>;
export type BenchmarkOntologyGraph = z.infer<typeof benchmarkOntologyGraphSchema>;
export type HiddenRelationTask = z.infer<typeof hiddenRelationTaskSchema>;
export type LearnerFacingOntology = z.infer<typeof learnerFacingOntologySchema>;
export type PipelineStage = z.infer<typeof pipelineStageSchema>;
export type BenchmarkOntologyPrepareRequest = z.infer<
  typeof benchmarkOntologyPrepareRequestSchema
>;
export type BenchmarkOntologyPrepareResponse = z.infer<
  typeof benchmarkOntologyPrepareResponseSchema
>;
