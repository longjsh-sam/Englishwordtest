"use client";

import { useState } from "react";
import type { Concept, Evaluation, ItemStatus, Unit } from "@/lib/math3/types";
import { PASS_SCORE } from "@/lib/math3/types";
import { speak, useSpeechRecognition } from "./useSpeechRecognition";

type Attempt = { text: string; evaluation: Evaluation };

const STATUS_STYLE: Record<ItemStatus, { label: string; className: string; icon: string }> = {
  covered: { label: "충분", className: "bg-[#e3f4ea] text-[#1f7a4d] border-[#b7dec6]", icon: "●" },
  partial: { label: "부족", className: "bg-[#fff4d6] text-[#8a6100] border-[#f0d98f]", icon: "◐" },
  missing: { label: "빠짐", className: "bg-[#f1f3f2] text-[#52645a] border-[#d7dedb]", icon: "○" },
  incorrect: { label: "오류", className: "bg-[#ffe5df] text-[#a73730] border-[#f3b9ad]", icon: "✕" },
};

export default function ConceptStudy({
  unit,
  concept,
  onBack,
  onNext,
  onEvaluated,
}: {
  unit: Unit;
  concept: Concept;
  onBack: () => void;
  onNext: (() => void) | null;
  onEvaluated: (evaluation: Evaluation) => void;
}) {
  const [phase, setPhase] = useState<"learn" | "explain">("learn");
  const [peek, setPeek] = useState(false);
  const [peekCount, setPeekCount] = useState(0);
  const [draft, setDraft] = useState("");
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const speech = useSpeechRecognition((text) => {
    setDraft((prev) => (prev ? `${prev} ${text}` : text));
  });

  const latest = attempts[attempts.length - 1]?.evaluation;
  const passed = Boolean(latest?.passed);

  const submit = async () => {
    const text = draft.trim();
    if (!text || loading) return;
    if (speech.listening) speech.stop();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/math/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conceptId: concept.id, attempts: [...attempts.map((a) => a.text), text] }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "채점에 실패했어요.");
      const evaluation = data.evaluation as Evaluation;
      setAttempts((prev) => [...prev, { text, evaluation }]);
      setDraft("");
      onEvaluated(evaluation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "채점에 실패했어요.");
    } finally {
      setLoading(false);
    }
  };

  const restart = () => {
    setAttempts([]);
    setDraft("");
    setPeekCount(0);
    setPhase("learn");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button onClick={onBack} className="rounded-md border border-[#cfe1d4] bg-white px-3 py-2 text-sm font-bold">
          ← 단원 목록
        </button>
        <p className="text-sm font-semibold text-[#52645a]">
          {unit.number}단원 · {unit.title}
        </p>
      </div>

      <div className="rounded-lg border border-[#cfe1d4] bg-white p-5">
        <h1 className="text-2xl font-black">{concept.title}</h1>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm font-bold">
          <StepTab active={phase === "learn"} onClick={() => setPhase("learn")} index={1} label="개념 정리" />
          <StepTab active={phase === "explain"} onClick={() => setPhase("explain")} index={2} label="말로 설명하기" />
        </div>
      </div>

      {phase === "learn" ? (
        <>
          <ConceptCard concept={concept} />
          <button
            onClick={() => setPhase("explain")}
            className="w-full rounded-md bg-[#1f7a4d] px-4 py-4 text-base font-bold text-white"
          >
            이해했으면, 이제 책을 덮고 말로 설명해 보기 →
          </button>
        </>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <section className="space-y-4">
            <div className="rounded-lg border-2 border-[#1f7a4d] bg-[#f2faf5] p-5">
              <p className="text-xs font-bold text-[#1f7a4d]">
                {attempts.length === 0 ? "선생님의 질문" : passed ? "심화 질문" : "선생님의 되묻기"}
              </p>
              <p className="mt-2 text-lg font-bold leading-8">
                {attempts.length === 0 ? concept.prompt : latest?.followUpQuestion}
              </p>
              <button
                onClick={() => speak(attempts.length === 0 ? concept.prompt : latest?.followUpQuestion ?? "")}
                className="mt-3 text-sm font-semibold text-[#1f7a4d] underline"
              >
                🔊 질문 듣기
              </button>
            </div>

            <div className="rounded-lg border border-[#cfe1d4] bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="explain" className="text-sm font-bold">
                  {attempts.length === 0 ? "내 설명" : "보충 설명 (앞의 설명에 이어서 부족한 부분만 말해도 돼요)"}
                </label>
                <span className="text-xs text-[#52645a]">{attempts.length + 1}번째 설명</span>
              </div>

              {speech.supported ? (
                <button
                  onClick={speech.listening ? speech.stop : speech.start}
                  className={`mt-3 flex w-full items-center justify-center gap-2 rounded-md px-4 py-4 text-base font-bold text-white ${
                    speech.listening ? "animate-pulse bg-[#d2493f]" : "bg-[#17211b]"
                  }`}
                >
                  {speech.listening ? "■ 말하기 멈추기" : "🎤 눌러서 말로 설명하기"}
                </button>
              ) : (
                <p className="mt-3 rounded-md bg-[#fff4d6] px-3 py-2 text-xs leading-5 text-[#8a6100]">
                  이 브라우저는 음성 인식을 지원하지 않아요. 크롬·엣지·사파리에서 열거나, 아래에 직접 입력해 주세요.
                  (휴대폰 키보드의 마이크 버튼으로 받아쓰기를 해도 좋아요.)
                </p>
              )}
              {speech.error ? <p className="mt-2 text-xs font-medium text-[#c5342c]">{speech.error}</p> : null}

              <textarea
                id="explain"
                value={draft + (speech.interim ? (draft ? " " : "") + speech.interim : "")}
                onChange={(event) => setDraft(event.target.value)}
                readOnly={speech.listening}
                placeholder="친구에게 설명하듯 자유롭게 말해 보세요. 인식된 말은 여기에 적히고, 고칠 수도 있어요."
                className="mt-3 min-h-40 w-full resize-y rounded-md border border-[#b9d1c0] px-3 py-3 text-sm leading-6 outline-none focus:border-[#2b8a57]"
              />
              <button
                onClick={() => void submit()}
                disabled={loading || !draft.trim()}
                className="mt-3 w-full rounded-md bg-[#1f7a4d] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "선생님이 듣고 채점하는 중…" : "선생님에게 설명 제출하기"}
              </button>
              {error ? <p className="mt-2 text-sm font-medium text-[#c5342c]">{error}</p> : null}

              <button
                onClick={() => {
                  if (!peek) setPeekCount((n) => n + 1);
                  setPeek((v) => !v);
                }}
                className="mt-3 w-full text-xs font-semibold text-[#52645a] underline"
              >
                {peek ? "개념 정리 닫기" : `막히면 개념 정리 살짝 보기${peekCount ? ` (${peekCount}번 봤어요)` : ""}`}
              </button>
              {peek ? (
                <div className="mt-3">
                  <ConceptCard concept={concept} compact />
                </div>
              ) : null}
            </div>
          </section>

          <section className="space-y-4">
            {latest ? (
              <EvaluationCard evaluation={latest} tries={attempts.length} />
            ) : (
              <div className="rounded-lg border border-dashed border-[#b9d1c0] bg-white p-6 text-sm leading-7 text-[#52645a]">
                <p className="font-bold text-[#17211b]">이렇게 진행돼요</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5">
                  <li>질문을 읽고 🎤 버튼을 눌러 친구에게 가르치듯 설명해요.</li>
                  <li>선생님이 핵심 요소별로 이해도를 채점하고 부족한 점을 알려줘요.</li>
                  <li>되묻기 질문에 답하며 보충 설명을 해요.</li>
                  <li>
                    이해도 <b className="text-[#1f7a4d]">{PASS_SCORE}%</b> 이상이 되면 개념 통과!
                  </li>
                </ol>
              </div>
            )}

            {passed ? (
              <div className="rounded-lg border-2 border-[#1f7a4d] bg-[#e3f4ea] p-5 text-center">
                <p className="text-3xl">🎉</p>
                <p className="mt-2 text-lg font-black text-[#1f7a4d]">이해도 {latest?.score}% · 개념 통과!</p>
                <p className="mt-1 text-sm text-[#2f5a40]">
                  {attempts.length}번의 설명으로 핵심을 모두 말했어요.
                  {peekCount > 0 ? ` (개념 정리를 ${peekCount}번 봤으니 내일 한 번 더 설명해 보면 완벽해요.)` : ""}
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <button onClick={restart} className="rounded-md border border-[#1f7a4d] bg-white px-4 py-3 text-sm font-bold text-[#1f7a4d]">
                    처음부터 다시 설명하기
                  </button>
                  {onNext ? (
                    <button onClick={onNext} className="rounded-md bg-[#1f7a4d] px-4 py-3 text-sm font-bold text-white">
                      다음 개념으로 →
                    </button>
                  ) : (
                    <button onClick={onBack} className="rounded-md bg-[#1f7a4d] px-4 py-3 text-sm font-bold text-white">
                      단원 목록으로
                    </button>
                  )}
                </div>
              </div>
            ) : null}

            {attempts.length > 0 ? (
              <details className="rounded-lg border border-[#cfe1d4] bg-white p-4">
                <summary className="cursor-pointer text-sm font-bold">지금까지 한 설명 ({attempts.length})</summary>
                <ol className="mt-3 space-y-3">
                  {attempts.map((attempt, index) => (
                    <li key={index} className="rounded-md bg-[#f7fbf8] p-3 text-sm leading-6">
                      <span className="mr-2 rounded bg-[#17211b] px-2 py-0.5 text-xs font-bold text-white">
                        {index + 1}회 · {attempt.evaluation.score}%
                      </span>
                      {attempt.text}
                    </li>
                  ))}
                </ol>
              </details>
            ) : null}
          </section>
        </div>
      )}
    </div>
  );
}

