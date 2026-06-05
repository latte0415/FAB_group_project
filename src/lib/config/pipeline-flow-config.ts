export type PipelineFlowStep = {
  id: string;
  label: string;
  /** Stage API path. null for learner interaction steps */
  apiPath: string | null;
};

export const pipelineFlowSteps: PipelineFlowStep[] = [
  {
    id: "ingest",
    label: "Course note ingest",
    apiPath: "/api/pipeline/stages/ingest",
  },
  {
    id: "nodes",
    label: "Concept extraction",
    apiPath: "/api/pipeline/stages/nodes",
  },
  {
    id: "relations",
    label: "Relation extraction",
    apiPath: "/api/pipeline/stages/relations",
  },
  {
    id: "verify",
    label: "Evidence verification",
    apiPath: "/api/pipeline/stages/verify",
  },
  {
    id: "benchmark",
    label: "Benchmark ontology",
    apiPath: "/api/pipeline/stages/benchmark",
  },
  {
    id: "envisioning",
    label: "Envisioning task",
    apiPath: "/api/pipeline/stages/envisioning",
  },
  {
    id: "reconstruction",
    label: "Envisioning restoration",
    apiPath: null,
  },
  {
    id: "diagnosis",
    label: "Diagnosis",
    apiPath: null,
  },
];
