import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { evaluateQuizAnswer } from "@/pipeline/quiz-generator/evaluate-quiz-answer";
import type { ApiResult } from "@/schemas/api-result";
import {
  evaluateQuizAnswerRequestSchema,
  type EvaluateQuizAnswerResponse,
} from "@/schemas/quiz";

export async function POST(
  request: Request,
): Promise<NextResponse<ApiResult<EvaluateQuizAnswerResponse>>> {
  try {
    const body = evaluateQuizAnswerRequestSchema.parse(await request.json());
    const data = evaluateQuizAnswer(body);

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Request does not match the quiz evaluate schema.",
            details: error.flatten(),
          },
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "QUIZ_EVALUATION_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "An error occurred during quiz answer evaluation.",
        },
      },
      { status: 400 },
    );
  }
}
