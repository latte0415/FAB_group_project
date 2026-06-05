import { findDemoConceptSeedsInText } from "@/lib/config/demo-concept-seeds";
import { getAllRelationVerbs } from "@/lib/config/relation-extraction-config";
import type {
  ConceptType,
  NodeCandidate,
  SourceChunk,
} from "@/schemas/benchmark-ontology";

const stopWords = new Set([
  "and",
  "are",
  "can",
  "for",
  "from",
  "into",
  "that",
  "the",
  "this",
  "with",
]);

const relationVerbs = getAllRelationVerbs();

const junkNamePrefix =
  /^(as|by|in|on|for|the|this|that|we|you|they|however|hence|note|first|second|third|fourth|fifth|rather|such|while|when|where|what|defining|learning|approach|his|her|its|our|their|shannon|simon)\b/iu;
const junkNameSuffix = /\b(will|however|that|which|who|whom|whose|see)$/iu;

type CandidateDraft = {
  name: string;
  sourceChunkIds: Set<string>;
  heuristics: Set<NodeCandidate["heuristics"][number]>;
};

export function generateNodeCandidates(
  sourceChunks: SourceChunk[],
): NodeCandidate[] {
  const drafts = new Map<string, CandidateDraft>();

  for (const chunk of sourceChunks) {
    if (chunk.sectionTitle) {
      addDraft(drafts, normalizeName(chunk.sectionTitle), chunk.id, "section_heading");
    }

    for (const phrase of extractFrequentTermPhrases(chunk.text)) {
      addDraft(drafts, phrase, chunk.id, "term_frequency");
    }

    for (const phrase of extractRelationArgumentPhrases(chunk.text)) {
      addDraft(drafts, phrase, chunk.id, "relation_argument_phrase");
    }

    for (const phrase of extractQuotedTerms(chunk.text)) {
      addDraft(drafts, phrase, chunk.id, "term_frequency");
    }

    for (const seed of findDemoConceptSeedsInText(chunk.text)) {
      addDraft(drafts, seed, chunk.id, "term_frequency");
    }
  }

  return Array.from(drafts.values())
    .filter((draft) => isValidConceptName(draft.name))
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((draft, index) => ({
      id: `node-candidate-${String(index + 1).padStart(4, "0")}`,
      name: draft.name,
      type: inferConceptType(draft.name),
      abstractionDepth: inferAbstractionDepth(draft.name),
      sourceChunkIds: Array.from(draft.sourceChunkIds).sort(),
      heuristics: Array.from(draft.heuristics).sort(),
      rationale: buildRationale(draft),
    }));
}

function addDraft(
  drafts: Map<string, CandidateDraft>,
  rawName: string,
  chunkId: string,
  heuristic: NodeCandidate["heuristics"][number],
) {
  const name = normalizeName(rawName);

  if (!name || stopWords.has(name.toLowerCase())) {
    return;
  }

  const key = name.toLowerCase();
  const draft =
    drafts.get(key) ??
    ({
      name,
      sourceChunkIds: new Set<string>(),
      heuristics: new Set<NodeCandidate["heuristics"][number]>(),
    } satisfies CandidateDraft);

  draft.sourceChunkIds.add(chunkId);
  draft.heuristics.add(heuristic);
  drafts.set(key, draft);
}

function extractFrequentTermPhrases(text: string): string[] {
  const phrases = text.match(/\b[A-Z][A-Za-z]*(?:\s+[A-Z]?[A-Za-z]+){0,2}\b/g) ?? [];

  return phrases
    .map(normalizeName)
    .filter(
      (phrase) =>
        phrase.length > 2 &&
        !stopWords.has(phrase.toLowerCase()) &&
        !containsRelationVerb(phrase) &&
        isValidConceptName(phrase),
    );
}

function extractQuotedTerms(text: string): string[] {
  const matches = [
    ...(text.match(/[“"]([^”"]{2,48})[”"]/gu) ?? []),
    ...(text.match(/'([^']{2,48})'/gu) ?? []),
  ];

  return matches
    .map((match) => normalizeName(match.replace(/^[“"'']|[”"'']$/gu, "")))
    .filter(isValidConceptName);
}

function extractRelationArgumentPhrases(text: string): string[] {
  const escapedVerbs = relationVerbs.join("|");
  const pattern = new RegExp(
    `\\b([A-Za-z][A-Za-z\\s-]{1,48}?)\\s+(?:${escapedVerbs})\\s+([A-Za-z][A-Za-z\\s-]{1,48}?)(?:[.!?]|$)`,
    "giu",
  );
  const phrases: string[] = [];

  for (const match of text.matchAll(pattern)) {
    phrases.push(cleanArgumentPhrase(match[1] ?? ""));
    phrases.push(cleanArgumentPhrase(match[2] ?? ""));
  }

  return phrases.filter(Boolean);
}

function cleanArgumentPhrase(phrase: string): string {
  return normalizeName(
    phrase
      .replace(/\b(a|an|the|to|of|in|on|for|as|by|with)\b/giu, " ")
      .replace(/\s+/gu, " "),
  );
}

function normalizeName(name: string): string {
  return name
    .replace(/^#+\s*/u, "")
    .replace(/^\d+(\.\d+)*\s*/u, "")
    .replace(/[:;,]+$/u, "")
    .trim();
}

function inferConceptType(name: string): ConceptType {
  const lowerName = name.toLowerCase();

  if (/(problem|challenge|complexity|uncertainty|limit)/u.test(lowerName)) {
    return "problem";
  }

  if (/(approach|processing|learning|reasoning|encoding|decoding|compression)/u.test(lowerName)) {
    return "approach";
  }

  if (/(system|network|message|structure|graph|maze|channel)/u.test(lowerName)) {
    return "structure";
  }

  if (/(capacity|syntactic|semantic|meaningless|meaningful|complex)/u.test(lowerName)) {
    return "property";
  }

  return "element";
}

function containsRelationVerb(phrase: string): boolean {
  const words = phrase.toLowerCase().split(/\s+/u);

  return relationVerbs.some((verb) => words.includes(verb));
}

function inferAbstractionDepth(name: string): 0 | 1 | 2 | 3 {
  const wordCount = name.split(/\s+/u).length;

  if (wordCount >= 4) {
    return 2;
  }

  if (wordCount >= 2) {
    return 1;
  }

  return 0;
}

function buildRationale(draft: CandidateDraft): string {
  return `Selected by ${Array.from(draft.heuristics).sort().join(", ")} in ${draft.sourceChunkIds.size} source chunk(s).`;
}

function isValidConceptName(name: string): boolean {
  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return false;
  }

  if (trimmed.split(/\s+/u).length > 5) {
    return false;
  }

  if (junkNamePrefix.test(trimmed) || junkNameSuffix.test(trimmed)) {
    return false;
  }

  return true;
}
