export type RubricItem = {
  /** 개념 안에서 고유한 ID */
  id: string;
  /** 학생 설명에 꼭 들어가야 하는 핵심 요소 */
  label: string;
  /** 이해도 점수에서 차지하는 비중 (한 개념의 합계 = 100) */
  weight: number;
  /**
   * 로컬(키워드) 채점용. 바깥 배열은 AND, 안쪽 배열은 OR.
   * 예: [["제곱"], ["양수", "플러스"]] → "제곱"이 있고, "양수" 또는 "플러스"가 있어야 함
   */
  keywords: string[][];
  /** 이 요소가 빠졌을 때 던질 되묻기 질문 */
  hint: string;
};

export type Concept = {
  id: string;
  title: string;
  /** 개념 정리 핵심 문장 */
  summary: string[];
  /** 꼭 기억할 식/공식 */
  formulas?: string[];
  example?: { problem: string; solution: string };
  /** 자주 하는 오개념 */
  misconceptions: string[];
  /** 학생에게 말로 설명해 보라고 요청하는 질문 */
  prompt: string;
  rubric: RubricItem[];
};

export type Unit = {
  id: string;
  number: number;
  title: string;
  description: string;
  concepts: Concept[];
};

export type ItemStatus = "covered" | "partial" | "missing" | "incorrect";

export type EvaluationItem = {
  id: string;
  label: string;
  weight: number;
  status: ItemStatus;
  comment: string;
};

export type Evaluation = {
  score: number;
  passed: boolean;
  items: EvaluationItem[];
  strengths: string[];
  misconceptions: string[];
  feedback: string;
  followUpQuestion: string;
  mode: "ai" | "local";
  warning?: string;
};

export const PASS_SCORE = 90;
/** 오개념이 남아 있으면 점수가 아무리 높아도 통과하지 못하도록 상한을 둔다 */
export const MISCONCEPTION_CAP = 85;
