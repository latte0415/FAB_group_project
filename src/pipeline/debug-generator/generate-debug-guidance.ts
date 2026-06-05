import type {
  GenerateDebugGuidanceRequest,
  GenerateDebugGuidanceResponse,
} from "@/schemas/debugging";
import {
  generateDebugGuidanceRequestSchema,
  generateDebugGuidanceResponseSchema,
} from "@/schemas/debugging";

export function generateDebugGuidance(
  input: GenerateDebugGuidanceRequest,
): GenerateDebugGuidanceResponse {
  const request = generateDebugGuidanceRequestSchema.parse(input);

  if (request.attempt.result === "correct") {
    throw new Error("Debug guidance is only generated for incorrect attempts.");
  }

  const evidenceText =
    request.evidenceChunk?.text ??
    request.attempt.debugEvidence?.text ??
    request.benchmarkRelation.evidenceText;

  const evidenceChunkId =
    request.evidenceChunk?.id ??
    request.attempt.debugEvidence?.chunkId ??
    request.benchmarkRelation.evidenceChunkId;

  return generateDebugGuidanceResponseSchema.parse({
    guidance: {
      hiddenTaskId: request.hiddenTask.id,
      attemptResult: request.attempt,
      message:
        "Your proposed relation does not match the evidence. Follow the prompts below to reread the source evidence and revise the relation.",
      prompts: [
        {
          id: "debug-prompt-evidence",
          text: "In the evidence sentence, find how the source concept and target concept are connected and in what order.",
          focus: "evidence",
        },
        {
          id: "debug-prompt-relation-type",
          text: "Which relation type in the taxonomy is closest to the verb or phrasing in the evidence?",
          focus: "relation_type",
        },
        {
          id: "debug-prompt-direction",
          text: "Check whether the source node and target node direction matches the flow in the evidence.",
          focus: "source_node",
        },
      ],
      evidence: {
        chunkId: evidenceChunkId,
        text: evidenceText,
        sectionTitle: request.evidenceChunk?.sectionTitle,
      },
      revealAnswer: false,
    },
  });
}
