import { getDefaultRelationTypes } from "@/domain/ontology/relation-taxonomy";
import { chunkCourseNote } from "@/pipeline/source-parser/chunk-course-note";
import {
  benchmarkOntologyPrepareRequestSchema,
  benchmarkOntologyPrepareResponseSchema,
  type BenchmarkOntologyPrepareRequest,
  type BenchmarkOntologyPrepareResponse,
} from "@/schemas/benchmark-ontology";

export function prepareBenchmarkOntologyInput(
  input: BenchmarkOntologyPrepareRequest,
): BenchmarkOntologyPrepareResponse {
  const request = benchmarkOntologyPrepareRequestSchema.parse(input);
  const relationTypes = request.relationTypes ?? getDefaultRelationTypes();
  const sourceChunks = chunkCourseNote({
    text: request.courseNote.text,
    title: request.courseNote.title,
  });

  return benchmarkOntologyPrepareResponseSchema.parse({
    sourceChunks,
    relationTypes,
    summary: {
      sourceTitle: request.courseNote.title,
      chunkCount: sourceChunks.length,
      relationTypeCount: relationTypes.length,
    },
  });
}
