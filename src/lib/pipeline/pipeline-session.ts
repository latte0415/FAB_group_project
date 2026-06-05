import type {
  BenchmarkOntologyGraph,
  BenchmarkOntologyPrepareResponse,
  LearnerFacingOntology,
  NodeCandidate,
  OntologyRelation,
  PipelineStage,
  RelationCandidate,
  RelationType,
  SourceChunk,
} from "@/schemas/benchmark-ontology";
import type {
  ingestStageDataSchema,
  nodesStageDataSchema,
  relationsStageDataSchema,
  verifyStageDataSchema,
  benchmarkStageDataSchema,
  envisioningStageDataSchema,
} from "@/schemas/pipeline-stages";
import type { z } from "zod";

type IngestData = z.infer<typeof ingestStageDataSchema>;
type NodesData = z.infer<typeof nodesStageDataSchema>;
type RelationsData = z.infer<typeof relationsStageDataSchema>;
type VerifyData = z.infer<typeof verifyStageDataSchema>;
type BenchmarkData = z.infer<typeof benchmarkStageDataSchema>;
type EnvisioningData = z.infer<typeof envisioningStageDataSchema>;

export type PipelineSession = {
  sourceChunks: SourceChunk[];
  relationTypes: RelationType[];
  nodeCandidates: NodeCandidate[];
  candidateRelations: RelationCandidate[];
  verifiedRelations: OntologyRelation[];
  benchmarkOntology: BenchmarkOntologyGraph | null;
  learnerFacingOntology: LearnerFacingOntology | null;
  stages: PipelineStage[];
  summary: {
    sourceTitle?: string;
    chunkCount: number;
    relationTypeCount: number;
    nodeCandidateCount: number;
    relationCandidateCount: number;
    verifiedRelationCount: number;
    hiddenRelationCount: number;
  };
};

export function createEmptyPipelineSession(): PipelineSession {
  return {
    sourceChunks: [],
    relationTypes: [],
    nodeCandidates: [],
    candidateRelations: [],
    verifiedRelations: [],
    benchmarkOntology: null,
    learnerFacingOntology: null,
    stages: [],
    summary: {
      chunkCount: 0,
      relationTypeCount: 0,
      nodeCandidateCount: 0,
      relationCandidateCount: 0,
      verifiedRelationCount: 0,
      hiddenRelationCount: 0,
    },
  };
}

function appendStage(
  session: PipelineSession,
  stage: PipelineStage,
): PipelineSession {
  return {
    ...session,
    stages: [...session.stages, stage],
  };
}

export function applyIngestStage(
  session: PipelineSession,
  stage: PipelineStage,
  data: IngestData,
): PipelineSession {
  return appendStage(
    {
      ...session,
      sourceChunks: data.sourceChunks,
      relationTypes: data.relationTypes,
      summary: {
        ...session.summary,
        sourceTitle: data.summary.sourceTitle,
        chunkCount: data.summary.chunkCount,
        relationTypeCount: data.summary.relationTypeCount,
      },
    },
    stage,
  );
}

export function applyNodesStage(
  session: PipelineSession,
  stage: PipelineStage,
  data: NodesData,
): PipelineSession {
  return appendStage(
    {
      ...session,
      nodeCandidates: data.nodeCandidates,
      summary: {
        ...session.summary,
        nodeCandidateCount: data.summary.nodeCandidateCount,
      },
    },
    stage,
  );
}

export function applyRelationsStage(
  session: PipelineSession,
  stage: PipelineStage,
  data: RelationsData,
): PipelineSession {
  return appendStage(
    {
      ...session,
      candidateRelations: data.candidateRelations,
      summary: {
        ...session.summary,
        relationCandidateCount: data.summary.relationCandidateCount,
      },
    },
    stage,
  );
}

