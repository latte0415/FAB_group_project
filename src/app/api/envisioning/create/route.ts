import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { mapPipelineError } from "@/lib/llm/pipeline-api";
import { runEnvisioningStage } from "@/pipeline/stages/run-pipeline-stages";
import type { ApiResult } from "@/schemas/api-result";
import {
  envisioningStageRequestSchema,
  type EnvisioningStageRequest,
} from "@/schemas/pipeline-stages";

type EnvisioningCreateResponse = {
  learnerFacingOntology: Awaited<
    ReturnType<typeof runEnvisioningStage>
  >["data"]["learnerFacingOntology"];
  nextStage: "attempts";
};

export async function POST(
  request: Request,
): Promise<NextResponse<ApiResult<EnvisioningCreateResponse>>> {
  try {
    const body = envisioningStageRequestSchema.parse(
      await request.json(),
    ) satisfies EnvisioningStageRequest;
    const stageResult = await runEnvisioningStage(body);

    return NextResponse.json({
      ok: true,
      data: {
        learnerFacingOntology: stageResult.data.learnerFacingOntology,
        nextStage: "attempts",
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Request does not match the envisioning create schema.",
            details: error.flatten(),
          },
        },
        { status: 400 },
      );
    }

    const mapped = mapPipelineError(error);

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "ENVISIONING_CREATE_FAILED",
          message: "An error occurred while creating envisioning tasks.",
          details: mapped.details,
        },
      },
      { status: mapped.status },
    );
  }
}
