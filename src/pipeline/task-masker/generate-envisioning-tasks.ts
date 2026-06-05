import type { EnvisioningTaskConfig } from "@/lib/config/envisioning-task-config";
import type {
  BenchmarkOntologyGraph,
  HiddenRelationTask,
  LearnerFacingOntology,
  OntologyRelation,
} from "@/schemas/benchmark-ontology";

export function generateEnvisioningTasks(input: {
  benchmarkOntology: BenchmarkOntologyGraph;
  config: EnvisioningTaskConfig;
}): LearnerFacingOntology {
  const relationsToHide = selectRelationsToHide(
    input.benchmarkOntology.relations,
    input.config,
  );
  const hiddenRelationIds = new Set(relationsToHide.map((relation) => relation.id));
  const hiddenTasks = relationsToHide.map<HiddenRelationTask>((relation, index) => ({
    id: `hidden-relation-task-${String(index + 1).padStart(4, "0")}`,
    benchmarkRelationId: relation.id,
    sourceNodeId: relation.sourceNodeId,
    targetNodeId: relation.targetNodeId,
    relationTypeId: relation.relationTypeId,
    evidenceChunkId: relation.evidenceChunkId,
    prompt: "Restore the missing relation using the available source and target nodes.",
    selectionReasons: buildSelectionReasons(relation, input.config),
    status: "active",
  }));
  const visibleRelations = input.benchmarkOntology.relations.filter(
    (relation) => !hiddenRelationIds.has(relation.id),
  );

  return {
    id: "learner-facing-ontology-current",
    nodes: input.benchmarkOntology.nodes,
    visibleRelations,
    hiddenTasks,
    summary: {
      nodeCount: input.benchmarkOntology.nodes.length,
      visibleRelationCount: visibleRelations.length,
      hiddenRelationCount: hiddenTasks.length,
    },
  };
}

function selectRelationsToHide(
  relations: OntologyRelation[],
  config: EnvisioningTaskConfig,
): OntologyRelation[] {
  return [...relations]
    .sort((left, right) => {
      const leftPriority = getPriority(left.relationTypeId, config);
      const rightPriority = getPriority(right.relationTypeId, config);

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      return left.id.localeCompare(right.id);
    })
    .slice(0, config.maxHiddenRelations);
}

function getPriority(relationTypeId: string, config: EnvisioningTaskConfig): number {
  const priority = config.relationTypePriority.indexOf(relationTypeId);

  return priority >= 0 ? priority : config.relationTypePriority.length;
}

function buildSelectionReasons(
  relation: OntologyRelation,
  config: EnvisioningTaskConfig,
): HiddenRelationTask["selectionReasons"] {
  const reasons: HiddenRelationTask["selectionReasons"] = [];

  if (config.relationTypePriority.includes(relation.relationTypeId)) {
    reasons.push("relation_type_priority");
  }

  reasons.push("first_verified_relation");

  return reasons;
}
