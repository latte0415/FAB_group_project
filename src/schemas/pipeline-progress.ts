import { z } from "zod";

export const pipelineProgressEventSchema = z.object({
  type: z.literal("progress"),
  percent: z.number().min(0).max(100),
});

export const pipelineStreamResultEventSchema = z.object({
  type: z.literal("result"),
  data: z.unknown(),
});

export const pipelineStreamErrorEventSchema = z.object({
  type: z.literal("error"),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export const pipelineStreamEventSchema = z.discriminatedUnion("type", [
  pipelineProgressEventSchema,
  pipelineStreamResultEventSchema,
  pipelineStreamErrorEventSchema,
]);

export type PipelineProgressEvent = z.infer<typeof pipelineProgressEventSchema>;
export type PipelineStreamErrorEvent = z.infer<typeof pipelineStreamErrorEventSchema>;
