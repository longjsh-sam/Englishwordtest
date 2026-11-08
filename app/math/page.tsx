"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { allConcepts, findConcept, units } from "@/lib/math3/curriculum";
import { PASS_SCORE, type Evaluation } from "@/lib/math3/types";
import ConceptStudy from "./ConceptStudy";
import { loadProgress, saveProgress, type ProgressMap } from "./progress";

export default function MathPage() {
  const [progress, setProgress] = useState<ProgressMap>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const masteredCount = useMemo(
    () => allConcepts.filter((concept) => progress[concept.id]?.mastered).length,
    [progress],
  );
  const overall = Math.round((masteredCount / allConcepts.length) * 100);

  const selected = selectedId ? findConcept(selectedId) : null;
  const nextConceptId = useMemo(() => {
    if (!selectedId) return null;
    const index = allConcepts.findIndex((concept) => concept.id === selectedId);
    return allConcepts[index + 1]?.id ?? null;
  }, [selectedId]);

  const open = (id: string | null) => {
    setSelectedId(id);
    window.scrollTo({ top: 0 });
  };

  const recordEvaluation = (conceptId: string, evaluation: Evaluation) => {
    setProgress((prev) => {
      const before = prev[conceptId];
      const next: ProgressMap = {
        ...prev,
        [conceptId]: {
          best: Math.max(before?.best ?? 0, evaluation.score),
          last: evaluation.score,
          mastered: Boolean(before?.mastered) || evaluation.passed,
          tries: (before?.tries ?? 0) + 1,
          updatedAt: new Date().toISOString(),
        },
      };
      saveProgress(next);
      return next;
    });
  };

  return (
    <main className="min-h-screen bg-[#f7fbf8] text-[#17211b]">
      <div className="mx-auto max-w-6xl px-4 py-5">
        {selected ? (
          <ConceptStudy
            key={selected.concept.id}
            unit={selected.unit}
            concept={selected.concept}
            onBack={() => open(null)}
            onNext={nextConceptId ? () => open(nextConceptId) : null}
            onEvaluated={(evaluation) => recordEvaluation(selected.concept.id, evaluation)}
          />
        ) : (
          <div className="space-y-5">
            <header className="rounded-lg border border-[#cfe1d4] bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[#d2493f]">중학교 3학년 수학 · 개념 설명 트레이너</p>
                <Link href="/" className="text-xs font-semibold text-[#52645a] underline">
                  영어 문제 생성기로 가기
                </Link>
              </div>
              <h1 className="mt-2 text-3xl font-black leading-tight">
                설명할 수 있어야 진짜 아는 거예요.
              </h1>
              <p className="mt-3 text-sm leading-6 text-[#52645a]">
                단원별 개념을 정리하고, 친구에게 가르치듯 <b>말로 설명</b>하면 선생님이 핵심 요소별로 채점해
                부족한 부분을 되물어 줘요. 이해도 <b className="text-[#1f7a4d]">{PASS_SCORE}%</b>를 넘으면 그 개념은
                통과!
              </p>
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm font-bold">
                  <span>전체 진도</span>
                  <span className="text-[#1f7a4d]">
                    {masteredCount} / {allConcepts.length} 개념 통과 ({overall}%)
                  </span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-md bg-[#e1ece5]">
                  <div className="h-full rounded-md bg-[#1f7a4d] transition-all" style={{ width: `${overall}%` }} />
                </div>
              </div>
            </header>

            <div className="grid gap-4 md:grid-cols-2">
              {units.map((unit) => {
                const done = unit.concepts.filter((concept) => progress[concept.id]?.mastered).length;
                return (
                  <section key={unit.id} className="rounded-lg border border-[#cfe1d4] bg-white p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-[#52645a]">{unit.number}단원</p>
                        <h2 className="text-xl font-black">{unit.title}</h2>
                        <p className="mt-1 text-xs leading-5 text-[#52645a]">{unit.description}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-md px-2 py-1 text-xs font-bold ${
                          done === unit.concepts.length ? "bg-[#1f7a4d] text-white" : "bg-[#e9f6ee] text-[#1f7a4d]"
                        }`}
                      >
                        {done}/{unit.concepts.length}
                      </span>
                    </div>
                    <ul className="mt-4 space-y-2">
                      {unit.concepts.map((concept, index) => {
                        const item = progress[concept.id];
                        return (
                          <li key={concept.id}>
                            <button
                              onClick={() => open(concept.id)}
                              className="flex w-full items-center justify-between gap-3 rounded-md border border-[#d7e6db] bg-[#f7fbf8] px-3 py-3 text-left hover:border-[#1f7a4d]"
                            >
                              <span className="text-sm font-semibold">
                                <span className="mr-2 text-[#52645a]">
                                  {unit.number}-{index + 1}
                                </span>
                                {concept.title}
                              </span>
                              {item?.mastered ? (
                                <span className="shrink-0 rounded-md bg-[#1f7a4d] px-2 py-1 text-xs font-bold text-white">
                                  ✓ 통과 {item.best}%
                                </span>
                              ) : item ? (
                                <span className="shrink-0 rounded-md bg-[#fff4d6] px-2 py-1 text-xs font-bold text-[#8a6100]">
                                  최고 {item.best}%
                                </span>
                              ) : (
                                <span className="shrink-0 text-xs font-semibold text-[#52645a]">시작 →</span>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}
            </div>

            <p className="text-center text-xs text-[#52645a]">
              학습 기록은 이 기기의 브라우저에 저장돼요.{" "}
              <button
                onClick={() => {
                  if (window.confirm("모든 학습 기록을 지울까요?")) {
                    saveProgress({});
                    setProgress({});
                  }
                }}
                className="underline"
              >
                기록 초기화
              </button>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
