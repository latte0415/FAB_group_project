"use client";

import { useMemo, useState } from "react";

import type { ApiResult } from "@/schemas/api-result";
import type { BenchmarkOntologyPrepareResponse } from "@/schemas/benchmark-ontology";

const sampleCourseNote = `1 Representation:
KRR uses constraints. Constraints organize concepts.

2 Reasoning:
Reasoning depends on representations. Constraint networks support reasoning.`;

const pipelineStages = [
  { label: "Input schema", status: "active" },
  { label: "Source chunking", status: "active" },
  { label: "Relation taxonomy loading", status: "active" },
  { label: "Node candidate generation", status: "pending" },
  { label: "Relation extraction", status: "pending" },
  { label: "Evidence verification", status: "pending" },
];

export function PrepareWorkbench() {
  const [title, setTitle] = useState("KRR note");
  const [text, setText] = useState(sampleCourseNote);
  const [result, setResult] =
    useState<BenchmarkOntologyPrepareResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const groupedRelations = useMemo(() => {
    if (!result) {
      return [];
    }

    return Object.entries(
      result.relationTypes.reduce<Record<string, typeof result.relationTypes>>(
        (groups, relationType) => {
          groups[relationType.category] ??= [];
          groups[relationType.category].push(relationType);
          return groups;
        },
        {},
      ),
    );
  }, [result]);

  async function handlePrepare() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/benchmark-ontology/prepare", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          courseNote: {
            title,
            text,
          },
        }),
      });

      const payload =
        (await response.json()) as ApiResult<BenchmarkOntologyPrepareResponse>;

      if (!payload.ok) {
        setResult(null);
        setError(payload.error.message);
        return;
      }

      setResult(payload.data);
    } catch {
      setResult(null);
      setError("Benchmark ontology 준비 API를 호출하지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="workspace">
      <section className="topbar">
        <div>
          <p className="status">Benchmark ontology prepare</p>
          <h1>Ontology 생성 준비 단계</h1>
          <p>
            현재 구현 범위는 입력 schema 검증, source chunking, relation
            taxonomy loading입니다. 다음 단계는 확인 후 이어서 구현합니다.
          </p>
        </div>
        <button className="primary-action" disabled={isLoading} onClick={handlePrepare}>
          {isLoading ? "Preparing..." : "Run prepare"}
        </button>
      </section>

      <section className="workbench-grid">
        <div className="panel control-panel">
          <h2>작동 패널</h2>
          <label>
            Course title
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label>
            Course note text
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={14}
            />
          </label>
          {error ? <p className="error-message">{error}</p> : null}
        </div>

        <div className="panel">
          <h2>파이프라인 상태</h2>
          <ol className="stage-list">
            {pipelineStages.map((stage, index) => (
              <li className={stage.status} key={stage.label}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {stage.label}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="result-grid">
        <div className="panel">
          <div className="panel-heading">
            <h2>Source chunks</h2>
            <strong>{result?.summary.chunkCount ?? 0}</strong>
          </div>
          <div className="scroll-list">
            {result?.sourceChunks.map((chunk) => (
              <article className="chunk-row" key={chunk.id}>
                <small>
                  {chunk.id} · {chunk.sectionTitle ?? chunk.sectionId} · sentence{" "}
                  {chunk.sentenceIndex}
                </small>
                <p>{chunk.text}</p>
              </article>
            )) ?? <p className="empty">Run prepare to inspect source chunks.</p>}
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <h2>Relation taxonomy</h2>
            <strong>{result?.summary.relationTypeCount ?? 0}</strong>
          </div>
          <div className="scroll-list">
            {groupedRelations.length > 0 ? (
              groupedRelations.map(([category, relationTypes]) => (
                <article className="taxonomy-group" key={category}>
                  <h3>{category}</h3>
                  <div className="relation-chip-list">
                    {relationTypes.map((relationType) => (
                      <span className="relation-chip" key={relationType.id}>
                        {relationType.name}
                      </span>
                    ))}
                  </div>
                </article>
              ))
            ) : (
              <p className="empty">Run prepare to inspect relation types.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
