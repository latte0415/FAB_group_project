import { createLlmValidationClient } from "@/lib/llm/create-validation-client";
import { isLlmValidationConfigured } from "@/lib/config/llm-config";
import type { LlmValidationClient } from "@/lib/llm/types";
import type { PipelineStage } from "@/schemas/benchmark-ontology";
import type { PipelineStageName } from "@/schemas/pipeline-stages";

export type PipelineStageOptions = {
  llmClient?: LlmValidationClient | null;
  onProgress?: (percent: number) => void;
};

export function createCompletedStage(name: string): PipelineStage {
  const timestamp = new Date().toISOString();

  return {
    name,
    status: "completed",
    startedAt: timestamp,
    finishedAt: timestamp,
    warnings: [],
    errors: [],
  };
}

export function resolveLlmClient(
  enableLlmValidation: boolean | undefined,
  options: PipelineStageOptions = {},
): LlmValidationClient | null {
  if (options.llmClient === null) {
    return null;
  }

  if (options.llmClient) {
    return options.llmClient;
  }

  const useLlmValidation = enableLlmValidation ?? isLlmValidationConfigured();

  if (!useLlmValidation) {
    return null;
  }

  return createLlmValidationClient();
}

export function buildStageEnvelope<TData>(input: {
  stageName: string;
  nextStage: PipelineStageName | null;
  data: TData;
  warnings?: string[];
}) {
  const stage = createCompletedStage(input.stageName);

  if (input.warnings && input.warnings.length > 0) {
    stage.warnings = input.warnings;
  }

  return {
    stage,
    nextStage: input.nextStage,
    data: input.data,
  };
}
