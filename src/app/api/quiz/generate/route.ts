import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { generateQuizQuestions } from "@/pipeline/quiz-generator/generate-quiz-questions";
import type { ApiResult } from "@/schemas/api-result";
import {
  generateQuizRequestSchema,
  type GenerateQuizResponse,
} from "@/schemas/quiz";

export async function POST(
  request: Request,
): Promise<NextResponse<ApiResult<GenerateQuizResponse>>> {
  try {
    const body = generateQuizRequestSchema.parse(await request.json());
    const data = generateQuizQuestions(body);

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Request does not match the quiz generate schema.",
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
          code: "QUIZ_GENERATION_FAILED",
          message: "An error occurred during quiz generation.",
        },
      },
      { status: 500 },
    );
  }
}
