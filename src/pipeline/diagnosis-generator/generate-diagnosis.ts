import type {
  GenerateDiagnosisRequest,
  GenerateDiagnosisResponse,
  MisunderstoodRelation,
} from "@/schemas/diagnosis";
import {
  generateDiagnosisRequestSchema,
  generateDiagnosisResponseSchema,
} from "@/schemas/diagnosis";

export function generateDiagnosis(
  input: GenerateDiagnosisRequest,
): GenerateDiagnosisResponse {
  const request = generateDiagnosisRequestSchema.parse(input);
  const restoreTaskById = new Map(
    request.restoreTasks.map((task) => [task.id, task]),
  );
  const attemptMistakes = request.attemptResults.filter((attempt) => {
    const task = restoreTaskById.get(attempt.hiddenTaskId);
    return (
      attempt.result === "incorrect" &&
      !task?.selectionReasons.includes("edge_quiz_selection")
    );
  });
  const edgeQuizAttemptMistakes = request.attemptResults.filter((attempt) => {
    const task = restoreTaskById.get(attempt.hiddenTaskId);
    return (
      attempt.result === "incorrect" &&
      task?.selectionReasons.includes("edge_quiz_selection")
    );
  });
  const quizMistakes = request.quizEvaluations.filter(
    (evaluation) => evaluation.result === "incorrect",
  );
  const quizMistakeCount = quizMistakes.length + edgeQuizAttemptMistakes.length;
  const misunderstoodRelations = collectMisunderstoodRelations(request, quizMistakes);

  return generateDiagnosisResponseSchema.parse({
    diagnosis: {
      id: "qualitative-diagnosis-current",
      summary: buildSummary(attemptMistakes.length, quizMistakeCount, misunderstoodRelations),
      misunderstoodRelations,
      attemptMistakeCount: attemptMistakes.length,
      quizMistakeCount,
    },
  });
}

function collectMisunderstoodRelations(
  request: GenerateDiagnosisRequest,
  quizMistakes: GenerateDiagnosisRequest["quizEvaluations"],
): MisunderstoodRelation[] {
  const grouped = new Map<string, MisunderstoodRelation>();
  const relationById = new Map(
    request.benchmarkOntology.relations.map((relation) => [relation.id, relation]),
  );
  const restoreTaskById = new Map(
    request.restoreTasks.map((task) => [task.id, task]),
  );

  for (const mistake of quizMistakes) {
    if (!mistake.misunderstoodRelationTypeId) {
      continue;
    }

    const key = mistake.misunderstoodRelationTypeId;
    const existing = grouped.get(key) ?? {
      relationTypeId: mistake.misunderstoodRelationTypeId,
      reasons: [],
    };

    existing.reasons.push(`Quiz question ${mistake.questionId} was answered incorrectly.`);
    grouped.set(key, existing);
  }

  for (const attempt of request.attemptResults) {
    if (attempt.result !== "incorrect") {
      continue;
    }

    const task = restoreTaskById.get(attempt.hiddenTaskId);
    const benchmarkRelation = task
      ? relationById.get(task.benchmarkRelationId)
      : undefined;
    const relationTypeId =
      benchmarkRelation?.relationTypeId ??
      attempt.mismatches.find((mismatch) => mismatch.field === "relationTypeId")
        ?.expected;

    if (!relationTypeId) {
      continue;
    }

    const key = [
      relationTypeId,
      benchmarkRelation?.sourceNodeId,
      benchmarkRelation?.targetNodeId,
      benchmarkRelation?.evidenceChunkId,
    ].join(":");
    const existing = grouped.get(key) ?? {
      relationTypeId,
      sourceNodeId: benchmarkRelation?.sourceNodeId,
      targetNodeId: benchmarkRelation?.targetNodeId,
      evidenceChunkId: benchmarkRelation?.evidenceChunkId,
      reasons: [],
    };

    for (const mismatch of attempt.mismatches) {
      const fieldLabel = mismatchFieldLabels[mismatch.field];

      existing.reasons.push(
        `Task ${attempt.hiddenTaskId} mismatched the ${fieldLabel}: proposed "${mismatch.proposed}" instead of "${mismatch.expected}".`,
      );
    }

    grouped.set(key, existing);
  }

  return Array.from(grouped.values()).sort((left, right) =>
    left.relationTypeId.localeCompare(right.relationTypeId),
  );
}

const mismatchFieldLabels = {
  sourceNodeId: "source node",
  targetNodeId: "target node",
  relationTypeId: "relation type",
} as const;

function buildSummary(
  attemptMistakeCount: number,
  quizMistakeCount: number,
  misunderstoodRelations: MisunderstoodRelation[],
): string {
  if (attemptMistakeCount === 0 && quizMistakeCount === 0) {
    return "Both Envisioning restoration and quiz responses match the verified ontology relations.";
  }

  const misunderstoodLabels = misunderstoodRelations
    .map((relation) => relation.relationTypeId)
    .join(", ");

  return `There are ${attemptMistakeCount} incorrect Envisioning attempts and ${quizMistakeCount} incorrect quiz answers. Misunderstandings are especially observed in interpreting ${misunderstoodLabels || "relation type"}.`;
}
