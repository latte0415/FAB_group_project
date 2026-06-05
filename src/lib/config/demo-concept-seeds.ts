export const demoConceptSeeds = [
  "information processing",
  "credit assignment",
  "credit assignment problem",
  "information",
  "feedback",
  "AI systems",
  "AI paradigms",
  "Shannon information",
  "Simon information",
  "message passing",
  "channel capacity",
  "symbol manipulation",
  "communication systems",
  "complexity",
  "entropy",
  "bits",
  "agents",
  "problem-solving environments",
  "reinforcement learning",
  "learning in a society",
];

export function findDemoConceptSeedsInText(text: string): string[] {
  const lowerText = text.toLowerCase();
  const matches: string[] = [];

  for (const seed of demoConceptSeeds) {
    const pattern = new RegExp(`\\b${escapeRegExp(seed)}\\b`, "iu");

    if (pattern.test(lowerText)) {
      matches.push(seed);
    }
  }

  return matches.sort((left, right) => right.length - left.length);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
