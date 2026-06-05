# 소프트웨어 요구사항 명세서

## 1. 제품 개요

### 1.1 제품명
Qualitative Ontology Reconstruction Learning System

### 1.2 목적
이 시스템은 학습자가 강의 노트로부터 온톨로지를 재구성하면서 first-principles understanding을 형성하도록 돕는 학습 시스템이다. 시스템은 실행 가능한 엔진과 파이프라인을 통해 evidence 기반 benchmark ontology를 생성하고, 일부 관계를 숨긴 뒤 학습자가 이를 복원하도록 한다. 학습자가 틀린 관계를 제안하면 단순히 정답을 알려주는 대신 원문 evidence를 제공하여 qualitative self-debugging을 유도한다. 마지막으로 relation 기반 퀴즈를 통해 학습자의 first-principle 이해 상태를 검증한다.

### 1.3 핵심 목표 상태
학습자는 다음 상태에 도달해야 한다.

- 강의 자료로부터 first-principles understanding을 형성할 수 있다.
- 보이지 않는 qualitative relationship을 추론할 수 있다.
- 원문 evidence를 바탕으로 자신의 잘못된 개념 관계를 수정할 수 있다.
- 단순 암기가 아니라 qualitative reasoning을 수행할 수 있다.

### 1.4 범위
웹페이지는 한 페이지 안에 다음 두 영역을 함께 제공해야 한다.

- 작동 패널: 강의 노트 입력, relation constraint 설정, 파이프라인 실행, 누락 관계 복원, validation quiz 응답을 수행하는 영역
- 시각화 패널: 파이프라인 상태, ontology graph, hidden relation, evidence, 학습자 시도, debugging 흐름, validation 결과를 보여주는 영역

## 2. 이해관계자

- 학습자: 누락된 ontology relation을 복원하고 evidence 기반 debugging을 수행한다.
- 교수자 또는 연구자: course note, relation list를 준비하고 시스템이 first-principles understanding을 돕는지 관찰한다.
- 시스템 운영자: LLM provider, relation taxonomy, 저장소, 배포 환경을 설정한다.

## 3. 전체 작동 흐름

1. Course note ingestion
2. 사전 정의된 heuristic 기반 concept extraction
3. 사전 정의된 relation type만 사용하는 evidence-grounded relation extraction
4. Evidence verification
5. Benchmark ontology generation
6. 중요 relation을 숨긴 envisioning task generation
7. 학습자의 relation reconstruction
8. Source sentence와 page 또는 section 정보를 활용한 qualitative debugging
9. Relation 기반 quiz generation을 통한 first-principle validation
10. 단순 점수가 아니라 misunderstood relation 중심의 결과 요약

## 4. 기능 요구사항

### 4.1 Course Note Ingestion
- 시스템은 course note 텍스트 입력을 받을 수 있어야 한다.
- 이후 버전에서는 PDF 또는 문서 업로드를 지원할 수 있어야 한다.
- 시스템은 입력 자료를 source sentence, page, section 등 추적 가능한 단위로 분리해야 한다.
- Ontology 생성에 사용된 모든 evidence sentence를 보존해야 한다.

### 4.2 Relation Taxonomy 설정
- 시스템은 extraction 전에 사전 정의된 relation type 목록을 불러올 수 있어야 한다.
- Ontology generator는 설정된 relation type 이외의 관계를 생성할 수 없어야 한다.
- 각 relation type은 이름, 설명, argument pattern, 예시를 포함해야 한다.

### 4.3 Node Candidate 생성
- 시스템은 LLM의 자유 선택이 아니라 사전 정의된 heuristic을 통해 concept candidate를 생성해야 한다.
- 지원 heuristic은 section heading, index-like structure, term frequency, relation argument에 등장한 concept 등을 포함해야 한다.
- 선택된 node와 선택 근거를 시각화 패널에서 확인할 수 있어야 한다.

### 4.4 Evidence-Grounded Relation Extraction
- 시스템은 course note의 evidence에서만 candidate relation을 추출해야 한다.
- 모든 relation은 source sentence, source location, confidence, extraction rationale을 가져야 한다.
- Evidence가 충분하지 않은 relation은 unsupported로 표시해야 한다.
- LLM의 일반 지식이나 추측만으로 relation을 추가해서는 안 된다.

### 4.5 Benchmark Ontology 생성
- 시스템은 검증된 node와 relation으로 benchmark ontology graph를 생성해야 한다.
- 사용자는 각 node와 edge의 evidence를 inspection할 수 있어야 한다.
- 사용자는 relation type, confidence, evidence status 기준으로 graph를 필터링할 수 있어야 한다.

