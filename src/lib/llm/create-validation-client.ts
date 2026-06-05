import { getLlmConfig, isLlmValidationConfigured } from "@/lib/config/llm-config";
import { createOpenAiCompatibleValidationClient } from "@/lib/llm/openai-compatible-client";
import type { LlmValidationClient } from "@/lib/llm/types";

export function createLlmValidationClient(): LlmValidationClient | null {
  if (!isLlmValidationConfigured()) {
    return null;
  }

  return createOpenAiCompatibleValidationClient();
}

export function getLlmValidationMetadata():
  | { enabled: true; model: string; promptVersion: string }
  | { enabled: false } {
  const config = getLlmConfig();

  if (!isLlmValidationConfigured()) {
    return { enabled: false };
  }

  return {
    enabled: true,
    model: config.model,
    promptVersion: config.promptVersion,
  };
}
