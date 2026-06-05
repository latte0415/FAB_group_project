import type { NodeCandidate } from "@/schemas/benchmark-ontology";

export function findNodesInText(
  nodeCandidates: NodeCandidate[],
  text: string,
): NodeCandidate[] {
  const lowerText = text.toLowerCase();

  return nodeCandidates.filter((candidate) =>
    lowerText.includes(candidate.name.toLowerCase()),
  );
}

export function resolveNodeCandidate(
  nodeCandidates: NodeCandidate[],
  phrase: string,
): NodeCandidate | undefined {
  const normalizedPhrase = phrase.trim().toLowerCase();

  if (normalizedPhrase.length < 2) {
    return undefined;
  }

  const sortedCandidates = [...nodeCandidates].sort(
    (left, right) => right.name.length - left.name.length,
  );

  for (const candidate of sortedCandidates) {
    const normalizedName = candidate.name.toLowerCase();

    if (
      normalizedPhrase.includes(normalizedName) ||
      normalizedName.includes(normalizedPhrase)
    ) {
      return candidate;
    }
  }

  return undefined;
}

export function cleanRelationPhrase(phrase: string): string {
  return phrase
    .replace(/^["'“”‘’]+|["'“”‘’]+$/gu, "")
    .replace(/\b(a|an|the|to|of|in|on|for|as|by|with|from|their|its|our|his|her)\b/giu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}
