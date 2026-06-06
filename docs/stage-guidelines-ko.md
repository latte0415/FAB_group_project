# 사이트 단계별 사용법

이 문서는 `Qualitative Ontology Reconstruction` 사이트를 사용할 때 각 단계에서 무엇을 누르고, 무엇을 확인하고, 언제 다음 단계로 넘어가면 되는지 설명한다. 현재 사이트는 총 12개 step으로 구성되어 있다.

## 전체 화면 구성

- 왼쪽 또는 상단의 step 목록에서 현재 단계를 확인한다.
- 가운데 `Operation` 영역에서 입력, 실행, 선택, 제출을 한다.
- 오른쪽 `Visualization` 영역에서 graph와 evidence를 함께 확인한다.
- 하단의 `Run this stage`, `Run again`, `Previous`, `Next`, `Reset` 버튼으로 진행한다.
- API 실행이 필요한 단계는 `Run this stage`를 눌러야 완료된다.
- `Learner step`으로 표시되는 단계는 사용자의 선택, 복원, 퀴즈 풀이처럼 직접 조작하는 단계다.

## 단계 매칭 요약

| 사이트 단계 | 화면 step | 사용자가 하는 일 | 완료 기준 |
| --- | --- | --- | --- |
| 1 | `Project Overview` | 프로젝트 목적과 학습 흐름을 읽는다. | `Next`로 이동한다. |
| 2 | `Course note ingest` | 강의 노트를 불러오거나 직접 입력하고 실행한다. | source chunk가 생성된다. |
| 3 | `Concept extraction` | concept 후보를 추출한다. | node candidate 목록이 보인다. |
| 4 | `Relation taxonomy` | 허용된 relation type 목록을 확인한다. | taxonomy를 확인한 뒤 다음으로 이동한다. |
| 5 | `Relation extraction` | concept 사이 relation 후보를 추출한다. | relation candidate 목록이 보인다. |
| 6 | `Evidence verification` | evidence가 있는 relation만 검증한다. | verified relation 목록이 보인다. |
| 7 | `Benchmark ontology` | 정답 기준 graph를 만든다. | benchmark graph와 evidence가 보인다. |
| 8 | `Envisioning task` | 숨겨진 relation task를 만든다. | visible/hidden relation 개수가 보인다. |
| 9 | `Envisioning restoration` | 숨겨진 relation을 복원한다. | 지정된 hidden edge를 모두 완료한다. |
| 10 | `Quiz edge selection` | 퀴즈에 사용할 edge 3개를 선택한다. | selected quiz loop가 3/3이 된다. |
| 11 | `Quiz + debug loop` | relation type 퀴즈를 풀고 debugging guidance를 본다. | 3개 round가 모두 평가된다. |
| 12 | `Relation misunderstanding summary` | 복원/퀴즈 결과를 바탕으로 relation-level 오해를 요약한다. | 어떤 relation type 또는 concept 연결을 잘못 이해했는지 표시된다. |

## 1. Project Overview

목적:  
이 사이트가 어떤 학습 흐름을 보여주는지 이해하는 단계다.

사용법:
- `Understanding AI concepts`, `Learning state transition`, `Project goal`을 읽는다.
- 별도 실행 버튼은 없다.
- 내용을 확인한 뒤 `Next`를 누른다.

확인할 것:
- 이 사이트의 목표는 정답을 바로 보여주는 것이 아니라, evidence 기반 relation 복원을 통해 이해를 만드는 것이다.

### 말할 내용

- AI 개념을 이해했다는 상태를 first principle을 형성하고 qualitative reasoning을 수행할 수 있는 상태로 정의한다.
- Initial state는 course note를 읽지 않은 상태, goal state는 relation 구조를 바탕으로 개념을 추론할 수 있는 상태이다.
- 프로젝트 목표는 Ontology Reconstruction을 통해 First-Principles Understanding을 형성하도록 돕는 Qualitative Learning System을 만드는 것이다.

### 대본 (Script)

In this project, we define "understanding an AI concept" not as memorizing definitions, but as reaching a state where the learner has formed first principles and can perform qualitative reasoning.

We frame learning as a state transition. The initial state is before the learner has read the course note. The goal state is when the learner can infer concepts from a relation structure—not just recall isolated facts.

Our project goal is to build a Qualitative Learning System that helps learners form First-Principles Understanding through Ontology Reconstruction.

## 2. Course note ingest

목적:  
강의 노트를 source chunk로 나누어 이후 단계에서 evidence로 추적할 수 있게 만든다.

