export type PipelineFlowStep = {
  id: string;
  label: string;
  description: string;
  /** Pipeline execution stage index. null for UI-only or learner interaction steps. */
  pipelineStageIndex: number | null;
  /** Stage API path. null for learner interaction steps */
  apiPath: string | null;
};

export const pipelineFlowSteps: PipelineFlowStep[] = [
  {
    id: "project-overview",
    label: "Project Overview",
    description: "Review the learning goal and how evidence-backed relations structure the workflow.",
    pipelineStageIndex: null,
    apiPath: null,
  },
  {
    id: "ingest",
    label: "Course note ingest",
    description: "Load a course note and split it into traceable source chunks.",
    pipelineStageIndex: 0,
    apiPath: "/api/pipeline/stages/ingest",
  },
  {
    id: "nodes",
    label: "Concept extraction",
    description: "Extract candidate concepts from the prepared source chunks.",
    pipelineStageIndex: 1,
    apiPath: "/api/pipeline/stages/nodes",
  },
  {
    id: "relation-taxonomy",
    label: "Relation taxonomy",
    description: "Review the allowed relation types before extracting constrained relations.",
    pipelineStageIndex: null,
    apiPath: null,
  },
  {
    id: "relations",
    label: "Relation extraction",
    description: "Propose constrained relations between candidate concepts with cited evidence.",
    pipelineStageIndex: 2,
    apiPath: "/api/pipeline/stages/relations",
  },
  {
    id: "verify",
    label: "Evidence verification",
    description: "Keep only relations whose evidence satisfies the verification contract.",
    pipelineStageIndex: 3,
    apiPath: "/api/pipeline/stages/verify",
  },
  {
    id: "benchmark",
    label: "Benchmark ontology",
    description: "Build the benchmark graph from verified, evidence-backed relations.",
    pipelineStageIndex: 4,
    apiPath: "/api/pipeline/stages/benchmark",
  },
  {
    id: "envisioning",
    label: "Envisioning task",
    description: "Mask selected benchmark relations to create restoration tasks.",
    pipelineStageIndex: 5,
    apiPath: "/api/pipeline/stages/envisioning",
  },
  {
    id: "reconstruction",
    label: "Envisioning restoration",
    description: "Restore hidden relations by reasoning from the visible graph and evidence.",
    pipelineStageIndex: null,
    apiPath: null,
  },
  {
    id: "edge-quiz-selection",
    label: "Quiz edge selection",
    description: "Select verified relations that will anchor the quiz questions.",
    pipelineStageIndex: null,
    apiPath: null,
  },
  {
    id: "edge-quiz-debugging",
    label: "Quiz + debug loop",
    description: "Answer edge questions and use evidence-based feedback across three rounds.",
    pipelineStageIndex: null,
    apiPath: null,
  },
  {
    id: "diagnosis",
    label: "Relation misunderstanding summary",
    description: "Summarize which relation types or concept links need revision after restoration and quiz attempts.",
    pipelineStageIndex: null,
    apiPath: null,
  },
];
