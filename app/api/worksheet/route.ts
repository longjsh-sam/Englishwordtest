import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

type Worksheet = {
  extractedText: string;
  learnerLevel: {
    label: string;
    cefr: string;
    reason: string;
    score: number;
  };
  words: Array<{
    word: string;
    meaningKo: string;
    partOfSpeech: string;
    level: "starter" | "basic" | "growing" | "confident";
    sourceSentence: string;
  }>;
  quizzes: Array<{
    id: string;
    type: "blank" | "synonym" | "antonym" | "singularPlural";
    prompt: string;
    options: string[];
    answer: string;
    explanation: string;
  }>;
  studyTip: string;
};

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const model = process.env.OPENAI_MODEL || "gpt-5.4";

const fallbackWorksheet: Worksheet = {
  extractedText:
    "The brave girl carried three boxes across the quiet street. Her small dog followed behind her.",
  learnerLevel: {
    label: "기초 문장 읽기 단계",
    cefr: "A1-A2",
    reason: "짧은 문장, 익숙한 명사, 과거형 동사가 함께 있어 단어 뜻과 문법 형태를 같이 확인하기 좋습니다.",
    score: 54,
  },
  words: [
    {
      word: "brave",
      meaningKo: "용감한",
      partOfSpeech: "adjective",
      level: "basic",
      sourceSentence: "The brave girl carried three boxes.",
    },
    {
      word: "carried",
      meaningKo: "들고 갔다",
      partOfSpeech: "verb",
      level: "basic",
      sourceSentence: "The brave girl carried three boxes.",
    },
    {
      word: "boxes",
      meaningKo: "상자들",
      partOfSpeech: "plural noun",
      level: "starter",
      sourceSentence: "The brave girl carried three boxes.",
    },
    {
      word: "quiet",
      meaningKo: "조용한",
      partOfSpeech: "adjective",
      level: "basic",
      sourceSentence: "She walked across the quiet street.",
    },
    {
      word: "followed",
      meaningKo: "따라갔다",
      partOfSpeech: "verb",
      level: "growing",
      sourceSentence: "Her small dog followed behind her.",
    },
  ],
  quizzes: [
    {
      id: "q1",
      type: "blank",
      prompt: "The ______ boy helped his friend cross the street.",
      options: ["brave", "boxes", "followed", "street"],
      answer: "brave",
      explanation: "친구를 도와주는 사람을 설명하므로 brave가 알맞습니다.",
    },
    {
      id: "q2",
      type: "synonym",
      prompt: "quiet와 뜻이 가장 가까운 단어를 고르세요.",
      options: ["silent", "round", "late", "heavy"],
      answer: "silent",
      explanation: "quiet는 소리가 적거나 조용하다는 뜻입니다.",
    },
    {
      id: "q3",
      type: "antonym",
      prompt: "brave의 반대 의미에 가장 가까운 단어를 고르세요.",
      options: ["afraid", "kind", "small", "fast"],
      answer: "afraid",
      explanation: "brave는 용감한, afraid는 두려워하는 뜻입니다.",
    },
    {
      id: "q4",
      type: "singularPlural",
      prompt: "문장에 알맞은 형태를 고르세요: I packed two ______ for the trip.",
      options: ["boxes", "box", "boxs", "boxed"],
      answer: "boxes",
      explanation: "two 뒤에는 복수 명사가 필요하고 box의 복수형은 boxes입니다.",
    },
  ],
  studyTip: "형용사와 명사를 짝으로 묶어 말하면 문장 만들기가 쉬워집니다.",
};

function extractJson(text: string): Worksheet {
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start < 0 || end < start) {
    throw new Error("JSON 응답을 찾지 못했습니다.");
  }

  return JSON.parse(trimmed.slice(start, end + 1)) as Worksheet;
}

function normalizeWorksheet(raw: Worksheet): Worksheet {
  const words = raw.words?.slice(0, 5) ?? [];
  const quizzes = raw.quizzes?.slice(0, 8).map((quiz, index) => ({
    ...quiz,
    id: quiz.id || `q${index + 1}`,
    options: quiz.options.slice(0, 4),
  })) ?? [];

  if (!raw.extractedText || words.length < 5 || quizzes.length < 4) {
    throw new Error("학습지 필수 항목이 부족합니다.");
  }

  return {
    extractedText: raw.extractedText,
    learnerLevel: {
      label: raw.learnerLevel?.label || "수준 분석",
      cefr: raw.learnerLevel?.cefr || "A1-A2",
      reason: raw.learnerLevel?.reason || "사진 속 단어와 문장 길이를 기준으로 추정했습니다.",
      score: Math.min(100, Math.max(0, Number(raw.learnerLevel?.score ?? 50))),
    },
    words,
    quizzes,
    studyTip: raw.studyTip || "새 단어를 사진 속 장면과 연결해 한 문장씩 말해보세요.",
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");
    const note = String(formData.get("note") ?? "");

    if (!(image instanceof File)) {
      return NextResponse.json({ error: "사진 파일이 필요합니다." }, { status: 400 });
    }

    if (!openai) {
      return NextResponse.json({
        worksheet: fallbackWorksheet,
        mode: "fallback",
        warning: "OPENAI_API_KEY가 없어 예시 학습지를 표시했습니다.",
      });
    }

    const bytes = Buffer.from(await image.arrayBuffer());
    const imageUrl = `data:${image.type || "image/jpeg"};base64,${bytes.toString("base64")}`;

    const response = await openai.responses.create({
      model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "너는 어린이와 초중급 영어 학습자를 위한 평가형 문제 출제자다. 사진 속 영어 텍스트를 읽고, 학습자의 수준을 추정한 뒤 한국어 설명이 포함된 짧은 영어 문제를 만든다. 반드시 JSON만 출력한다.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                "사진 속 영어 단어와 예문을 분석해 학습지를 만들어줘.",
                "조건:",
                "1. extractedText에는 사진에서 읽은 영어를 자연스럽게 정리한다.",
                "2. learnerLevel은 label, cefr, reason, score(0-100)를 포함한다.",
                "3. words는 정확히 5개이며 word, meaningKo, partOfSpeech, level, sourceSentence를 포함한다.",
                "4. quizzes는 4-8개이며 문맥 빈칸, 유의어, 반의어, 단수와 복수 문제를 섞는다.",
                "5. 각 문제는 options 4개, answer, explanation을 포함한다.",
                "6. level은 starter, basic, growing, confident 중 하나만 쓴다.",
                "7. 출력은 마크다운 없이 JSON 객체만 쓴다.",
                note ? `학습자 정보: ${note}` : "",
              ].join("\n"),
            },
            {
              type: "input_image",
              image_url: imageUrl,
              detail: "auto",
            },
          ],
        },
      ],
    });

    const worksheet = normalizeWorksheet(extractJson(response.output_text ?? ""));

    return NextResponse.json({ worksheet, mode: "openai" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";

    return NextResponse.json(
      {
        error: `학습지를 만들지 못했습니다: ${message}`,
      },
      { status: 500 },
    );
  }
}
