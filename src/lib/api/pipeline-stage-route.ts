import { ZodError, type ZodTypeAny } from "zod";

import { mapPipelineError } from "@/lib/llm/pipeline-api";
import type { PipelineStageOptions } from "@/pipeline/stages/shared";

export function createStageRunner<TRequest, TResponse>(
  requestSchema: ZodTypeAny,
  run: (body: TRequest, options?: PipelineStageOptions) => Promise<TResponse>,
) {
  return async (body: unknown, onProgress: (percent: number) => void) =>
    run(requestSchema.parse(body), { onProgress });
}

export async function handlePipelineStageRoute<TResponse>(input: {
  request: Request;
  requestSchema: ZodTypeAny;
  validationMessage: string;
  failureCode: string;
  failureMessage: string;
  run: (body: unknown, onProgress: (percent: number) => void) => Promise<TResponse>;
}): Promise<Response> {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: unknown) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      try {
        const body = await input.request.json();
        const data = await input.run(body, (percent) => {
          emit({ type: "progress", percent });
        });

        emit({ type: "result", data });
        controller.close();
      } catch (error) {
        if (error instanceof ZodError) {
          const isLlmValidationShapeError = error.issues.some((issue) =>
            issue.path.some(
              (segment) =>
                segment === "results" ||
                segment === "suggestedType" ||
                segment === "confirmedRelationTypeId",
            ),
          );

          emit({
            type: "error",
            error: {
              code: isLlmValidationShapeError
                ? "LLM_VALIDATION_RESPONSE_ERROR"
                : "VALIDATION_ERROR",
              message: isLlmValidationShapeError
                ? "LLM validation response does not match the schema."
                : input.validationMessage,
              details: error.flatten(),
            },
          });
          controller.close();
          return;
        }

        const mapped = mapPipelineError(error);

        emit({
          type: "error",
          error: {
            code: mapped.code === "PIPELINE_RUN_FAILED" ? input.failureCode : mapped.code,
            message:
              mapped.code === "PIPELINE_RUN_FAILED" ? input.failureMessage : mapped.message,
            details: mapped.details,
          },
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
