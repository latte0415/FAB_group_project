import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { prepareBenchmarkOntologyInput } from "@/pipeline/benchmark-ontology/prepare-benchmark-ontology";
import type { ApiResult } from "@/schemas/api-result";
import type { BenchmarkOntologyPrepareResponse } from "@/schemas/benchmark-ontology";

export async function POST(
  request: Request,
): Promise<NextResponse<ApiResult<BenchmarkOntologyPrepareResponse>>> {
  try {
    const body = await request.json();
    const data = prepareBenchmarkOntologyInput(body);

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "요청 형식이 Benchmark ontology 준비 단계 schema와 맞지 않습니다.",
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
          code: "PREPARE_BENCHMARK_ONTOLOGY_FAILED",
          message: "Benchmark ontology 준비 단계에서 오류가 발생했습니다.",
        },
      },
      { status: 500 },
    );
  }
}
