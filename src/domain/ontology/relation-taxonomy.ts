import type { ConceptType, RelationType } from "@/schemas/benchmark-ontology";

type RelationSeed = {
  id: string;
  category: RelationType["category"];
  description: string;
  allowedSourceTypes?: ConceptType[];
  allowedTargetTypes?: ConceptType[];
  bidirectional?: boolean;
};

const relationSeeds: RelationSeed[] = [
  {
    id: "solves",
    category: "problem",
    description: "An approach resolves a problem.",
    allowedSourceTypes: ["approach"],
    allowedTargetTypes: ["problem"],
  },
  {
    id: "addresses",
    category: "problem",
    description: "An approach responds to or handles a problem.",
    allowedSourceTypes: ["approach"],
    allowedTargetTypes: ["problem"],
  },
  {
    id: "arises_in",
    category: "problem",
    description: "A problem appears inside a structure.",
    allowedSourceTypes: ["problem"],
    allowedTargetTypes: ["structure"],
  },
  {
    id: "constrains",
    category: "problem",
    description: "A property constrains a problem.",
    allowedSourceTypes: ["property"],
    allowedTargetTypes: ["problem"],
  },
  {
    id: "results_from",
    category: "problem",
    description: "A problem results from a structure.",
    allowedSourceTypes: ["problem"],
    allowedTargetTypes: ["structure"],
  },
  {
    id: "uses",
    category: "approach",
    description: "An approach uses a structure.",
    allowedSourceTypes: ["approach"],
    allowedTargetTypes: ["structure"],
  },
  {
    id: "operates_on",
    category: "approach",
    description: "An approach operates on an element.",
    allowedSourceTypes: ["approach"],
    allowedTargetTypes: ["element"],
  },
  {
    id: "assumes",
    category: "approach",
    description: "An approach assumes a property.",
    allowedSourceTypes: ["approach"],
    allowedTargetTypes: ["property"],
  },
  {
    id: "reduces",
    category: "approach",
    description: "An approach reduces a structure or its complexity.",
    allowedSourceTypes: ["approach"],
    allowedTargetTypes: ["structure"],
  },
  {
    id: "improves",
    category: "approach",
    description: "An approach improves a problem state.",
    allowedSourceTypes: ["approach"],
    allowedTargetTypes: ["problem"],
  },
  {
    id: "composed_of",
    category: "structure",
    description: "A structure is composed of an element.",
    allowedSourceTypes: ["structure"],
    allowedTargetTypes: ["element"],
  },
  {
    id: "has_property",
    category: "structure",
    description: "A structure has a property.",
    allowedSourceTypes: ["structure"],
    allowedTargetTypes: ["property"],
  },
  {
    id: "supports",
    category: "structure",
    description: "A structure supports an approach.",
    allowedSourceTypes: ["structure"],
    allowedTargetTypes: ["approach"],
  },
  {
    id: "represents",
    category: "structure",
    description: "A structure represents an element.",
    allowedSourceTypes: ["structure"],
    allowedTargetTypes: ["element"],
  },
  {
    id: "organizes",
    category: "structure",
    description: "A structure organizes an element.",
    allowedSourceTypes: ["structure"],
    allowedTargetTypes: ["element"],
  },
  {
    id: "part_of",
    category: "element",
    description: "An element is part of a structure.",
    allowedSourceTypes: ["element"],
    allowedTargetTypes: ["structure"],
  },
  {
    id: "interacts_with",
    category: "element",
    description: "An element interacts with another element.",
    allowedSourceTypes: ["element"],
    allowedTargetTypes: ["element"],
    bidirectional: true,
  },
  {
    id: "defines",
    category: "element",
    description: "An element defines a structure.",
    allowedSourceTypes: ["element"],
    allowedTargetTypes: ["structure"],
  },
  {
    id: "restricts",
    category: "element",
    description: "An element restricts another element.",
    allowedSourceTypes: ["element"],
    allowedTargetTypes: ["element"],
  },
  {
    id: "applies_to",
    category: "property",
    description: "A property applies to a structure.",
    allowedSourceTypes: ["property"],
    allowedTargetTypes: ["structure"],
  },
  {
    id: "affects",
    category: "property",
    description: "A property affects an approach.",
    allowedSourceTypes: ["property"],
    allowedTargetTypes: ["approach"],
  },
  {
    id: "limits",
    category: "property",
    description: "A property limits an approach.",
    allowedSourceTypes: ["property"],
    allowedTargetTypes: ["approach"],
  },
  {
    id: "enables",
    category: "property",
    description: "A property enables an approach.",
    allowedSourceTypes: ["property"],
    allowedTargetTypes: ["approach"],
  },
  {
    id: "motivates",
    category: "knowledge_reasoning",
    description: "An element motivates another element.",
    allowedSourceTypes: ["element"],
    allowedTargetTypes: ["element"],
  },
  {
    id: "requires",
    category: "knowledge_reasoning",
    description: "A structure requires an element.",
    allowedSourceTypes: ["structure"],
    allowedTargetTypes: ["element"],
  },
  {
    id: "depends_on",
    category: "knowledge_reasoning",
    description: "An element depends on another element.",
    allowedSourceTypes: ["element"],
    allowedTargetTypes: ["element"],
  },
  {
    id: "instantiates",
    category: "knowledge_reasoning",
    description: "An element instantiates another element.",
    allowedSourceTypes: ["element"],
    allowedTargetTypes: ["element"],
  },
  {
    id: "is_a",
    category: "same_type",
    description: "A concept is a subtype or instance of another concept.",
  },
  {
    id: "contrasts_with",
    category: "same_type",
    description: "A concept contrasts with another concept.",
    bidirectional: true,
  },
  {
    id: "extends",
    category: "same_type",
    description: "A concept extends another concept.",
  },
  {
    id: "related_to",
    category: "same_type",
    description: "A concept is broadly related to another concept.",
    bidirectional: true,
  },
];

export const defaultRelationTypes: RelationType[] = relationSeeds.map((seed) => ({
  ...seed,
  name: seed.id,
  bidirectional: seed.bidirectional ?? false,
}));

export function getDefaultRelationTypes(): RelationType[] {
  return defaultRelationTypes.map((relationType) => ({
    ...relationType,
    allowedSourceTypes: relationType.allowedSourceTypes
      ? [...relationType.allowedSourceTypes]
      : undefined,
    allowedTargetTypes: relationType.allowedTargetTypes
      ? [...relationType.allowedTargetTypes]
      : undefined,
  }));
}