function StepTab({ active, onClick, index, label }: { active: boolean; onClick: () => void; index: number; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md border px-3 py-2 ${
        active ? "border-[#1f7a4d] bg-[#1f7a4d] text-white" : "border-[#cfe1d4] bg-[#f7fbf8] text-[#52645a]"
      }`}
    >
      {index}. {label}
    </button>
  );
}

function ConceptCard({ concept, compact = false }: { concept: Concept; compact?: boolean }) {
  return (
    <div className={`space-y-4 rounded-lg border border-[#cfe1d4] bg-white ${compact ? "p-3 text-xs" : "p-5 text-sm"}`}>
      <div>
        <h2 className="font-black text-[#1f7a4d]">핵심 개념</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 leading-6">
          {concept.summary.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
      {concept.formulas?.length ? (
        <div>
          <h2 className="font-black text-[#1f7a4d]">꼭 기억할 식</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {concept.formulas.map((formula) => (
              <code key={formula} className="rounded-md bg-[#17211b] px-2.5 py-1.5 font-mono text-white">
                {formula}
              </code>
            ))}
          </div>
        </div>
      ) : null}
      {!compact && concept.example ? (
        <div className="rounded-md bg-[#f7fbf8] p-3">
          <h2 className="font-black text-[#1f7a4d]">예제</h2>
          <p className="mt-1 font-semibold leading-6">{concept.example.problem}</p>
          <details className="mt-1">
            <summary className="cursor-pointer text-xs font-semibold text-[#52645a]">풀이 보기</summary>
            <p className="mt-1 leading-6">{concept.example.solution}</p>
          </details>
        </div>
      ) : null}
      {!compact ? (
        <div className="rounded-md border border-[#f3b9ad] bg-[#fff6f3] p-3">
          <h2 className="font-black text-[#a73730]">이런 실수 조심!</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-6 text-[#5c2a25]">
            {concept.misconceptions.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function EvaluationCard({ evaluation, tries }: { evaluation: Evaluation; tries: number }) {
  const color = evaluation.passed ? "#1f7a4d" : evaluation.score >= 70 ? "#c98a00" : "#d2493f";
  const speakText = [evaluation.feedback, evaluation.followUpQuestion].filter(Boolean).join(" ");

  return (
    <div className="space-y-4 rounded-lg border border-[#cfe1d4] bg-white p-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-[#52645a]">{tries}번째 설명 후 이해도</p>
          <p className="text-5xl font-black" style={{ color }}>
            {evaluation.score}
            <span className="text-2xl">%</span>
          </p>
        </div>
        <p className="pb-2 text-sm font-bold" style={{ color }}>
          {evaluation.passed ? "통과" : `통과까지 ${PASS_SCORE - evaluation.score}%`}
        </p>
      </div>
      <div className="relative h-3 overflow-hidden rounded-md bg-[#e1ece5]">
        <div className="h-full rounded-md transition-all" style={{ width: `${evaluation.score}%`, background: color }} />
        <div className="absolute top-0 h-full w-0.5 bg-[#17211b]" style={{ left: `${PASS_SCORE}%` }} />
      </div>

      {evaluation.warning ? (
        <p className="rounded-md bg-[#fff4d6] px-3 py-2 text-xs leading-5 text-[#8a6100]">{evaluation.warning}</p>
      ) : null}

      <div>
        <h3 className="text-sm font-black">핵심 요소별 체크</h3>
        <ul className="mt-2 space-y-2">
          {evaluation.items.map((item) => {
            const style = STATUS_STYLE[item.status];
            return (
              <li key={item.id} className="rounded-md border border-[#e1ece5] p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold leading-6">{item.label}</p>
                  <span className={`shrink-0 rounded-md border px-2 py-0.5 text-xs font-bold ${style.className}`}>
                    {style.icon} {style.label}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2 text-xs text-[#52645a]">
                  <span>{item.comment}</span>
                  <span className="shrink-0">{item.weight}점</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {evaluation.strengths.length ? (
        <div className="rounded-md bg-[#e3f4ea] p-3 text-sm">
          <p className="font-black text-[#1f7a4d]">잘한 점</p>
          <ul className="mt-1 list-disc pl-5 leading-6">
            {evaluation.strengths.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {evaluation.misconceptions.length ? (
        <div className="rounded-md bg-[#ffe5df] p-3 text-sm">
          <p className="font-black text-[#a73730]">바로잡아야 할 부분 (오개념이 남아 있으면 통과할 수 없어요)</p>
          <ul className="mt-1 list-disc pl-5 leading-6 text-[#5c2a25]">
            {evaluation.misconceptions.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {evaluation.feedback ? (
        <div className="text-sm leading-7">
          <p className="font-black">선생님 피드백</p>
          <p className="mt-1">{evaluation.feedback}</p>
          <button onClick={() => speak(speakText)} className="mt-2 text-xs font-semibold text-[#1f7a4d] underline">
            🔊 피드백 듣기
          </button>
        </div>
      ) : null}
    </div>
  );
}
