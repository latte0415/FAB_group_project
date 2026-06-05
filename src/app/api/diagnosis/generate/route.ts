import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { generateDiagnosis } from "@/pipeline/diagnosis-generator/generate-diagnosis";
import type { ApiResult } from "@/schemas/api-result";
import {
  generateDiagnosisRequestSchema,
  type GenerateDiagnosisResponse,
} from "@/schemas/diagnosis";

export async function POST(
  request: Request,
): Promise<NextResponse<ApiResult<GenerateDiagnosisResponse>>> {
  try {
    const body = generateDiagnosisRequestSchema.parse(await request.json());
    const data = generateDiagnosis(body);

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Request does not match the diagnosis generate schema.",
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
          code: "DIAGNOSIS_GENERATION_FAILED",
          message: "An error occurred during diagnosis generation.",
        },
      },
      { status: 500 },
    );
  }
}
