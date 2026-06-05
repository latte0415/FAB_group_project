import { beforeAll, describe, expect, it } from "vitest";

import { getDefaultRelationTypes } from "@/domain/ontology/relation-taxonomy";
import { evaluateLearnerAttempt } from "@/pipeline/attempt-evaluator/evaluate-learner-attempt";
import { prepareBenchmarkOntologyInput } from "@/pipeline/benchmark-ontology/prepare-benchmark-ontology";
import { generateDiagnosis } from "@/pipeline/diagnosis-generator/generate-diagnosis";
import { evaluateQuizAnswer } from "@/pipeline/quiz-generator/evaluate-quiz-answer";
import { generateQuizQuestions } from "@/pipeline/quiz-generator/generate-quiz-questions";
import type { BenchmarkOntologyPrepareResponse } from "@/schemas/benchmark-ontology";
import { envisioningDemoCourseNote } from "@/test/fixtures/envisioning-demo-course-note";

describe("generateDiagnosis", () => {
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

  it("summarizes relation-level misunderstandings across attempts and quiz answers", () => {
    const hiddenTask = prepared.learnerFacingOntology.hiddenTasks[0];
    const benchmarkRelation = prepared.benchmarkOntology.relations.find(
      (relation) => relation.id === hiddenTask.benchmarkRelationId,
    )!;
    const incorrectAttempt = evaluateLearnerAttempt({
      hiddenTask,
      benchmarkRelation,
      proposal: {
        hiddenTaskId: hiddenTask.id,
        sourceNodeId: benchmarkRelation.sourceNodeId,
        targetNodeId: benchmarkRelation.targetNodeId,
        relationTypeId: "uses",
      },
    }).attempt;
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
    const quizEvaluation = evaluateQuizAnswer({
      question,
      relationTypeId: wrongRelationTypeId,
    }).evaluation;
    const result = generateDiagnosis({
      benchmarkOntology: prepared.benchmarkOntology,
      attemptResults: [incorrectAttempt],
      quizEvaluations: [quizEvaluation],
    });

    expect(result.diagnosis.attemptMistakeCount).toBe(1);
    expect(result.diagnosis.quizMistakeCount).toBe(1);
    expect(result.diagnosis.misunderstoodRelations.length).toBeGreaterThan(0);
    expect(result.diagnosis.summary).toContain("misunderstanding");
  });
});