사용법:
- 빠른 데모를 원하면 `Session 2 full`, `Excerpt`, `Envisioning demo` 중 하나를 누른다.
- 직접 실험하려면 `Title`과 `Course note`를 수정한다.
- 하단의 `Run this stage`를 누른다.
- 실행 후 `Show source chunks`를 열어 문장이 chunk 단위로 나뉘었는지 확인한다.

완료 기준:
- `Ingest results · Source chunks`가 표시된다.
- chunk 개수가 0보다 크다.
- 다음 단계로 이동할 수 있다.

### 말할 내용

- Course note를 단순 요약문으로 바꾸지 않고, 이후 relation 검증에 사용할 source chunk 단위로 준비한다.
- Source chunk는 course note를 문장 단위로 나눈 조각으로, 각 chunk에는 고유 ID와 section·sentence 위치 정보가 붙는다. 이후 어떤 relation이든 "어느 문장에서 나왔는지" 추적할 수 있게 하는 기본 단위이다.
- 이 source chunk가 뒤에서 concept extraction, relation extraction, evidence verification의 기준이 된다.

### 대본 (Script)

The first pipeline step is not to summarize the course note. We prepare the text as source chunks—traceable units that later stages will use for relation verification.

A source chunk is a sentence-level segment of the course note. Each chunk gets a stable ID and location metadata such as section title and sentence index. That way, every relation we build later can be traced back to a specific sentence in the original text.

These source chunks become the foundation for concept extraction, relation extraction, and evidence verification in the steps that follow.

## 3. Concept extraction

목적:  
source chunk에서 graph node가 될 concept 후보를 찾는다.

사용법:
- 하단의 `Run this stage`를 누른다.
- 생성된 `Node candidates` 목록을 확인한다.
- 각 candidate의 이름, 타입, depth, rationale을 읽어본다.

완료 기준:
- concept candidate 목록이 표시된다.
- 오른쪽 graph는 아직 완성 graph가 아니라 이후 relation이 생기면 더 의미 있게 보인다.

### 말할 내용

- Raw text 전체를 그대로 처리하게 하지 않고, 중요한 AI concept를 meaningful units로 추출한다. 이후 relation과 ontology를 만들기 위한 node 후보를 준비하는 단계이다.
- LLM에 모든 추출을 자율적으로 맡기는 것이 아니라, course note의 structure(section / index), 각 concept 간 relation을 설명하는 부분, 등장 빈도와 같은 휴리스틱을 이용해 프롬프팅한다. 즉 LLM은 main reasoning 주체가 아니라 evidence-backed ontology 구축을 보조하는 역할이다.
- Simon information의 관점처럼 의미 있는 abstraction을 만들어 유저의 정보처리 부담을 줄인다.

### 대본 (Script)

Instead of processing the entire raw text at once, this stage extracts important AI concepts as meaningful units and prepares node candidates for the ontology.

We do not let the LLM freely decide what counts as a concept. We guide extraction with pre-defined heuristics—section and index structure, passages that explain relations between concepts, and term frequency. The LLM assists ontology construction; it is not the main reasoning authority.

This follows the spirit of Simon information: we build meaningful abstractions so the learner is not overwhelmed by unstructured text.

## 4. Relation taxonomy

목적:  
relation extraction에서 사용할 수 있는 relation type 목록을 확인한다.

사용법:
- 화면의 `Relation taxonomy` 목록을 본다.
- relation type이 category별로 어떻게 묶여 있는지 확인한다.
- 각 relation chip의 이름과 argument pattern을 살펴본다.
- 이 단계는 실행 버튼이 없고, 확인 후 `Next`를 누르면 된다.

확인할 것:
- 다음 relation extraction은 이 목록에 있는 type만 사용한다.
- 목록 밖의 relation은 benchmark graph에 들어가면 안 된다.

### 말할 내용

- Concept 사이 relation도 LLM이 임의로 만드는 것이 아니라 pre-defined relation type 안에서만 생성한다.
- Relation type은 representation의 constraint로 작동한다. 즉, ontology가 어떤 종류의 관계만 표현할 수 있는지 미리 제한해 추론의 범위를 구조화한다.

### 대본 (Script)

Relations between concepts are not invented freely by the LLM. They must be drawn from a pre-defined relation taxonomy.

Each relation type acts as a constraint on representation. It limits what kinds of links the ontology can express, so reasoning stays structured rather than open-ended.

## 5. Relation extraction

목적:  
concept 사이에 있을 수 있는 relation 후보를 evidence와 함께 제안한다.

