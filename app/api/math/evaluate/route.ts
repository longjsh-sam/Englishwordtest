import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { findConcept } from "@/lib/math3/curriculum";
import { buildEvaluationFromAi, evaluateLocally, type RawAiEvaluation } from "@/lib/math3/scoring";
import { MISCONCEPTION_CAP, PASS_SCORE, type Concept } from "@/lib/math3/types";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const model = process.env.OPENAI_MODEL || "gpt-5.4";

const MAX_ATTEMPTS = 10;
const MAX_CHARS = 2000;

function extractJson(text: string): RawAiEvaluation {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("JSON 응답을 찾지 못했습니다.");
  return JSON.parse(text.slice(start, end + 1)) as RawAiEvaluation;
}

function buildPrompt(concept: Concept, attempts: string[]): string {
  const rubric = concept.rubric
    .map((item) => `- id: "${item.id}" | 비중 ${item.weight}점 | 핵심 요소: ${item.label}`)
    .join("\n");

  const transcript = attempts.map((text, index) => `[${index + 1}번째 설명]\n${text}`).join("\n\n");

  return [
    `개념: ${concept.title}`,
    "",
    "[교사용 개념 정리]",
    ...concept.summary.map((line) => `- ${line}`),
    "",
    "[자주 나오는 오개념]",
    ...concept.misconceptions.map((line) => `- ${line}`),
    "",
    `[학생에게 한 질문] ${concept.prompt}`,
    "",
    "[채점 기준표]",
    rubric,
    "",
    "[학생의 말로 한 설명 — 음성 인식 결과라 띄어쓰기·맞춤법·기호 표기가 어색할 수 있음]",
    transcript,
    "",
    "채점 규칙:",
    "1. 여러 번의 설명은 처음 설명을 보충한 것이다. 모든 설명을 합쳐서 판단하되, 나중 설명이 앞의 틀린 말을 바로잡았으면 바로잡은 내용을 기준으로 한다.",
    "2. 각 기준 항목의 status를 정한다: covered(정확하고 충분히 설명), partial(언급했지만 이유·조건이 빠지거나 모호함), missing(언급 없음), incorrect(틀리게 설명).",
    "3. 용어를 그대로 말하지 않아도 같은 뜻을 자기 말로 정확히 설명했으면 covered로 인정한다. 반대로 용어만 나열하고 뜻을 설명하지 않았으면 partial이다.",
    "4. 음성 인식 오류로 보이는 표기(예: '루트 에이', '엑스 제곱', 'a 제곱 플러스 2ab')는 의도를 살려 해석한다.",
    "5. misconceptions에는 학생 설명에 실제로 남아 있는 수학적 오류만 짧게 적는다. 없으면 빈 배열.",
    "6. comment는 항목별로 학생에게 직접 말하듯 1문장으로 쓴다.",
    "7. strengths는 학생이 잘 설명한 점 1~3개.",
    "8. feedback은 중학생에게 말하듯 다정하지만 구체적으로 2~4문장. 무엇이 부족한지와 어떻게 보충하면 되는지 말한다. 정답 전체를 알려주지 말고 스스로 생각하게 유도한다.",
    "9. followUpQuestion은 가장 부족한 부분을 학생이 스스로 말로 보충하도록 유도하는 소크라테스식 질문 1개. 모두 covered이면 개념을 응용하는 심화 질문 1개.",
    "",
    "다음 JSON 형식으로만 답한다 (마크다운 금지):",
    '{"items":[{"id":"기준 id","status":"covered|partial|missing|incorrect","comment":"..."}],"misconceptions":["..."],"strengths":["..."],"feedback":"...","followUpQuestion":"..."}',
  ].join("\n");
}

export async function POST(request: NextRequest) {
  let body: { conceptId?: unknown; attempts?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const found = typeof body.conceptId === "string" ? findConcept(body.conceptId) : null;
  if (!found) {
    return NextResponse.json({ error: "알 수 없는 개념입니다." }, { status: 400 });
  }

  const attempts = Array.isArray(body.attempts)
    ? body.attempts
        .map((item) => String(item ?? "").trim().slice(0, MAX_CHARS))
        .filter(Boolean)
        .slice(-MAX_ATTEMPTS)
    : [];

  if (!attempts.length) {
    return NextResponse.json({ error: "설명 내용이 비어 있습니다." }, { status: 400 });
  }

  const { concept } = found;

  if (!openai) {
    return NextResponse.json({
      evaluation: {
        ...evaluateLocally(concept, attempts),
        warning: "OPENAI_API_KEY가 없어 키워드 기반 간이 채점을 했습니다. AI 채점을 쓰면 더 정확해요.",
      },
    });
  }

  try {
    const response = await openai.responses.create({
      model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: [
                "너는 한국 중학교 3학년 수학 개념을 가르치는 전문 선생님이다.",
                "학생이 개념을 '말로' 설명한 내용을 듣고, 채점 기준표의 항목별로 이해 여부를 판정한 뒤,",
                "부족한 부분을 스스로 보충할 수 있도록 피드백과 되묻기 질문을 한다.",
                `점수는 서버가 항목 비중으로 계산하며 ${PASS_SCORE}점 이상이면 통과, 오개념이 남아 있으면 최대 ${MISCONCEPTION_CAP}점이다.`,
                "관대하게 점수를 주지 말고, 근거 없이 결론만 말한 경우는 partial로 본다. 반드시 JSON만 출력한다.",
              ].join(" "),
            },
          ],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: buildPrompt(concept, attempts) }],
        },
      ],
    });

    const evaluation = buildEvaluationFromAi(concept, extractJson(response.output_text ?? ""));
    return NextResponse.json({ evaluation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json({
      evaluation: {
        ...evaluateLocally(concept, attempts),
        warning: `AI 채점에 실패해 키워드 기반 간이 채점을 했습니다. (${message})`,
      },
    });
  }
}
