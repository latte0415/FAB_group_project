# AGENTS.md

## 프로젝트 원칙

이 프로젝트는 학습자가 강의 노트에서 ontology relation을 복원하면서 first-principles understanding을 형성하도록 돕는 시스템이다. 구현의 중심은 "LLM이 답을 만들어내는 앱"이 아니라 "evidence와 relation constraint를 통해 학습 과정을 구조화하는 엔진"이어야 한다.

모든 구현은 다음 원칙을 따른다.

- Evidence 없는 benchmark relation은 생성하거나 표시하지 않는다.
- LLM output은 신뢰 경계 밖의 데이터로 취급하고, schema validation과 evidence verification을 통과한 뒤에만 domain object로 승격한다.
- Relation type, prompt, quiz rule, masking rule, scoring rule은 코드 곳곳에 하드코딩하지 않는다.
- UI는 pipeline state를 보여주는 표현 계층이며, domain decision을 직접 수행하지 않는다.
- 테스트는 LLM 호출 결과가 아니라 pipeline contract와 domain invariant를 검증한다.

## 구현 진행 방식

전체 시스템은 SRS의 "전체 작동 흐름"을 기준으로 한 단계씩 구현한다. 각 단계는 사용자가 확인한 뒤 다음 단계로 넘어간다.

현재 진행 원칙:

- 사용자가 명시적으로 요청하지 않은 pipeline stage를 앞서 구현하지 않는다.
- 서버 기본 세팅 이후에는 `Benchmark ontology 생성` 단계부터 진행하되, 내부 sub-step은 사용자 확인을 받아 순서대로 구현한다.
- 각 단계는 "요구사항 확인 -> 최소 구현 -> 테스트/검증 -> 사용자 확인" 순서로 완료한다.
- 다음 단계의 임시 데이터가 필요하면 fixture 또는 mock으로 두고, 실제 domain logic처럼 보이게 숨기지 않는다.
- 데모 편의를 위한 임시 구현은 파일명, 주석, 상태값에 명확히 `mock`, `fixture`, `placeholder`를 표시한다.

## 권장 디렉터리 구조

구현 시 다음 레이어를 유지한다.

```text
src/
  app/
    api/
    page.tsx
  components/
    operation-panel/
    visualization-panel/
    shared/
  domain/
    ontology/
    learning/
    quiz/
  pipeline/
    source-parser/
    node-candidates/
    relation-extraction/
    evidence-verification/
    ontology-builder/
    task-masker/
    attempt-evaluator/
    debug-generator/
    quiz-generator/
    diagnosis-generator/
  lib/
    llm/
    persistence/
    config/
    errors/
  schemas/
  test/
    fixtures/
    mocks/
```

## 레이어 규칙

### UI Layer
- `components/`와 `app/page.tsx`는 사용자 입력, 화면 상태, visualization만 담당한다.
- UI 컴포넌트에서 relation 정답 판정, evidence 검증, quiz 채점 로직을 구현하지 않는다.
- UI는 domain object를 직접 조작하지 않고 API 또는 pipeline facade를 통해 변경한다.
- Graph color, label, edge style 같은 visual mapping은 별도 mapping module로 분리한다.

### API Layer
- `app/api/`는 request validation, pipeline 호출, response shaping만 담당한다.
- API route 안에 extraction prompt, graph algorithm, quiz generation logic을 직접 작성하지 않는다.
- 모든 request body와 response body는 Zod schema로 검증한다.
- API error는 사용자에게 보여줄 message와 내부 debug detail을 분리한다.

### Domain Layer
- `domain/`은 순수한 타입, invariant, 판정 규칙을 담는다.
- Domain function은 가능한 한 pure function으로 작성한다.
- Domain layer는 React, Next.js, database client, LLM SDK에 의존하지 않는다.
- Benchmark relation은 반드시 `relationTypeId`, `sourceNodeId`, `targetNodeId`, `evidenceChunkId`를 가져야 한다.

### Pipeline Layer
- `pipeline/`은 source parsing부터 diagnosis까지의 실행 단계를 담당한다.
- 각 단계는 입력 schema와 출력 schema를 명확히 가진다.
- Pipeline stage는 stage name, status, startedAt, finishedAt, warnings, errors를 기록한다.
- 한 stage의 실패가 전체 실행을 중단해야 하는지, partial result로 진행 가능한지 명시한다.

### LLM Adapter Layer
- LLM SDK 호출은 `lib/llm/` 내부에만 둔다.
- Prompt template은 파일 또는 config module로 분리하고, route/component 안에 inline으로 두지 않는다.
- LLM response는 반드시 Zod schema로 parse한다.
- Parse 실패, unsupported relation, insufficient evidence는 정상적인 실패 모드로 처리한다.
- LLM은 relation을 "제안"할 수 있지만 relation을 "검증"할 수 있는 유일한 근거가 되어서는 안 된다.

### Persistence Layer
- Database 접근은 `lib/persistence/` 또는 repository module을 통해 수행한다.
- Component, domain, pipeline stage에서 Prisma client를 직접 import하지 않는다.
- 저장되는 pipeline run은 source chunks, relation taxonomy, prompt version, model name, model parameters를 포함해야 재현 가능하다.

## 하드코딩 방지 원칙

다음 항목은 코드에 직접 박아 넣지 않는다.

- Relation type 목록
- Prompt template 전문
- Hidden relation 선택 비율
- Confidence threshold
- Quiz distractor 생성 규칙
- Graph color palette와 edge status mapping
- Demo course note 본문
- API key, model name, provider URL