### 4.6 Envisioning Task 생성
- 시스템은 benchmark ontology 중 일부 relation을 숨긴 learner-facing ontology를 생성해야 한다.
- Hidden relation은 중요도, relation type, graph connectivity, 교수자 설정 중 하나 이상의 기준으로 선택되어야 한다.
- 학습자는 source node, target node, relation type, optional explanation을 선택하여 누락 관계를 제안할 수 있어야 한다.

### 4.7 Qualitative Debugging
- 학습자가 틀린 relation을 제안하면 시스템은 정답을 바로 대체하지 않고 관련 benchmark evidence를 보여주어야 한다.
- 시스템은 학습자가 어떤 relation 또는 concept dependency를 잘못 이해했는지 찾도록 도와야 한다.
- 학습자는 relation을 재구성하거나 reveal을 선택할 때까지 반복적으로 수정할 수 있어야 한다.

### 4.8 First-Principle Validation
- 시스템은 verified ontology relation을 기반으로 quiz question을 생성해야 한다.
- 정답 선지는 검증된 relation에서만 함의되어야 한다.
- 오답 선지는 ontology 내부의 틀린 relation, mismatched relation, 또는 잘못 연결된 concept pair를 활용해 생성해야 한다.
- 시스템은 quiz answer의 오류를 misunderstood relation type 또는 concept pair로 매핑해야 한다.
- 결과는 숫자 점수보다 qualitative diagnosis를 우선해야 한다.

### 4.9 시각화 패널
- 시스템은 pipeline stage를 live process timeline으로 표시해야 한다.
- 시스템은 ontology를 interactive graph로 표시해야 한다.
- Verified, hidden, learner-proposed, correct, incorrect, unsupported relation은 시각적으로 구분되어야 한다.
- Relation을 선택하면 evidence detail을 보여주어야 한다.
- Envisioning, debugging, validation 전반의 학습자 진행 상태를 보여주어야 한다.

### 4.10 작동 패널
- 시스템은 course note 입력, relation list 입력, pipeline 실행, hidden relation 생성, learner attempt, debugging, quiz validation을 위한 control을 제공해야 한다.
- 작동 패널과 시각화 패널은 같은 페이지에 위치해야 한다.
- 시스템은 reset, rerun, export 기능을 제공해야 한다.

### 4.11 Export
- 시스템은 생성된 ontology를 JSON으로 export할 수 있어야 한다.
- 시스템은 학습자 결과 요약을 JSON 또는 Markdown으로 export할 수 있어야 한다.
- 시스템은 프로젝트 발표 영상에 사용할 수 있는 짧은 demo trace를 export할 수 있어야 한다.

## 5. 비기능 요구사항

### 5.1 신뢰성
- 시스템은 evidence가 없는 benchmark relation을 표시해서는 안 된다.
- Unsupported relation은 명확히 구분되어야 한다.
- 가능한 범위에서 deterministic output을 유지하기 위해 prompt, model parameter, relation taxonomy, source chunk를 저장해야 한다.

### 5.2 사용성
- 단일 페이지 UI는 route 이동 없이 engine state를 관찰할 수 있어야 한다.
- Demo ontology 수준의 graph와 pipeline은 읽기 쉬워야 한다.
- 사용자 action은 즉각적인 visual feedback을 제공해야 한다.

### 5.3 성능
- Demo 크기의 course note에 대해 external LLM 사용 시 전체 pipeline은 30초 이내에 완료되는 것을 목표로 한다.
- 최소 100개 node와 300개 edge까지 graph interaction이 부드러워야 한다.

### 5.4 설명 가능성
- 생성된 node, relation, hidden task, debug message, quiz question은 source evidence 또는 ontology relation으로 추적 가능해야 한다.
- Evidence-backed extraction과 LLM-generated wording은 명확히 분리되어야 한다.

### 5.5 보안
- API key는 browser에 노출되어서는 안 된다.
- 업로드되거나 붙여넣은 course note는 server-side에서 처리되어야 한다.
- 사용자 입력, model prompt, generated output의 경계가 명확해야 한다.

## 6. 데이터 모델

### 6.1 SourceChunk
- id
- text
- pageNumber 또는 sectionId
- sentenceIndex
- sourceTitle

### 6.2 RelationType
- id
- name
- description
- argumentPattern
- examples

### 6.3 ConceptNode
- id
- label
- aliases
- sourceChunkIds
- selectionRationale

### 6.4 OntologyRelation
- id
- sourceNodeId
- targetNodeId
- relationTypeId
- evidenceChunkId
- evidenceText
- confidence
- status: verified, unsupported, hidden, learner_proposed, correct, incorrect

### 6.5 LearnerAttempt
- id
- hiddenRelationId
- proposedSourceNodeId
- proposedTargetNodeId
- proposedRelationTypeId
- explanation
- result
- debugEvidence

