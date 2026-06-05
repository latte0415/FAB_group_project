import { writeFileSync } from "node:fs";
import path from "node:path";

import { envisioningDemoPipelineSnapshotPath } from "@/lib/config/demo-pipeline-config";
import { prepareBenchmarkOntologyInput } from "@/pipeline/benchmark-ontology/prepare-benchmark-ontology";
import { envisioningDemoCourseNote } from "@/test/fixtures/envisioning-demo-course-note";

async function main() {
  const result = await prepareBenchmarkOntologyInput(
    {
      courseNote: envisioningDemoCourseNote,
      enableLlmValidation: false,
    },
    { llmClient: null },
  );

  const outputPath = path.join(process.cwd(), envisioningDemoPipelineSnapshotPath);
  writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf-8");

  console.log("Wrote", outputPath);
  console.log(
    "nodeCandidates",
    result.nodeCandidates.length,
    "verifiedRelations",
    result.verifiedRelations.length,
    "hiddenTasks",
    result.summary.hiddenRelationCount,
  );
}

main();