대신 다음 위치에 둔다.

- Runtime configuration: `src/lib/config/`
- Relation taxonomy seed: `src/domain/ontology/relation-taxonomy.ts` 또는 database seed
- Prompt template: `src/lib/llm/prompts/`
- Demo fixture: `src/test/fixtures/` 또는 `public/demo/`
- Environment variable: `.env.local`

상수는 의미 있는 이름을 가진 config로 추출한다. 단, UI spacing, component-local label처럼 domain behavior가 아닌 값은 component 안에 둘 수 있다.

## 에러 처리 원칙

에러는 다음 범주로 구분한다.

- `ValidationError`: 입력 또는 LLM output schema가 맞지 않는 경우
- `UnsupportedRelationError`: relation type 또는 evidence가 부족한 경우
- `PipelineStageError`: 특정 pipeline stage 실행 실패
- `LLMProviderError`: LLM provider 호출 실패, timeout, rate limit
- `PersistenceError`: 저장 또는 조회 실패
- `UserActionError`: 사용자가 현재 상태에서 수행할 수 없는 action을 요청한 경우

원칙:

- 사용자에게는 복구 가능한 설명을 제공한다.
- 내부 로그에는 stage id, run id, source chunk id, prompt version 등 추적 정보를 남긴다.
- Evidence verification 실패는 예외 상황이 아니라 expected outcome으로 다룬다.
- Unsupported relation은 삭제만 하지 말고, 필요하면 unsupported 상태와 reason을 보존한다.
- API response는 성공과 실패 모두 일관된 shape를 가진다.

권장 response shape:

```ts
type ApiResult<T> =
  | { ok: true; data: T; warnings?: string[] }
  | { ok: false; error: { code: string; message: string; details?: unknown } };
```

## 데이터 무결성 규칙

- `OntologyRelation.status === "verified"`이면 `evidenceChunkId`와 `evidenceText`가 반드시 존재해야 한다.
- `hidden` relation은 benchmark relation에서 파생되어야 하며 독립 생성하면 안 된다.
- Learner attempt는 hidden relation 또는 active task에 연결되어야 한다.
- Quiz question은 verified relation 하나 이상에 연결되어야 한다.
- Distractor는 어떤 relation을 왜 비틀었는지 추적 가능한 metadata를 가져야 한다.
- Diagnosis는 quiz answer만이 아니라 relation-level misunderstanding을 포함해야 한다.

## 테스트 설계 원칙

### Unit Test
- Domain invariant를 가장 먼저 테스트한다.
- Relation filtering, evidence requirement, hidden masking, attempt evaluation, quiz answer evaluation은 pure unit test로 검증한다.
- LLM 없이 fixture만으로 통과해야 한다.

### Pipeline Test
- 각 pipeline stage의 input/output contract를 fixture 기반으로 테스트한다.
- Mock LLM adapter를 사용하여 deterministic output을 만든다.
- Unsupported relation, malformed LLM output, insufficient evidence case를 반드시 포함한다.

### API Test
- Invalid request body가 validation error로 반환되는지 확인한다.
- Pipeline failure가 일관된 `ApiResult` shape로 반환되는지 확인한다.
- API key나 provider error가 browser-visible detail로 새지 않는지 확인한다.

### E2E Test
- 사용자가 course note를 붙여넣고 pipeline을 실행한다.
- Graph에 evidence-backed relation이 표시된다.
- Hidden relation을 하나 복원하고 feedback을 받는다.
- Quiz를 풀고 qualitative diagnosis를 확인한다.
- E2E는 실제 LLM이 아니라 mock 또는 recorded fixture를 기본으로 사용한다.

## UI 구현 원칙

- 첫 화면은 실제 도구 화면이어야 하며 landing page처럼 만들지 않는다.
- 한 페이지에서 작동 패널과 시각화 패널을 동시에 보여준다.
- Graph edge status는 색상만으로 구분하지 말고 label, icon, stroke style 중 하나 이상을 함께 사용한다.
- Evidence panel은 선택된 relation의 source sentence와 source location을 명확히 보여준다.
- Debugging UI는 정답을 즉시 노출하기보다 learner가 evidence를 보고 다시 시도할 수 있게 설계한다.
- 긴 텍스트는 panel 안에서 overflow 처리하고, 버튼이나 compact control 안에서 텍스트가 깨지지 않도록 한다.

## LLM Prompt 원칙

Prompt는 다음 제약을 반드시 포함해야 한다.

- 사전 정의된 relation type 중 하나만 선택한다.
- 새로운 relation type을 만들지 않는다.
- Course note에서 직접 찾을 수 있는 evidence만 사용한다.
- Evidence가 부족하면 unsupported로 표시한다.
- JSON schema에 맞는 결과만 반환한다.

Prompt 변경 시 prompt version을 올리고 관련 fixture를 갱신한다.

## 완료 기준

기능을 완료했다고 판단하려면 다음을 만족해야 한다.

- 관련 unit test 또는 pipeline test가 있다.
- LLM output path는 schema validation을 통과한다.
- Evidence 없는 verified relation이 생성되지 않는다.
- UI에서 loading, empty, error, success state가 처리된다.
- Browser 또는 Playwright로 주요 흐름을 한 번 이상 확인한다.
- 구현이 SRS의 MVP 범위를 벗어난 불필요한 기능 확장에 치우치지 않는다.
