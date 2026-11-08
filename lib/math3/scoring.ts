import {
  MISCONCEPTION_CAP,
  PASS_SCORE,
  type Concept,
  type Evaluation,
  type EvaluationItem,
  type ItemStatus,
} from "./types";

const STATUS_CREDIT: Record<ItemStatus, number> = {
  covered: 1,
  partial: 0.5,
  missing: 0,
  incorrect: 0,
};

/** 말로 한 설명(음성 인식 결과)과 키워드를 같은 기준으로 비교하기 위한 정규화 */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/²/g, "제곱")
    .replace(/√/g, "루트")
    .replace(/[·.!?~'"“”‘’]/g, "")
    .replace(/\s+/g, "");
}

/** 각 항목 상태와 가중치로 이해도 점수(0~100)를 계산한다. 오개념이 있으면 상한을 둔다. */
export function computeScore(items: EvaluationItem[], misconceptionCount: number): number {
  const total = items.reduce((sum, item) => sum + item.weight, 0) || 1;
  const earned = items.reduce((sum, item) => sum + item.weight * STATUS_CREDIT[item.status], 0);
  const raw = Math.round((earned / total) * 100);
  return misconceptionCount > 0 ? Math.min(raw, MISCONCEPTION_CAP) : raw;
}

function pickFollowUp(concept: Concept, items: EvaluationItem[]): string {
  const weakest = [...items]
    .filter((item) => item.status !== "covered")
    .sort((a, b) => {
      // 틀린 설명 → 빠진 설명 → 부분 설명 순, 같은 상태면 비중이 큰 것부터
      const order: Record<ItemStatus, number> = { incorrect: 0, missing: 1, partial: 2, covered: 3 };
      return order[a.status] - order[b.status] || b.weight - a.weight;
    })[0];

  if (!weakest) return "완벽해! 이 개념을 이용한 문제를 하나 만들어서 직접 풀어 볼래?";
  return concept.rubric.find((rubric) => rubric.id === weakest.id)?.hint ?? `${weakest.label}에 대해 더 설명해 볼래?`;
}

/** API 키가 없거나 AI 응답이 실패했을 때 쓰는 키워드 기반 채점 */
export function evaluateLocally(concept: Concept, attempts: string[]): Evaluation {
  const text = normalize(attempts.join(" "));

  const items: EvaluationItem[] = concept.rubric.map((rubric) => {
    const matchedGroups = rubric.keywords.filter((group) =>
      group.some((keyword) => text.includes(normalize(keyword))),
    ).length;
    const ratio = rubric.keywords.length ? matchedGroups / rubric.keywords.length : 0;
    const status: ItemStatus = ratio === 1 ? "covered" : ratio >= 0.5 ? "partial" : "missing";

    return {
      id: rubric.id,
      label: rubric.label,
      weight: rubric.weight,
      status,
      comment:
        status === "covered"
          ? "핵심 표현이 설명에 들어 있어요."
          : status === "partial"
            ? "언급은 했지만 설명이 조금 부족해요."
            : "아직 설명에서 찾지 못했어요.",
    };
  });

  const score = text.length < 15 ? Math.min(computeScore(items, 0), 20) : computeScore(items, 0);
  const covered = items.filter((item) => item.status === "covered");
  const lacking = items.filter((item) => item.status !== "covered");

  return {
    score,
    passed: score >= PASS_SCORE,
    items,
    strengths: covered.map((item) => item.label),
    misconceptions: [],
    feedback:
      score >= PASS_SCORE
        ? "핵심 요소를 빠짐없이 설명했어요. 이 개념은 충분히 이해한 것 같아요!"
        : lacking.length
          ? `좋은 시작이에요. 다음 부분을 보충하면 이해도가 올라가요: ${lacking.map((item) => item.label).join(" / ")}`
          : "설명을 조금 더 자세히 해 볼까요?",
    followUpQuestion: pickFollowUp(concept, items),
    mode: "local",
  };
}

type RawAiItem = { id?: string; status?: string; comment?: string };
export type RawAiEvaluation = {
  items?: RawAiItem[];
  misconceptions?: string[];
  strengths?: string[];
  feedback?: string;
  followUpQuestion?: string;
};

const VALID_STATUS: ItemStatus[] = ["covered", "partial", "missing", "incorrect"];

/** AI가 돌려준 항목별 판정을 검증하고, 점수는 서버에서 가중치로 직접 계산한다. */
export function buildEvaluationFromAi(concept: Concept, raw: RawAiEvaluation): Evaluation {
  const items: EvaluationItem[] = concept.rubric.map((rubric) => {
    const found = raw.items?.find((item) => item.id === rubric.id);
    const status = VALID_STATUS.includes(found?.status as ItemStatus) ? (found!.status as ItemStatus) : "missing";
    return {
      id: rubric.id,
      label: rubric.label,
      weight: rubric.weight,
      status,
      comment: found?.comment?.trim() || "",
    };
  });

  const misconceptions = (raw.misconceptions ?? []).map((m) => String(m).trim()).filter(Boolean).slice(0, 5);
  const score = computeScore(items, misconceptions.length);

  return {
    score,
    passed: score >= PASS_SCORE,
    items,
    strengths: (raw.strengths ?? []).map(String).filter(Boolean).slice(0, 5),
    misconceptions,
    feedback: raw.feedback?.trim() || "",
    followUpQuestion: raw.followUpQuestion?.trim() || pickFollowUp(concept, items),
    mode: "ai",
  };
}
