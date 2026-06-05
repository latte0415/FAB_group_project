import { selectEdgeQuizRelations } from "@/domain/quiz/select-edge-quiz-relations";
import { defaultQuizGenerationConfig } from "@/lib/config/quiz-generation-config";
import type {
  BenchmarkOntologyGraph,
  HiddenRelationTask,
  LearnerFacingOntology,
} from "@/schemas/benchmark-ontology";

export function isEdgeQuizRestoreTask(task: HiddenRelationTask) {
  return task.selectionReasons.includes("edge_quiz_selection");
}

export function buildEnvisioningRestoreTasks(input: {
  benchmarkOntology: BenchmarkOntologyGraph;
  learnerFacingOntology?: LearnerFacingOntology;
  edgeQuizCount?: number;
}): HiddenRelationTask[] {
  const nodeNameById = new Map(
    input.benchmarkOntology.nodes.map((node) => [node.id, node.name]),
  );
  const edgeQuizCount = input.edgeQuizCount ?? defaultQuizGenerationConfig.maxQuestions;
  const selectedEdgeRelations = selectEdgeQuizRelations(
    input.benchmarkOntology.relations,
    edgeQuizCount,
  );

  const edgeQuizTasks = selectedEdgeRelations.map<HiddenRelationTask>((relation, index) => {
    const sourceName = nodeNameById.get(relation.sourceNodeId) ?? relation.sourceNodeId;
    const targetName = nodeNameById.get(relation.targetNodeId) ?? relation.targetNodeId;

    return {
      id: `edge-quiz-task-${String(index + 1).padStart(4, "0")}`,
      benchmarkRelationId: relation.id,
      sourceNodeId: relation.sourceNodeId,
      targetNodeId: relation.targetNodeId,
      relationTypeId: relation.relationTypeId,
      evidenceChunkId: relation.evidenceChunkId,
      prompt: `Restore the relation type between "${sourceName}" and "${targetName}" based on the evidence.`,
      selectionReasons: ["edge_quiz_selection"],
      status: "active",
    };
  });

  return edgeQuizTasks;
}
