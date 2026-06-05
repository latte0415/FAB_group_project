import { getLlmConfig } from "@/lib/config/llm-config";
import { buildConceptValidationPrompt } from "@/lib/llm/prompts/concept-validation";
import { buildRelationValidationPrompt } from "@/lib/llm/prompts/relation-validation";
import type {
  ConceptValidationInput,
  LlmValidationClient,
  RelationValidationInput,
} from "@/lib/llm/types";
import {
  llmConceptValidationBatchResponseSchema,
  llmRelationValidationBatchResponseSchema,
  type LlmConceptValidationResult,
  type LlmRelationValidationResult,
} from "@/schemas/llm-validation";

export class LLMProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LLMProviderError";
  }
}

export function createOpenAiCompatibleValidationClient(): LlmValidationClient {
  const config = getLlmConfig();

  if (!config.apiKey) {
    throw new LLMProviderError("LLM_API_KEY is not configured.");
  }

  return {
    validateConcepts: (input) => validateConceptBatch(input, config),
    validateRelations: (input) => validateRelationBatch(input, config),
  };
}

async function validateConceptBatch(
  input: ConceptValidationInput[],
  config: ReturnType<typeof getLlmConfig>,
): Promise<LlmConceptValidationResult[]> {
  if (input.length === 0) {
    return [];
  }

  const prompt = buildConceptValidationPrompt({ candidates: input });
  const response = await requestJsonCompletion({
    config,
    system: prompt.system,
    user: prompt.user,
  });

  return llmConceptValidationBatchResponseSchema.parse(response).results;
}

async function validateRelationBatch(
  input: RelationValidationInput[],
  config: ReturnType<typeof getLlmConfig>,
): Promise<LlmRelationValidationResult[]> {
  if (input.length === 0) {
    return [];
  }

  const prompt = buildRelationValidationPrompt({ relations: input });
  const response = await requestJsonCompletion({
    config,
    system: prompt.system,
    user: prompt.user,
  });

  return llmRelationValidationBatchResponseSchema.parse(response).results;
}

async function requestJsonCompletion(input: {
  config: ReturnType<typeof getLlmConfig>;
  system: string;
  user: string;
}): Promise<unknown> {
  const response = await fetch(`${input.config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: input.config.model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.user },
      ],
    }),
  });

  if (!response.ok) {
    throw new LLMProviderError(`LLM provider request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new LLMProviderError("LLM provider returned an empty response.");
  }

  return JSON.parse(content);
}
