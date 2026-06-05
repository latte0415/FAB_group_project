import { describe, expect, it } from "vitest";

import { hydratePipelineSessionFromPrepareResponse } from "@/lib/pipeline/pipeline-session";
import { envisioningDemoPipelineSnapshot } from "@/test/fixtures/envisioning-demo-pipeline-snapshot";

describe("envisioningDemoPipelineSnapshot fixture", () => {
  it("hydrates a demo pipeline session ready for envisioning", () => {
    const session = hydratePipelineSessionFromPrepareResponse(
      envisioningDemoPipelineSnapshot,
    );

    expect(session.sourceChunks.length).toBeGreaterThan(0);
    expect(session.nodeCandidates.length).toBeGreaterThan(0);
    expect(session.verifiedRelations.length).toBeGreaterThan(0);
    expect(session.benchmarkOntology).not.toBeNull();
    expect(session.learnerFacingOntology?.hiddenTasks.length).toBeGreaterThan(0);
    expect(envisioningDemoPipelineSnapshot.summary.llmValidationEnabled).toBe(false);
  });
});