export function applyVerifyStage(
  session: PipelineSession,
  stage: PipelineStage,
  data: VerifyData,
): PipelineSession {
  return appendStage(
    {
      ...session,
      verifiedRelations: data.verifiedRelations,
      summary: {
        ...session.summary,
        verifiedRelationCount: data.summary.verifiedRelationCount,
      },
    },
    stage,
  );
}

export function applyBenchmarkStage(
  session: PipelineSession,
  stage: PipelineStage,
  data: BenchmarkData,
): PipelineSession {
  return appendStage(
    {
      ...session,
      benchmarkOntology: data.benchmarkOntology,
    },
    stage,
  );
}

export function applyEnvisioningStage(
  session: PipelineSession,
  stage: PipelineStage,
  data: EnvisioningData,
): PipelineSession {
  return appendStage(
    {
      ...session,
      learnerFacingOntology: data.learnerFacingOntology,
      summary: {
        ...session.summary,
        hiddenRelationCount: data.summary.hiddenRelationCount,
      },
    },
    stage,
  );
}

export function resetSessionFromStep(
  session: PipelineSession,
  fromStepIndex: number,
): PipelineSession {
  if (fromStepIndex <= 0) {
    return createEmptyPipelineSession();
  }

  const next = createEmptyPipelineSession();

  next.sourceChunks = session.sourceChunks;
  next.relationTypes = session.relationTypes;
  next.summary.sourceTitle = session.summary.sourceTitle;
  next.summary.chunkCount = session.summary.chunkCount;
  next.summary.relationTypeCount = session.summary.relationTypeCount;
  next.stages = session.stages.slice(0, 1);

  if (fromStepIndex <= 1) {
    return next;
  }

  next.nodeCandidates = session.nodeCandidates;
  next.summary.nodeCandidateCount = session.summary.nodeCandidateCount;
  next.stages = session.stages.slice(0, 2);

  if (fromStepIndex <= 2) {
    return next;
  }

  next.candidateRelations = session.candidateRelations;
  next.summary.relationCandidateCount = session.summary.relationCandidateCount;
  next.stages = session.stages.slice(0, 3);

  if (fromStepIndex <= 3) {
    return next;
  }

  next.verifiedRelations = session.verifiedRelations;
  next.summary.verifiedRelationCount = session.summary.verifiedRelationCount;
  next.stages = session.stages.slice(0, 4);

  if (fromStepIndex <= 4) {
    return next;
  }

  next.benchmarkOntology = session.benchmarkOntology;
  next.stages = session.stages.slice(0, 5);

  if (fromStepIndex <= 5) {
    return next;
  }

  next.learnerFacingOntology = session.learnerFacingOntology;
  next.summary.hiddenRelationCount = session.summary.hiddenRelationCount;
  next.stages = session.stages.slice(0, 6);

  return next;
}

export function hydratePipelineSessionFromPrepareResponse(
  response: BenchmarkOntologyPrepareResponse,
): PipelineSession {
  return {
    sourceChunks: response.sourceChunks,
    relationTypes: response.relationTypes,
    nodeCandidates: response.nodeCandidates,
    candidateRelations: response.candidateRelations,
    verifiedRelations: response.verifiedRelations,
    benchmarkOntology: response.benchmarkOntology,
    learnerFacingOntology: response.learnerFacingOntology,
    stages: response.stages,
    summary: response.summary,
  };
}

export function toPrepareResponse(
  session: PipelineSession,
): BenchmarkOntologyPrepareResponse | null {
  if (!session.benchmarkOntology || !session.learnerFacingOntology) {
    return null;
  }

  return {
    sourceChunks: session.sourceChunks,
    relationTypes: session.relationTypes,
    nodeCandidates: session.nodeCandidates,
    candidateRelations: session.candidateRelations,
    verifiedRelations: session.verifiedRelations,
    benchmarkOntology: session.benchmarkOntology,
    learnerFacingOntology: session.learnerFacingOntology,
    stages: session.stages,
    summary: session.summary,
  };
}
