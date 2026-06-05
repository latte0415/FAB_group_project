import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { generateDebugGuidance } from "@/pipeline/debug-generator/generate-debug-guidance";
import type { ApiResult } from "@/schemas/api-result";
import {
  generateDebugGuidanceRequestSchema,
  type GenerateDebugGuidanceResponse,
} from "@/schemas/debugging";

export async function POST(
  request: Request,
): Promise<NextResponse<ApiResult<GenerateDebugGuidanceResponse>>> {
  try {
    const body = generateDebugGuidanceRequestSchema.parse(await request.json());
    const data = generateDebugGuidance(body);

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Request does not match the debugging generate schema.",
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
          code: "DEBUG_GUIDANCE_GENERATION_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "An error occurred while generating debugging guidance.",
        },
      },
      { status: 400 },
    );
  }
}
