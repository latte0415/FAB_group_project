import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { mapPipelineError, runBenchmarkOntologyPipeline } from "@/lib/llm/pipeline-api";
import type { ApiResult } from "@/schemas/api-result";
import type { BenchmarkOntologyPrepareResponse } from "@/schemas/benchmark-ontology";

export async function POST(
  request: Request,
): Promise<NextResponse<ApiResult<BenchmarkOntologyPrepareResponse>>> {
  try {
    const body = await request.json();
    const data = await runBenchmarkOntologyPipeline(body);

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Request does not match the benchmark ontology prepare schema.",
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
          code: mapped.code,
          message: mapped.message,
          details: mapped.details,
        },
      },
      { status: mapped.status },
    );
  }
}
