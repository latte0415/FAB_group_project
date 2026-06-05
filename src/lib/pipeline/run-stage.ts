import type { ApiResult } from "@/schemas/api-result";
import type { PipelineStage } from "@/schemas/benchmark-ontology";
import type { PipelineStageName } from "@/schemas/pipeline-stages";
import { pipelineStreamEventSchema } from "@/schemas/pipeline-progress";

export type StageEnvelope<TData> = {
  stage: PipelineStage;
  nextStage: PipelineStageName | null;
  data: TData;
};

export async function postPipelineStage<TData>(
  apiPath: string,
  body: unknown,
  onProgress?: (percent: number) => void,
): Promise<ApiResult<StageEnvelope<TData>>> {
  const response = await fetch(apiPath, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await response.json()) as ApiResult<StageEnvelope<TData>>;
  }

  if (!response.body) {
    return {
      ok: false,
      error: {
        code: "PIPELINE_STREAM_EMPTY",
        message: "Pipeline stage stream response is empty.",
      },
    };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: ApiResult<StageEnvelope<TData>> | null = null;

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }

      const parsed = pipelineStreamEventSchema.safeParse(JSON.parse(line));

      if (!parsed.success) {
        continue;
      }

      const event = parsed.data;

      if (event.type === "progress") {
        onProgress?.(event.percent);
        continue;
      }

      if (event.type === "result") {
        result = {
          ok: true,
          data: event.data as StageEnvelope<TData>,
        };
        continue;
      }

      result = {
        ok: false,
        error: event.error,
      };
    }
  }

  if (buffer.trim()) {
    const parsed = pipelineStreamEventSchema.safeParse(JSON.parse(buffer));

    if (parsed.success) {
      const event = parsed.data;

      if (event.type === "progress") {
        onProgress?.(event.percent);
      } else if (event.type === "result") {
        result = {
          ok: true,
          data: event.data as StageEnvelope<TData>,
        };
      } else {
        result = {
          ok: false,
          error: event.error,
        };
      }
    }
  }

  return (
    result ?? {
      ok: false,
      error: {
        code: "PIPELINE_STREAM_INCOMPLETE",
        message: "Pipeline stage stream did not complete.",
      },
    }
  );
}
