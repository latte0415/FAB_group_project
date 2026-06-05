import {
  createStageRunner,
  handlePipelineStageRoute,
} from "@/lib/api/pipeline-stage-route";
import { runIngestStage } from "@/pipeline/stages/run-pipeline-stages";
import { ingestStageRequestSchema } from "@/schemas/pipeline-stages";

export async function POST(request: Request) {
  return handlePipelineStageRoute({
    request,
    requestSchema: ingestStageRequestSchema,
    validationMessage: "Request does not match the pipeline ingest stage schema.",
    failureCode: "PIPELINE_INGEST_STAGE_FAILED",
    failureMessage: "An error occurred while running the pipeline ingest stage.",
    run: createStageRunner(ingestStageRequestSchema, runIngestStage),
  });
}
