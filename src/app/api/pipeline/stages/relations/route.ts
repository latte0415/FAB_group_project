import {
  createStageRunner,
  handlePipelineStageRoute,
} from "@/lib/api/pipeline-stage-route";
import { runRelationsStage } from "@/pipeline/stages/run-pipeline-stages";
import { relationsStageRequestSchema } from "@/schemas/pipeline-stages";

export async function POST(request: Request) {
  return handlePipelineStageRoute({
    request,
    requestSchema: relationsStageRequestSchema,
    validationMessage: "Request does not match the pipeline relations stage schema.",
    failureCode: "PIPELINE_RELATIONS_STAGE_FAILED",
    failureMessage: "An error occurred while running the pipeline relations stage.",
    run: createStageRunner(relationsStageRequestSchema, runRelationsStage),
  });
}
