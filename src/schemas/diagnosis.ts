import { z } from "zod";

import { benchmarkOntologyGraphSchema } from "@/schemas/benchmark-ontology";
import { learnerAttemptResultSchema } from "@/schemas/learner-attempt";
import { quizAnswerEvaluationSchema } from "@/schemas/quiz";

export const misunderstoodRelationSchema = z.object({
  relationTypeId: z.string(),
  sourceNodeId: z.string().optional(),
  targetNodeId: z.string().optional(),
  evidenceChunkId: z.string().optional(),
  reasons: z.array(z.string()).min(1),
});

export const qualitativeDiagnosisSchema = z.object({
  id: z.string(),
  summary: z.string().min(1),
  misunderstoodRelations: z.array(misunderstoodRelationSchema),
  attemptMistakeCount: z.number().int().nonnegative(),
  quizMistakeCount: z.number().int().nonnegative(),
});

export const generateDiagnosisRequestSchema = z.object({
  benchmarkOntology: benchmarkOntologyGraphSchema,
  attemptResults: z.array(learnerAttemptResultSchema).default([]),
  quizEvaluations: z.array(quizAnswerEvaluationSchema).default([]),
});

export const generateDiagnosisResponseSchema = z.object({
  diagnosis: qualitativeDiagnosisSchema,
});

export type MisunderstoodRelation = z.infer<typeof misunderstoodRelationSchema>;
export type QualitativeDiagnosis = z.infer<typeof qualitativeDiagnosisSchema>;
export type GenerateDiagnosisRequest = z.infer<typeof generateDiagnosisRequestSchema>;
export type GenerateDiagnosisResponse = z.infer<typeof generateDiagnosisResponseSchema>;