사용법:
- 하단의 `Run this stage`를 누른다.
- `Relation candidates` 목록을 확인한다.
- 각 항목에서 source concept, relation type, target concept, confidence, evidence sentence를 본다.

완료 기준:
- relation candidate 목록이 표시된다.
- 이 단계의 relation은 아직 최종 정답이 아니며, 다음 단계에서 evidence verification을 통과해야 한다.

### 말할 내용

- 앞서 정의한 relation taxonomy와 source chunk를 기반으로 relation extraction을 진행한다.
- 각 candidate relation은 source concept, relation type, target concept과 함께 evidence sentence를 제안하지만, 아직 verified 상태는 아니다.

### 대본 (Script)

Using the relation taxonomy and source chunks we prepared earlier, this stage proposes candidate relations between concepts.

Each candidate links a source concept to a target concept with a relation type from the taxonomy and cites an evidence sentence from the course note. These are proposals only—they still need to pass evidence verification.

## 6. Evidence verification

목적:  
candidate relation 중 source chunk와 evidence text가 맞는 relation만 verified로 남긴다.

사용법:
- 하단의 `Run this stage`를 누른다.
- `Verified relations` 목록을 확인한다.
- 각 relation의 evidence chunk id와 evidence sentence를 읽는다.
- 오른쪽 graph에서 edge를 클릭하면 evidence detail을 함께 확인할 수 있다.

완료 기준:
- verified relation 목록이 표시된다.
- evidence가 없는 relation은 이 단계에서 verified로 보이면 안 된다.

### 말할 내용

- Project final outline에 따르면, benchmark ontology의 모든 relation은 source sentence, page 또는 section 정보, evidence를 반드시 가져야 한다. LLM이 course note 밖의 추론으로 relation을 추가해서는 안 된다.
- Evidence verification은 extraction 단계에서 제안된 candidate relation 중, evidence text가 실제 source chunk 원문에 포함되는지, source·target concept이 해당 chunk에 등장하는지, status가 supported인지를 확인하는 과정이다.
- Evidence가 충분하지 않거나 chunk와 맞지 않는 relation은 unsupported로 남기고, 검증을 통과한 relation만 verified로 승격한다. LLM output은 schema validation과 evidence verification을 통과한 뒤에만 domain object로 취급한다.

### 대본 (Script)

As our project outline states, every relation in the benchmark ontology must carry a source sentence, location information, and evidence. The LLM must not add relations based on inference outside the course note.

Evidence verification checks each candidate relation from extraction. We confirm that the cited evidence text actually appears in the referenced source chunk, that both source and target concepts appear in that chunk, and that the candidate is marked as supported.

Relations with insufficient or mismatched evidence stay unsupported. Only relations that pass this check are promoted to verified status. LLM output is treated as untrusted until it survives schema validation and evidence verification.

## 7. Benchmark ontology

목적:  
verified relation으로 정답 기준 ontology graph를 만든다.

사용법:
- 하단의 `Run this stage`를 누른다.
- `Benchmark ontology` 요약에서 node 수, verified relation 수, evidence chunk 수를 확인한다.
- 오른쪽 graph에서 edge를 클릭해 relation과 evidence를 확인한다.

완료 기준:
- benchmark graph가 시각화된다.
- 선택한 edge의 evidence가 오른쪽 evidence panel에 표시된다.

### 말할 내용

- 검증된 concept와 relation이 benchmark ontology로 구성된다.
- 수업에서 representation은 문제의 중요한 요소와 관계를 명시적으로 드러내는 방식으로 설명된다. 우리는 이 아이디어를 course note 학습에 적용해서, course note의 핵심 개념들을 node로, 개념 사이의 relation을 edge로 구성했다. 즉, course note 내용을 constraint network처럼 구조화해서 학생이 개념 간 관계를 파악하기 좋게 했다.
- 이걸 학생에게 정답처럼 바로 제공하는 것이 아니라, 이후 복원 학습의 기준 구조로 사용한다.

### 대본 (Script)

Verified concepts and relations are assembled into the benchmark ontology.

In the course, representation is described as making important elements and their relationships explicit. We apply that idea to course note learning: key concepts become nodes, and relations between them become edges. The note is structured like a constraint network so learners can see how concepts connect.

We do not hand this graph to the learner as a finished answer sheet. It serves as the reference structure for the reconstruction tasks that follow.

## 8. Envisioning task

목적:  
benchmark graph에서 일부 relation을 숨겨 학습자가 복원할 task를 만든다.

