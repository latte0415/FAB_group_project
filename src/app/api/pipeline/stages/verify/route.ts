import {
  createStageRunner,
  handlePipelineStageRoute,
} from "@/lib/api/pipeline-stage-route";
import { runVerifyStage } from "@/pipeline/stages/run-pipeline-stages";
import { verifyStageRequestSchema } from "@/schemas/pipeline-stages";

export async function POST(request: Request) {
  return handlePipelineStageRoute({
    request,
    requestSchema: verifyStageRequestSchema,
    validationMessage: "Request does not match the pipeline verify stage schema.",
    failureCode: "PIPELINE_VERIFY_STAGE_FAILED",
    failureMessage: "An error occurred while running the pipeline verify stage.",
    run: createStageRunner(verifyStageRequestSchema, runVerifyStage),
  });
}
