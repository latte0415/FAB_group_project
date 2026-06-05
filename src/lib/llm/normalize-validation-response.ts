import type { ConceptType } from "@/schemas/benchmark-ontology";

const conceptTypeValues = [
  "problem",
  "approach",
  "structure",
  "element",
  "property",
] as const satisfies readonly ConceptType[];

export function normalizeConceptType(value: unknown): ConceptType | undefined {
  if (value == null) {
    return undefined;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return undefined;
  }

  return conceptTypeValues.includes(normalized as ConceptType)
    ? (normalized as ConceptType)
    : undefined;
}

export function normalizeRelationTypeId(value: unknown): string | undefined {
  if (value == null) {
    return undefined;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

export function normalizeLlmScore(value: unknown): number {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  if (Number.isNaN(numeric)) {
    return 0;
  }

  const scaled = numeric > 1 && numeric <= 100 ? numeric / 100 : numeric;

  return Math.min(1, Math.max(0, scaled));
}

export function normalizeLlmBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const lower = value.trim().toLowerCase();

    if (lower === "true") {
      return true;
    }

    if (lower === "false") {
      return false;
    }
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  return false;
}

export function normalizeLlmRationale(value: unknown): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  return "No rationale provided.";
}

export function normalizeCandidateId(value: unknown): string | undefined {
  if (value == null) {
    return undefined;
  }

  const candidateId = String(value).trim();

  return candidateId.length > 0 ? candidateId : undefined;
}

export function normalizeValidationBatchPayload(response: unknown): {
  results: unknown[];
} {
  if (Array.isArray(response)) {
    return { results: response };
  }

  if (response && typeof response === "object") {
    const record = response as Record<string, unknown>;
    const results = record.results ?? record.candidates ?? record.validations ?? record.items;

    if (Array.isArray(results)) {
      return { results };
    }
  }

  return { results: [] };
}
