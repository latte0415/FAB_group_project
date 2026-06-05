import { NextResponse } from "next/server";

import { envisioningDemoCompletedPipelineStepCount } from "@/lib/config/demo-pipeline-config";
import type { ApiResult } from "@/schemas/api-result";
import type { BenchmarkOntologyPrepareResponse } from "@/schemas/benchmark-ontology";
import { envisioningDemoCourseNote } from "@/test/fixtures/envisioning-demo-course-note";
import { envisioningDemoPipelineSnapshot } from "@/test/fixtures/envisioning-demo-pipeline-snapshot";

type EnvisioningDemoCourseNoteResponse = {
  title: string;
  text: string;
  sourcePath: string;
  isDemoSnapshot: true;
  pipelineSnapshot: BenchmarkOntologyPrepareResponse;
  completedPipelineStepCount: number;
};

export async function GET(): Promise<
  NextResponse<ApiResult<EnvisioningDemoCourseNoteResponse>>
> {
  return NextResponse.json({
    ok: true,
    data: {
      ...envisioningDemoCourseNote,
      isDemoSnapshot: true,
      pipelineSnapshot: envisioningDemoPipelineSnapshot,
      completedPipelineStepCount: envisioningDemoCompletedPipelineStepCount,
    },
  });
}
