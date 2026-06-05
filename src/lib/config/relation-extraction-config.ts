export type RelationVerbPattern = {
  relationTypeId: string;
  verbs: string[];
};

export const relationVerbPatterns: RelationVerbPattern[] = [
  { relationTypeId: "solves", verbs: ["solves", "solve", "solved", "solving"] },
  { relationTypeId: "addresses", verbs: ["addresses", "address", "addressed", "addressing"] },
  { relationTypeId: "arises_in", verbs: ["arises in", "arise in", "arising in"] },
  { relationTypeId: "constrains", verbs: ["constrains", "constrain", "constrained"] },
  { relationTypeId: "results_from", verbs: ["results from", "result from", "resulting from"] },
  { relationTypeId: "uses", verbs: ["uses", "use", "using", "used"] },
  { relationTypeId: "operates_on", verbs: ["operates on", "operate on", "operating on"] },
  { relationTypeId: "assumes", verbs: ["assumes", "assume", "assumed", "assuming"] },
  { relationTypeId: "reduces", verbs: ["reduces", "reduce", "reduced", "reducing"] },
  { relationTypeId: "improves", verbs: ["improves", "improve", "improved", "improving"] },
  { relationTypeId: "composed_of", verbs: ["composed of", "compose of", "composes of"] },
  { relationTypeId: "has_property", verbs: ["has", "have", "having"] },
  { relationTypeId: "supports", verbs: ["supports", "support", "supported", "supporting"] },
  { relationTypeId: "represents", verbs: ["represents", "represent", "refer to", "refers to"] },
  { relationTypeId: "organizes", verbs: ["organizes", "organize", "organized", "organizing"] },
  { relationTypeId: "part_of", verbs: ["part of", "parts of"] },
  { relationTypeId: "interacts_with", verbs: ["interacts with", "interact with", "interacting with"] },
  { relationTypeId: "defines", verbs: ["defines", "define", "defined", "defining"] },
  { relationTypeId: "restricts", verbs: ["restricts", "restrict", "restricted", "restricting"] },
  { relationTypeId: "applies_to", verbs: ["applies to", "apply to", "applied to"] },
  { relationTypeId: "affects", verbs: ["affects", "affect", "affected", "affecting"] },
  { relationTypeId: "limits", verbs: ["limits", "limit", "limited", "limiting"] },
  { relationTypeId: "enables", verbs: ["enables", "enable", "enabled", "enabling"] },
  { relationTypeId: "motivates", verbs: ["motivates", "motivate", "motivated", "motivating"] },
  { relationTypeId: "requires", verbs: ["requires", "require", "required", "requiring"] },
  { relationTypeId: "depends_on", verbs: ["depends on", "depend on", "depending on"] },
  { relationTypeId: "instantiates", verbs: ["instantiates", "instantiate", "instantiated"] },
  { relationTypeId: "is_a", verbs: ["is a", "is an", "are a", "are an"] },
  { relationTypeId: "contrasts_with", verbs: ["contrasts with", "contrast with", "contrasting with"] },
  { relationTypeId: "extends", verbs: ["extends", "extend", "extended", "extending"] },
  { relationTypeId: "related_to", verbs: ["related to", "relates to", "relating to"] },
];

export function getRelationVerbPatterns(): RelationVerbPattern[] {
  return relationVerbPatterns.map((pattern) => ({
    relationTypeId: pattern.relationTypeId,
    verbs: [...pattern.verbs],
  }));
}

export function getAllRelationVerbs(): string[] {
  return relationVerbPatterns.flatMap((pattern) => pattern.verbs);
}
