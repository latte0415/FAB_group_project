import { z } from "zod";

import {
  benchmarkOntologyGraphSchema,
  benchmarkOntologyPrepareRequestSchema,
  learnerFacingOntologySchema,
  nodeCandidateSchema,
  ontologyRelationSchema,
  pipelineStageSchema,
  relationCandidateSchema,
  relationTypeSchema,
  sourceChunkSchema,
} from "@/schemas/benchmark-ontology";

export const pipelineStageNameSchema = z.enum([
  "ingest",
  "nodes",
  "relations",
  "verify",
  "benchmark",
  "envisioning",
  "attempts",
  "debugging",
  "quiz",
  "diagnosis",
]);

export const pipelineStageEnvelopeSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    stage: pipelineStageSchema,
    nextStage: pipelineStageNameSchema.nullable(),
    data: dataSchema,
  });

export const ingestStageRequestSchema = benchmarkOntologyPrepareRequestSchema.pick({
  courseNote: true,
  relationTypes: true,
});

export const ingestStageDataSchema = z.object({
  sourceChunks: z.array(sourceChunkSchema),
  relationTypes: z.array(relationTypeSchema),
  summary: z.object({
    sourceTitle: z.string().optional(),
    chunkCount: z.number().int().nonnegative(),
    relationTypeCount: z.number().int().nonnegative(),
  }),
});

export const nodesStageRequestSchema = z.object({
  sourceChunks: z.array(sourceChunkSchema).min(1),
  enableLlmValidation: z.boolean().optional(),
});

export const nodesStageDataSchema = z.object({
  nodeCandidates: z.array(nodeCandidateSchema),
  summary: z.object({
    nodeCandidateCount: z.number().int().nonnegative(),
    heuristicCandidateCount: z.number().int().nonnegative(),
    llmValidationEnabled: z.boolean(),
  }),
});

export const relationsStageRequestSchema = z.object({
  sourceChunks: z.array(sourceChunkSchema).min(1),
  nodeCandidates: z.array(nodeCandidateSchema),
  relationTypes: z.array(relationTypeSchema).min(1),
  enableLlmValidation: z.boolean().optional(),
});

export const relationsStageDataSchema = z.object({
  candidateRelations: z.array(relationCandidateSchema),
  summary: z.object({
    relationCandidateCount: z.number().int().nonnegative(),
    heuristicCandidateCount: z.number().int().nonnegative(),
    llmValidationEnabled: z.boolean(),
  }),
});

export const verifyStageRequestSchema = z.object({
  sourceChunks: z.array(sourceChunkSchema).min(1),
  nodeCandidates: z.array(nodeCandidateSchema),
  candidateRelations: z.array(relationCandidateSchema),
});

export const verifyStageDataSchema = z.object({
  verifiedRelations: z.array(ontologyRelationSchema),
  summary: z.object({
    verifiedRelationCount: z.number().int().nonnegative(),
  }),
});

export const benchmarkStageRequestSchema = z.object({
  nodeCandidates: z.array(nodeCandidateSchema),
  verifiedRelations: z.array(ontologyRelationSchema),
});

export const benchmarkStageDataSchema = z.object({
  benchmarkOntology: benchmarkOntologyGraphSchema,
});

export const envisioningStageRequestSchema = z.object({
  benchmarkOntology: benchmarkOntologyGraphSchema,
  maxHiddenRelations: z.number().int().positive().optional(),
  relationTypePriority: z.array(z.string()).optional(),
});

export const envisioningStageDataSchema = z.object({
  learnerFacingOntology: learnerFacingOntologySchema,
  summary: z.object({
    hiddenRelationCount: z.number().int().nonnegative(),
    visibleRelationCount: z.number().int().nonnegative(),
  }),
});

export const ingestStageResponseSchema = pipelineStageEnvelopeSchema(ingestStageDataSchema);
export const nodesStageResponseSchema = pipelineStageEnvelopeSchema(nodesStageDataSchema);
export const relationsStageResponseSchema = pipelineStageEnvelopeSchema(
  relationsStageDataSchema,
);
export const verifyStageResponseSchema = pipelineStageEnvelopeSchema(verifyStageDataSchema);
export const benchmarkStageResponseSchema = pipelineStageEnvelopeSchema(
  benchmarkStageDataSchema,
);
export const envisioningStageResponseSchema = pipelineStageEnvelopeSchema(
  envisioningStageDataSchema,
);

export type PipelineStageName = z.infer<typeof pipelineStageNameSchema>;
export type IngestStageRequest = z.infer<typeof ingestStageRequestSchema>;
export type NodesStageRequest = z.infer<typeof nodesStageRequestSchema>;
export type RelationsStageRequest = z.infer<typeof relationsStageRequestSchema>;
export type VerifyStageRequest = z.infer<typeof verifyStageRequestSchema>;
export type BenchmarkStageRequest = z.infer<typeof benchmarkStageRequestSchema>;
export type EnvisioningStageRequest = z.infer<typeof envisioningStageRequestSchema>;