사용법:
- 하단의 `Run this stage`를 누른다.
- `Learner-facing graph`에서 visible relation과 hidden relation 개수를 확인한다.
- 숨겨진 relation은 `???`로 표시된다.
- task를 다시 만들고 싶으면 `Regenerate envisioning tasks`를 누른다.

완료 기준:
- visible relation과 hidden relation이 함께 표시된다.
- hidden relation task가 생성되어 다음 복원 단계로 이동할 수 있다.

### 말할 내용

- Benchmark ontology에서 중요한 relation 일부를 숨긴 상태로 학생에게 제공한다. 예를 들어 `communication systems`와 `information processing` 사이 relation이 `???`로 표시된다.
- 학생은 보이지 않는 relation을 스스로 envisioning하며 ontology를 복원한다.
- 이 과정은 빈칸 맞히기가 아니라, concept 사이 구조를 질적으로 추론하는 qualitative reasoning 활동이다.

### 대본 (Script)

From the benchmark ontology, we hide a subset of important relations before showing the graph to the learner. For example, the link between communication systems and information processing appears as "???" instead of a labeled edge.

The learner must envision the missing structure and restore the ontology. This is not fill-in-the-blank recall—it is qualitative reasoning about how concepts are structurally connected.

## 9. Envisioning restoration

목적:  
숨겨진 relation을 visible graph와 evidence를 바탕으로 직접 복원한다.

사용법:
- `Edge 1`, `Edge 2`, `Edge 3` 탭을 순서대로 진행한다.
- source node와 target node가 고정된 edge quiz task에서는 relation type만 선택한다.
- 일반 hidden edge task에서는 source node, relation type, target node를 모두 선택한다.
- 필요하면 `Explanation`을 적는다.
- `Submit proposal`을 눌러 평가를 받는다.
- 틀리면 `Get debugging guidance`를 눌러 evidence 기반 힌트를 보고 다시 제출한다.

완료 기준:
- 각 task가 correct 또는 restoration complete 상태가 된다.
- 모든 필수 hidden edge를 완료하면 다음 단계로 이동할 수 있다.

### 말할 내용

- 학생이 틀린 relation type을 선택해도 시스템은 정답을 바로 보여주지 않는다. 예를 들어 `communication systems` → `information processing` 사이에서 잘못된 relation type을 고른 경우, benchmark answer를 즉시 reveal하지 않는다.
- Benchmark ontology 생성 때 사용한 reference sentence를 제공해 self-debugging을 유도한다.
- `Get debugging guidance`는 정답을 노출하는 기능이 아니다. evidence sentence를 다시 읽으며 (1) source·target concept이 evidence에서 어떻게 연결되는지, (2) 동사·표현이 taxonomy 중 어떤 relation type에 가까운지, (3) source→target 방향이 evidence 흐름과 맞는지 점검하도록 scaffold를 제공한다. 학생은 같은 hidden task에 대해 relation proposal을 수정해 다시 제출한다.
- 학생이 어떤 relation을 왜 잘못 이해했는지 찾게 하므로, 단순 trial-and-error가 아니라 qualitative debugging이다.

### 대본 (Script)

When the learner selects the wrong relation type, the system does not reveal the correct answer immediately. For instance, if they misidentify the relation between communication systems and information processing, we withhold the benchmark answer.

Instead, we surface the reference sentence that was used when building the benchmark ontology, so the learner can self-debug.

"Get debugging guidance" is not an answer-reveal button. It scaffolds an evidence-grounded loop: reread the source sentence, check how the source and target concepts are connected, compare the wording to the predefined relation taxonomy, and verify whether the source-to-target direction matches the evidence. The learner then revises the same hidden relation and submits again.

The goal is for the learner to discover which relation they misunderstood and why—not to trial-and-error until the system gives up the answer. That is qualitative debugging.

## 10. Quiz edge selection

목적:  
verified benchmark relation 중 퀴즈에 사용할 edge 3개를 선택한다.

사용법:
- `Select 3 edges`를 누른다.
- 다시 고르고 싶으면 `Reselect edges`를 누른다.
- `Selected quiz loop`에서 3개의 edge question이 준비되었는지 확인한다.

완료 기준:
- selected quiz loop가 `3 / 3`으로 표시된다.
- 다음 단계에서 3개의 relation type 퀴즈를 풀 수 있다.

### 말할 내용

