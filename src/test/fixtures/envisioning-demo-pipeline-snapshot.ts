import { benchmarkOntologyPrepareResponseSchema } from "@/schemas/benchmark-ontology";

import snapshotJson from "@/test/fixtures/envisioning-demo-pipeline-snapshot.json";

/**
 * Recorded fixture — deterministic pipeline output for envisioning demo course note.
 * Regenerate with: npx tsx src/test/scripts/generate-demo-pipeline-snapshot.ts
 */
export const envisioningDemoPipelineSnapshot =
  benchmarkOntologyPrepareResponseSchema.parse(snapshotJson);