### 6.6 QuizQuestion
- id
- sourceRelationId
- prompt
- choices
- correctChoiceId
- distractorRelationIds
- learnerAnswerId
- diagnosis

## 7. 엔진 및 파이프라인 아키텍처

### 7.1 Pipeline Module
- sourceParser: course note 입력을 추적 가능한 chunk로 변환한다.
- nodeCandidateGenerator: 사전 정의된 heuristic으로 concept node를 식별한다.
- relationExtractor: 사전 정의된 relation type과 source evidence에 의해 constraint된 LLM extraction을 수행한다.
- evidenceVerifier: unsupported relation을 거부하거나 표시하고 evidence metadata를 연결한다.
- ontologyBuilder: benchmark graph를 생성한다.
- taskMasker: envisioning을 위해 benchmark relation 일부를 숨긴다.
- attemptEvaluator: 학습자의 relation proposal을 benchmark relation과 비교한다.
- debugGenerator: evidence 기반 qualitative debugging prompt를 생성한다.
- quizGenerator: relation-grounded multiple-choice validation question을 생성한다.
- diagnosisGenerator: reconstruction mistake와 quiz mistake를 relation-level misunderstanding으로 매핑한다.

### 7.2 LLM 사용 규칙
LLM은 extraction wording, candidate relation proposal, quiz phrasing, debugging guidance에 사용할 수 있다. 그러나 LLM은 main reasoning authority로 취급되어서는 안 된다. Accepted relation은 반드시 predefined relation type에 속해야 하고 source evidence로 support되어야 한다.

## 8. 권장 기술 스택

### 8.1 Frontend
- Next.js App Router
- TypeScript
- React
- Tailwind CSS
- shadcn/ui: 작동 패널의 form, tab, button, dialog, select 등
- React Flow: ontology graph visualization
- Framer Motion: pipeline state transition

### 8.2 Backend
- Next.js Route Handlers
- API와 UI가 공유할 수 있는 TypeScript pipeline module
- Zod: node, relation, quiz question, LLM output schema validation
- OpenAI API 또는 compatible LLM provider: constrained extraction, quiz/debug generation

### 8.3 Storage
- SQLite + Prisma: local demo 및 reproducible project run
- Supabase Postgres: multi-user deployment가 필요한 경우의 확장 옵션

### 8.4 Document Processing
- MVP: pasted plain text course note
- 이후 버전: pdf-parse 또는 document parser를 활용한 PDF parsing
- Source metadata는 SourceChunk record로 normalize해야 한다.

### 8.5 Visualization
- React Flow: node와 edge graph 표현
- D3 utility: custom graph metric 또는 layout이 필요할 때만 사용
- Zustand: local UI state 및 pipeline run state 관리

### 8.6 Testing
- Vitest: pipeline unit test
- Playwright: end-to-end browser test
- Mock LLM fixture: deterministic test

### 8.7 Deployment
- Vercel
- LLM key는 environment variable로 관리
- Persistent multi-user data가 필요하면 Supabase 연동

## 9. MVP 정의

MVP는 다음을 포함해야 한다.

- 작동 패널과 시각화 패널이 함께 있는 one-page web interface
- Pasted course-note input
- Editable predefined relation list
- 실행 가능한 benchmark ontology generation pipeline
- Evidence-backed edge를 가진 graph visualization
- Envisioning을 위한 relation hiding
- Learner relation reconstruction
- Evidence-based qualitative debugging
- Relation-grounded multiple-choice quiz generation
- Qualitative result summary

## 10. 권장 페이지 구성

- Left panel: input, relation taxonomy, run controls, learner reconstruction form, quiz controls
- Center panel: selectable node와 relation을 가진 ontology graph
- Right panel: pipeline timeline, selected evidence, debugging message, validation diagnosis

## 11. 주요 API Endpoint

- POST /api/pipeline/run
- POST /api/envisioning/create
- POST /api/attempts/evaluate
- POST /api/debugging/generate
- POST /api/quiz/generate
- POST /api/quiz/evaluate
- GET /api/runs/:id
- GET /api/ontology/:id

## 12. 인수 기준

- 사용자는 course-note text를 붙여넣고 전체 pipeline을 실행할 수 있다.
- 생성된 ontology는 evidence 없는 relation을 포함하지 않는다.
- Graph는 verified relation과 hidden relation을 구분하여 표시한다.
- 학습자는 missing relation을 제안하고 evidence-based debugging을 받을 수 있다.
- Ontology relation으로부터 quiz를 생성할 수 있다.
- Quiz 결과는 학습자가 잘못 이해한 concept relation을 식별한다.
- 페이지 전환 없이 프로젝트 demo 전체 흐름을 보여줄 수 있다.
