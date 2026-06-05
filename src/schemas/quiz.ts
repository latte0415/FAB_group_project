import { z } from "zod";

import {
  benchmarkOntologyGraphSchema,
  relationTypeSchema,
} from "@/schemas/benchmark-ontology";

export const quizQuestionSchema = z.object({
  id: z.string(),
  sourceRelationId: z.string(),
  benchmarkRelationId: z.string(),
  sourceNodeId: z.string(),
  targetNodeId: z.string(),
  evidenceChunkId: z.string(),
  correctRelationTypeId: z.string(),
  prompt: z.string().min(1),
});

export const generateQuizRequestSchema = z.object({
  benchmarkOntology: benchmarkOntologyGraphSchema,
  relationTypes: z.array(relationTypeSchema),
  maxQuestions: z.number().int().positive().optional(),
});

export const generateQuizResponseSchema = z.object({
  questions: z.array(quizQuestionSchema),
  summary: z.object({
    questionCount: z.number().int().nonnegative(),
    sourceRelationCount: z.number().int().nonnegative(),
  }),
});

export const evaluateQuizAnswerRequestSchema = z.object({
  question: quizQuestionSchema,
  relationTypeId: z.string(),
});

export const quizAnswerEvaluationSchema = z.object({
  questionId: z.string(),
  result: z.enum(["correct", "incorrect"]),
  proposedRelationTypeId: z.string(),
  correctRelationTypeId: z.string(),
  message: z.string(),
  misunderstoodRelationTypeId: z.string().optional(),
  debugEvidence: z
    .object({
      chunkId: z.string(),
      text: z.string(),
      sectionTitle: z.string().optional(),
    })
    .optional(),
});

export const evaluateQuizAnswerResponseSchema = z.object({
  evaluation: quizAnswerEvaluationSchema,
});

export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type GenerateQuizRequest = z.infer<typeof generateQuizRequestSchema>;
export type GenerateQuizResponse = z.infer<typeof generateQuizResponseSchema>;
export type EvaluateQuizAnswerRequest = z.infer<typeof evaluateQuizAnswerRequestSchema>;
export type QuizAnswerEvaluation = z.infer<typeof quizAnswerEvaluationSchema>;
export type EvaluateQuizAnswerResponse = z.infer<typeof evaluateQuizAnswerResponseSchema>;
