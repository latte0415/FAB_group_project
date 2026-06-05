import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { buildCourseNoteExcerptFromParagraphs } from "@/lib/config/course-note-excerpt-config";
import { prepareBenchmarkOntologyInput } from "@/pipeline/benchmark-ontology/prepare-benchmark-ontology";
import { envisioningDemoCourseNote } from "@/test/fixtures/envisioning-demo-course-note";

describe("extractRelationCandidates via prepareBenchmarkOntologyInput", () => {
  it("extracts supported and unsupported candidates from the envisioning demo note", async () => {
    const result = await prepareBenchmarkOntologyInput({
      courseNote: envisioningDemoCourseNote,
    });

    expect(result.candidateRelations.length).toBeGreaterThan(0);
    expect(result.verifiedRelations.length).toBeGreaterThanOrEqual(3);
    expect(result.candidateRelations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: "supported",
        }),
      ]),
    );
  });

  it("extracts relation candidates from the course-note excerpt", async () => {
    const excerptText = buildCourseNoteExcerptFromParagraphs(
      readFileSync("docs/course-note-full.txt", "utf-8"),
    );

    const result = await prepareBenchmarkOntologyInput({
      courseNote: {
        title: "Course note excerpt",
        text: excerptText,
      },
    });

    expect(result.candidateRelations.length).toBeGreaterThan(0);
    expect(result.verifiedRelations.length).toBeGreaterThan(0);
  });

  it("extracts relation candidates from the full course note", async () => {
    const result = await prepareBenchmarkOntologyInput({
      courseNote: {
        title: "Course note full",
        text: readFileSync("docs/course-note-full.txt", "utf-8"),
      },
    });

    expect(result.candidateRelations.length).toBeGreaterThan(0);
    expect(result.verifiedRelations.length).toBeGreaterThan(0);
  });
});
