import {
  createStageRunner,
  handlePipelineStageRoute,
} from "@/lib/api/pipeline-stage-route";
import { runBenchmarkStage } from "@/pipeline/stages/run-pipeline-stages";
import { benchmarkStageRequestSchema } from "@/schemas/pipeline-stages";

export async function POST(request: Request) {
  return handlePipelineStageRoute({
    request,
    requestSchema: benchmarkStageRequestSchema,
    validationMessage: "Request does not match the pipeline benchmark stage schema.",
    failureCode: "PIPELINE_BENCHMARK_STAGE_FAILED",
    failureMessage: "An error occurred while running the pipeline benchmark stage.",
    run: createStageRunner(benchmarkStageRequestSchema, runBenchmarkStage),
  });
}
