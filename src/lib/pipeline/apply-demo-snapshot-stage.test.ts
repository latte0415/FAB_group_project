import { describe, expect, it } from "vitest";

import { applyDemoSnapshotStep } from "@/lib/pipeline/apply-demo-snapshot-stage";
import { createEmptyPipelineSession } from "@/lib/pipeline/pipeline-session";
import { envisioningDemoPipelineSnapshot } from "@/test/fixtures/envisioning-demo-pipeline-snapshot";

describe("applyDemoSnapshotStep", () => {
  it("applies one pipeline step at a time from the demo snapshot", () => {
    let session = createEmptyPipelineSession();

    session = applyDemoSnapshotStep(session, envisioningDemoPipelineSnapshot, 0);
    expect(session.sourceChunks.length).toBeGreaterThan(0);
    expect(session.nodeCandidates).toHaveLength(0);

    session = applyDemoSnapshotStep(session, envisioningDemoPipelineSnapshot, 1);
    expect(session.nodeCandidates.length).toBeGreaterThan(0);
    expect(session.candidateRelations).toHaveLength(0);

    session = applyDemoSnapshotStep(session, envisioningDemoPipelineSnapshot, 5);
    expect(session.learnerFacingOntology?.hiddenTasks.length).toBeGreaterThan(0);
  });
});
