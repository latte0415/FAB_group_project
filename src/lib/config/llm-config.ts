export type LlmConfig = {
  enabled: boolean;
  apiKey?: string;
  baseUrl: string;
  model: string;
  conceptScoreThreshold: number;
  relationScoreThreshold: number;
  batchSize: number;
  promptVersion: string;
};

export function getLlmConfig(): LlmConfig {
  return {
    enabled: process.env.LLM_VALIDATION_ENABLED !== "false",
    apiKey: process.env.LLM_API_KEY ?? process.env.OPENAI_API_KEY,
    baseUrl:
      process.env.LLM_BASE_URL ??
      process.env.OPENAI_BASE_URL ??
      "https://api.openai.com/v1",
    model:
      process.env.LLM_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    conceptScoreThreshold: Number(process.env.LLM_CONCEPT_SCORE_THRESHOLD ?? "0.6"),
    relationScoreThreshold: Number(process.env.LLM_RELATION_SCORE_THRESHOLD ?? "0.65"),
    batchSize: Number(process.env.LLM_VALIDATION_BATCH_SIZE ?? "20"),
    promptVersion: process.env.LLM_PROMPT_VERSION ?? "concept-relation-validation-v1",
  };
}

export function isLlmValidationConfigured(): boolean {
  const config = getLlmConfig();

  return config.enabled && Boolean(config.apiKey);
}