- First-principle validation을 위해 verified benchmark relation 중 퀴즈에 사용할 edge 3개를 선택한다.
- 퀴즈는 course note에서 LLM이 임의로 문항을 만드는 것이 아니라, evidence-backed verified relation을 기준으로 relation type을 검증하는 단계로 이어진다.
- `Select 3 edges`를 실행하면 각 edge가 하나의 quiz round가 되며, 이후 답안 제출과 debugging loop의 입력이 된다.

### 대본 (Script)

This stage prepares first-principle validation. From the verified benchmark relations, we select three edges to use as quiz items.

The quiz is not "course note to LLM to random questions." It follows the chain from evidence to ontology to first principles. Each selected edge becomes one quiz round in the validation loop that follows.

Click "Select 3 edges" to prepare three relation-type questions grounded in verified evidence.

## 11. Quiz + debug loop

목적:  
3개의 edge question에 대해 어떤 relation type이 맞는지 답하고, 오답이면 evidence 기반 debugging guidance를 확인한다.

사용법:
- 각 round에서 `source → ??? → target`을 확인한다.
- `Relation type` dropdown에서 답을 선택한다.
- 3문항 모두 선택한 뒤 `Submit all`을 누른다.
- 정답이면 `Correct`가 표시된다.
- 오답이면 debugging guidance와 evidence를 읽고 relation 판단을 다시 점검한다.

완료 기준:
- 3개 round가 모두 평가된다.
- 오답 문항에는 debugging guidance가 준비된다.
- `Grading and debugging are complete` 안내가 보이면 다음 단계로 이동한다.

### 말할 내용

- 3개의 edge question에 대해 `source → ??? → target` 형태로 relation type을 선택하고 `Submit all`로 제출한다.
- 정답이면 `Correct`가 표시되고, 오답이면 envisioning 단계와 동일하게 evidence 기반 debugging guidance를 확인할 수 있다.
- 퀴즈는 정답 선지가 verified relation에서만 함의되도록 설계되어, 학생의 first-principle understanding을 relation level에서 검증한다.

### 대본 (Script)

For each of the three edge questions, the learner sees a pattern like "source → ??? → target" and selects a relation type from the taxonomy, then submits all answers at once.

Correct responses are marked as correct. Incorrect responses trigger the same evidence-based debugging guidance used in envisioning—reread the source, compare wording to the taxonomy, and revise the relation judgment.

Because correct options are implied only by verified relations, the quiz validates first-principle understanding at the relation level, not isolated fact recall.

## 12. Relation misunderstanding summary

목적:  
복원 시도와 퀴즈 결과를 종합해 어떤 relation type 또는 concept 연결을 잘못 이해했는지 확인한다.

사용법:
- `Submitted attempts`, `Reconstruction mistakes`, `Edge quiz mistakes` 수치를 확인한다.
- `Generate summary`를 누른다.
- 생성된 summary와 misunderstood relation 목록을 읽는다.

완료 기준:
- 점수만이 아니라 어떤 relation type 또는 concept 연결을 오해했는지 relation-level summary가 표시된다.

### 말할 내용

- 복원 시도(envisioning restoration)와 퀴즈 결과를 종합해 relation-level misunderstanding summary를 생성한다.
- `Submitted attempts`, `Reconstruction mistakes`, `Edge quiz mistakes` 수치와 함께, 어떤 relation type 또는 concept pair를 잘못 이해했는지 qualitative diagnosis를 제공한다.
- Project final outline처럼 8/10 같은 quantitative score보다, 틀린 문항에서 어떤 relation에 대한 개념이 부정확한지 self-debugging 관점의 평가를 우선한다.

### 대본 (Script)

The final stage synthesizes results from envisioning restoration and the quiz into a relation-level misunderstanding summary.

Alongside counts such as submitted attempts, reconstruction mistakes, and edge quiz mistakes, the system generates a qualitative diagnosis: which relation types or concept pairs the learner misunderstood, and why.

Following our project outline, we prioritize qualitative diagnosis over a simple score like eight out of ten. The output tells the learner which relations need revision—not just how many answers were wrong.

## 자주 막히는 지점

- `Run this stage`가 비활성화되어 있으면 이전 실행 단계가 완료되지 않은 것이다.
- `Next`가 비활성화되어 있으면 현재 단계의 완료 조건을 아직 만족하지 못한 것이다.
- graph가 비어 있으면 relation extraction 또는 verification 전 단계일 수 있다.
- edge evidence를 보려면 오른쪽 graph에서 edge를 클릭한다.
- `Reset`은 전체 학습 세션을 초기 상태로 되돌린다.
- `Run again`은 현재 실행 단계를 다시 돌리며, 그 이후 결과가 바뀔 수 있다.
