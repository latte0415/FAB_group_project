import { isLlmValidationConfigured } from "@/lib/config/llm-config";
import { LLMProviderError } from "@/lib/llm/openai-compatible-client";
import {
  prepareBenchmarkOntologyInput,
  type PrepareBenchmarkOntologyOptions,
} from "@/pipeline/benchmark-ontology/prepare-benchmark-ontology";
import type { BenchmarkOntologyPrepareRequest } from "@/schemas/benchmark-ontology";

export async function runBenchmarkOntologyPipeline(
  input: BenchmarkOntologyPrepareRequest,
  options: PrepareBenchmarkOntologyOptions = {},
) {
  const enableLlmValidation =
    input.enableLlmValidation ?? isLlmValidationConfigured();

  return prepareBenchmarkOntologyInput(
    {
      ...input,
      enableLlmValidation,
    },
    options,
  );
}

export function mapPipelineError(error: unknown): {
  code: string;
  message: string;
  status: number;
  details?: unknown;
} {
  if (error instanceof LLMProviderError) {
    return {
      code: "LLM_PROVIDER_ERROR",
      message: "Failed to call the LLM validation provider.",
      status: 502,
      details: error.message,
    };
  }

  return {
    code: "PIPELINE_RUN_FAILED",
    message: "An error occurred while running the pipeline.",
    status: 500,
  };
}
