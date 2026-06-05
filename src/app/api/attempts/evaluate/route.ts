import { NextResponse } from "next/server";

import { evaluateLearnerAttempt } from "@/pipeline/attempt-evaluator/evaluate-learner-attempt";
import type { ApiResult } from "@/schemas/api-result";
import {
  evaluateLearnerAttemptRequestSchema,
  type EvaluateLearnerAttemptResponse,
} from "@/schemas/learner-attempt";

export async function POST(
  request: Request,
): Promise<NextResponse<ApiResult<EvaluateLearnerAttemptResponse>>> {
  try {
    const body = evaluateLearnerAttemptRequestSchema.parse(await request.json());
    const data = evaluateLearnerAttempt(body);

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "ATTEMPT_EVALUATION_FAILED",
          message: "Failed to evaluate the learner relation proposal.",
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 400 },
    );
  }
}
