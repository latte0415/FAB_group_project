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
  const attemptMistakes = request.attemptResults.filter(
    (attempt) => attempt.result === "incorrect",
  );
  const quizMistakes = request.quizEvaluations.filter(
    (evaluation) => evaluation.result === "incorrect",
  );
  const misunderstoodRelations = collectMisunderstoodRelations(request, quizMistakes);

  return generateDiagnosisResponseSchema.parse({
    diagnosis: {
      id: "qualitative-diagnosis-current",
      summary: buildSummary(attemptMistakes.length, quizMistakes.length, misunderstoodRelations),
      misunderstoodRelations,
      attemptMistakeCount: attemptMistakes.length,
      quizMistakeCount: quizMistakes.length,
    },
  });
}

function collectMisunderstoodRelations(
  request: GenerateDiagnosisRequest,
  quizMistakes: GenerateDiagnosisRequest["quizEvaluations"],
): MisunderstoodRelation[] {
  const grouped = new Map<string, MisunderstoodRelation>();

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

    for (const mismatch of attempt.mismatches) {
      if (mismatch.field !== "relationTypeId") {
        continue;
      }

      const key = mismatch.proposed;
      const existing = grouped.get(key) ?? {
        relationTypeId: mismatch.proposed,
        reasons: [],
      };

      existing.reasons.push(
        `Hidden relation task ${attempt.hiddenTaskId} proposed "${mismatch.proposed}" instead of "${mismatch.expected}".`,
      );
      grouped.set(key, existing);
    }
  }

  return Array.from(grouped.values()).sort((left, right) =>
    left.relationTypeId.localeCompare(right.relationTypeId),
  );
}

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
