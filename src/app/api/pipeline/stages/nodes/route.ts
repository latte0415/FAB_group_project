import {
  createStageRunner,
  handlePipelineStageRoute,
} from "@/lib/api/pipeline-stage-route";
import { runNodesStage } from "@/pipeline/stages/run-pipeline-stages";
import { nodesStageRequestSchema } from "@/schemas/pipeline-stages";

export async function POST(request: Request) {
  return handlePipelineStageRoute({
    request,
    requestSchema: nodesStageRequestSchema,
    validationMessage: "Request does not match the pipeline nodes stage schema.",
    failureCode: "PIPELINE_NODES_STAGE_FAILED",
    failureMessage: "An error occurred while running the pipeline nodes stage.",
    run: createStageRunner(nodesStageRequestSchema, runNodesStage),
  });
}
