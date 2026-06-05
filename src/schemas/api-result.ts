import { z } from "zod";

export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;

export type ApiResult<T> =
  | { ok: true; data: T; warnings?: string[] }
  | { ok: false; error: ApiError };
