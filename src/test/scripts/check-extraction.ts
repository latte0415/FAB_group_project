import { readFileSync } from "node:fs";

import { buildCourseNoteExcerptFromParagraphs } from "@/lib/config/course-note-excerpt-config";
import { prepareBenchmarkOntologyInput } from "@/pipeline/benchmark-ontology/prepare-benchmark-ontology";
import { envisioningDemoCourseNote } from "@/test/fixtures/envisioning-demo-course-note";

const sources = [
  [
    "sample",
    "1 Representation:\nKRR uses constraints. Constraints organize concepts.\n\n2 Reasoning:\nReasoning depends on representations. Constraint networks support reasoning.",
  ],
  ["demo", envisioningDemoCourseNote.text],
  [
    "excerpt",
    buildCourseNoteExcerptFromParagraphs(
      readFileSync("docs/course-note-full.txt", "utf-8"),
    ),
  ],
  ["full", readFileSync("docs/course-note-full.txt", "utf-8")],
] as const;

for (const [label, text] of sources) {
  const result = await prepareBenchmarkOntologyInput({
    courseNote: { title: label, text },
  });
  const supported = result.candidateRelations.filter(
    (candidate) => candidate.status === "supported",
  ).length;
  const unsupported = result.candidateRelations.filter(
    (candidate) => candidate.status === "unsupported",
  ).length;

  console.log(
    label,
    "nodes",
    result.nodeCandidates.length,
    "candidates",
    result.candidateRelations.length,
    `supported=${supported}`,
    `unsupported=${unsupported}`,
    "verified",
    result.verifiedRelations.length,
  );
}
