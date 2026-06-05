import { beforeAll, describe, expect, it } from "vitest";

import { getDefaultRelationTypes } from "@/domain/ontology/relation-taxonomy";
import { prepareBenchmarkOntologyInput } from "@/pipeline/benchmark-ontology/prepare-benchmark-ontology";
import { evaluateQuizAnswer } from "@/pipeline/quiz-generator/evaluate-quiz-answer";
import { generateQuizQuestions } from "@/pipeline/quiz-generator/generate-quiz-questions";
import type { BenchmarkOntologyPrepareResponse } from "@/schemas/benchmark-ontology";
import { envisioningDemoCourseNote } from "@/test/fixtures/envisioning-demo-course-note";

describe("quiz generator", () => {
  let prepared: BenchmarkOntologyPrepareResponse;

  beforeAll(async () => {
    prepared = await prepareBenchmarkOntologyInput(
      {
        courseNote: envisioningDemoCourseNote,
        enableLlmValidation: false,
      },
      { llmClient: null },
    );
  }, 30000);

  it("selects edge quiz questions from all verified relations", () => {
    const result = generateQuizQuestions({
      benchmarkOntology: prepared.benchmarkOntology,
      relationTypes: getDefaultRelationTypes(),
    });

    expect(result.summary.sourceRelationCount).toBe(
      prepared.benchmarkOntology.relations.length,
    );
    expect(result.questions.length).toBe(3);
    expect(result.questions[0]?.benchmarkRelationId).toBeTruthy();
    expect(result.questions[0]?.evidenceChunkId).toBeTruthy();
  });

  it("maps incorrect edge quiz answers to misunderstood relation types", () => {
    const quiz = generateQuizQuestions({
      benchmarkOntology: prepared.benchmarkOntology,
      relationTypes: getDefaultRelationTypes(),
      maxQuestions: 1,
    });
    const question = quiz.questions[0];
    const wrongRelationTypeId =
      getDefaultRelationTypes().find(
        (relationType) => relationType.id !== question.correctRelationTypeId,
      )?.id ?? "uses";

    const evaluation = evaluateQuizAnswer({
      question,
      relationTypeId: wrongRelationTypeId,
    });

    expect(evaluation.evaluation.result).toBe("incorrect");
    expect(evaluation.evaluation.misunderstoodRelationTypeId).toBe(
      wrongRelationTypeId,
    );
  });
});
