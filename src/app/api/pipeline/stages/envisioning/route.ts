import {
  createStageRunner,
  handlePipelineStageRoute,
} from "@/lib/api/pipeline-stage-route";
import { runEnvisioningStage } from "@/pipeline/stages/run-pipeline-stages";
import { envisioningStageRequestSchema } from "@/schemas/pipeline-stages";

export async function POST(request: Request) {
  return handlePipelineStageRoute({
    request,
    requestSchema: envisioningStageRequestSchema,
    validationMessage: "Request does not match the pipeline envisioning stage schema.",
    failureCode: "PIPELINE_ENVISIONING_STAGE_FAILED",
    failureMessage: "An error occurred while running the pipeline envisioning stage.",
    run: createStageRunner(envisioningStageRequestSchema, runEnvisioningStage),
  });
}
