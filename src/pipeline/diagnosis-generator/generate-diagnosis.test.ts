import { beforeAll, describe, expect, it } from "vitest";

import { getDefaultRelationTypes } from "@/domain/ontology/relation-taxonomy";
import { evaluateLearnerAttempt } from "@/pipeline/attempt-evaluator/evaluate-learner-attempt";
import { prepareBenchmarkOntologyInput } from "@/pipeline/benchmark-ontology/prepare-benchmark-ontology";
import { generateDiagnosis } from "@/pipeline/diagnosis-generator/generate-diagnosis";
import { evaluateQuizAnswer } from "@/pipeline/quiz-generator/evaluate-quiz-answer";
import { generateQuizQuestions } from "@/pipeline/quiz-generator/generate-quiz-questions";
import { buildEnvisioningRestoreTasks } from "@/lib/envisioning/build-restore-tasks";
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
      restoreTasks: [hiddenTask],
      attemptResults: [incorrectAttempt],
      quizEvaluations: [quizEvaluation],
    });

    expect(result.diagnosis.attemptMistakeCount).toBe(1);
    expect(result.diagnosis.quizMistakeCount).toBe(1);
    expect(result.diagnosis.misunderstoodRelations.length).toBeGreaterThan(0);
    expect(result.diagnosis.summary).toMatch(/misunderstanding/i);
  });

  it("counts edge quiz restore task mistakes as quiz mistakes", () => {
    const [edgeQuizTask] = buildEnvisioningRestoreTasks({
      benchmarkOntology: prepared.benchmarkOntology,
      learnerFacingOntology: prepared.learnerFacingOntology,
      edgeQuizCount: 1,
    });
    const benchmarkRelation = prepared.benchmarkOntology.relations.find(
      (relation) => relation.id === edgeQuizTask.benchmarkRelationId,
    )!;
    const wrongRelationTypeId =
      getDefaultRelationTypes().find(
        (relationType) => relationType.id !== benchmarkRelation.relationTypeId,
      )?.id ?? "uses";
    const incorrectAttempt = evaluateLearnerAttempt({
      hiddenTask: edgeQuizTask,
      benchmarkRelation,
      proposal: {
        hiddenTaskId: edgeQuizTask.id,
        sourceNodeId: benchmarkRelation.sourceNodeId,
        targetNodeId: benchmarkRelation.targetNodeId,
        relationTypeId: wrongRelationTypeId,
      },
    }).attempt;

    const result = generateDiagnosis({
      benchmarkOntology: prepared.benchmarkOntology,
      restoreTasks: [edgeQuizTask],
      attemptResults: [incorrectAttempt],
      quizEvaluations: [],
    });

    expect(result.diagnosis.attemptMistakeCount).toBe(0);
    expect(result.diagnosis.quizMistakeCount).toBe(1);
    expect(result.diagnosis.misunderstoodRelations[0]).toMatchObject({
      relationTypeId: benchmarkRelation.relationTypeId,
      sourceNodeId: benchmarkRelation.sourceNodeId,
      targetNodeId: benchmarkRelation.targetNodeId,
      evidenceChunkId: benchmarkRelation.evidenceChunkId,
    });
  });

  it("keeps source and target mismatches in relation-level diagnosis reasons", () => {
    const hiddenTask = prepared.learnerFacingOntology.hiddenTasks[0];
    const benchmarkRelation = prepared.benchmarkOntology.relations.find(
      (relation) => relation.id === hiddenTask.benchmarkRelationId,
    )!;
    const otherNode = prepared.benchmarkOntology.nodes.find(
      (node) => node.id !== benchmarkRelation.sourceNodeId,
    )!;
    const incorrectAttempt = evaluateLearnerAttempt({
      hiddenTask,
      benchmarkRelation,
      proposal: {
        hiddenTaskId: hiddenTask.id,
        sourceNodeId: otherNode.id,
        targetNodeId: benchmarkRelation.targetNodeId,
        relationTypeId: benchmarkRelation.relationTypeId,
      },
    }).attempt;

    const result = generateDiagnosis({
      benchmarkOntology: prepared.benchmarkOntology,
      restoreTasks: [hiddenTask],
      attemptResults: [incorrectAttempt],
      quizEvaluations: [],
    });

    expect(result.diagnosis.misunderstoodRelations[0].reasons.join(" ")).toContain(
      "source node",
    );
  });
});
