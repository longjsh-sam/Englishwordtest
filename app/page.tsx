"use client";

import { ChangeEvent, useMemo, useState } from "react";

type LevelKey = "starter" | "basic" | "growing" | "confident";

type VocabWord = {
  word: string;
  meaningKo: string;
  partOfSpeech: string;
  level: LevelKey;
  sourceSentence: string;
};

type QuizQuestion = {
  id: string;
  type: "blank" | "synonym" | "antonym" | "singularPlural";
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
};

type Worksheet = {
  extractedText: string;
  learnerLevel: {
    label: string;
    cefr: string;
    reason: string;
    score: number;
  };
  words: VocabWord[];
  quizzes: QuizQuestion[];
  studyTip: string;
};

const sampleWorksheet: Worksheet = {
  extractedText:
    "The curious fox found a shiny pebble near the river. It carried the pebble to its den and shared the story with its friends.",
  learnerLevel: {
    label: "기초 확장 단계",
    cefr: "A2",
    reason: "일상 명사와 쉬운 동사가 중심이고, 형용사와 과거동사가 섞여 있어 문맥 단서로 뜻을 추론하기 좋습니다.",
    score: 62,
  },
  words: [
    {
      word: "curious",
      meaningKo: "호기심 많은",
      partOfSpeech: "adjective",
      level: "growing",
      sourceSentence: "The curious fox found a shiny pebble near the river.",
    },
    {
      word: "pebble",
      meaningKo: "조약돌",
      partOfSpeech: "noun",
      level: "basic",
      sourceSentence: "The curious fox found a shiny pebble near the river.",
    },
    {
      word: "carried",
      meaningKo: "들고 갔다",
      partOfSpeech: "verb",
      level: "basic",
      sourceSentence: "It carried the pebble to its den.",
    },
    {
      word: "den",
      meaningKo: "동물의 굴",
      partOfSpeech: "noun",
      level: "growing",
      sourceSentence: "It carried the pebble to its den.",
    },
    {
      word: "shared",
      meaningKo: "나누었다",
      partOfSpeech: "verb",
      level: "basic",
      sourceSentence: "It shared the story with its friends.",
    },
  ],
  quizzes: [
    {
      id: "q1",
      type: "blank",
      prompt: "The child was ______ about the strange sound and opened the door slowly.",
      options: ["curious", "pebble", "den", "shared"],
      answer: "curious",
      explanation: "strange sound에 관심을 보이는 상황이므로 curious가 자연스럽습니다.",
    },
    {
      id: "q2",
      type: "synonym",
      prompt: "shared와 뜻이 가장 가까운 단어를 고르세요.",
      options: ["gave", "hid", "broke", "forgot"],
      answer: "gave",
      explanation: "shared는 함께 쓰거나 나누어 주었다는 뜻입니다.",
    },
    {
      id: "q3",
      type: "antonym",
      prompt: "curious의 반대 의미에 가장 가까운 표현을 고르세요.",
      options: ["not interested", "very bright", "full of water", "easy to carry"],
      answer: "not interested",
      explanation: "curious는 알고 싶어 하는 상태이고, 반대는 관심이 없는 상태입니다.",
    },
    {
      id: "q4",
      type: "singularPlural",
      prompt: "문장에 알맞은 형태를 고르세요: Two small ______ rolled into the river.",
      options: ["pebbles", "pebble", "pebbled", "pebbling"],
      answer: "pebbles",
      explanation: "Two가 있으므로 복수 명사 pebbles가 맞습니다.",
    },
  ],
  studyTip: "새 단어 5개를 그림 속 장면과 연결해서 한 문장씩 다시 말해보면 오래 기억됩니다.",
};

const levelLabels: Record<LevelKey, string> = {
  starter: "입문",
  basic: "기초",
  growing: "확장",
  confident: "자신감",
};

const quizTypeLabels: Record<QuizQuestion["type"], string> = {
  blank: "문맥 빈칸",
  synonym: "유의어",
  antonym: "반의어",
  singularPlural: "단수와 복수",
};

export default function HomePage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [extraNote, setExtraNote] = useState("");
  const [worksheet, setWorksheet] = useState<Worksheet>(sampleWorksheet);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"sample" | "openai" | "fallback">("sample");

  const score = useMemo(() => {
    return worksheet.quizzes.reduce((total, quiz) => {
      return total + (selectedAnswers[quiz.id] === quiz.answer ? 1 : 0);
    }, 0);
  }, [selectedAnswers, worksheet.quizzes]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
    setChecked(false);
    setSelectedAnswers({});
  };

  const analyzePhoto = async () => {
    if (!imageFile || loading) {
      setError("먼저 영어 문장이 보이는 사진을 올려주세요.");
      return;
    }

    setLoading(true);
    setError(null);
    setChecked(false);
    setSelectedAnswers({});

    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("note", extraNote);

      const response = await fetch("/api/worksheet", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "사진 분석에 실패했습니다.");
      }

      setWorksheet(data.worksheet);
      setMode(data.mode ?? "openai");
    } catch (err) {
      setError(err instanceof Error ? err.message : "사진 분석에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7fbf8] text-[#17211b]">
      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 lg:grid-cols-[0.95fr_1.2fr]">
        <section className="space-y-4">
          <div className="rounded-lg border border-[#cfe1d4] bg-white p-5">
            <p className="text-sm font-semibold text-[#d2493f]">사진 기반 영어 문제 생성기</p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[#17211b]">
              사진 속 영어를 읽고, 지금 수준에 맞는 문제를 만듭니다.
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#52645a]">
              교재, 책, 프린트물을 찍어 올리면 단어와 예문을 바탕으로 수준을 추정하고 문맥 빈칸, 유의어,
              반의어, 단수와 복수 문제를 생성합니다.
            </p>
          </div>

          <div className="rounded-lg border border-[#cfe1d4] bg-white p-4">
            <label className="block text-sm font-bold text-[#17211b]" htmlFor="photo">
              영어가 보이는 사진
            </label>
            <input
              id="photo"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageChange}
              className="mt-3 w-full rounded-md border border-[#b9d1c0] bg-[#f7fbf8] px-3 py-3 text-sm"
            />
            <div className="mt-4 overflow-hidden rounded-md border border-[#cfe1d4] bg-[#eef6f0]">
              {imagePreview ? (
                <img src={imagePreview} alt="업로드한 영어 사진 미리보기" className="h-72 w-full object-cover" />
              ) : (
                <div className="flex h-72 items-center justify-center px-6 text-center text-sm leading-6 text-[#52645a]">
                  카메라로 찍은 교재 사진이나 스크린샷을 올리면 여기에 표시됩니다.
                </div>
              )}
            </div>
            <label className="mt-4 block text-sm font-bold text-[#17211b]" htmlFor="note">
              학습자 정보
            </label>
            <textarea
              id="note"
              value={extraNote}
              onChange={(event) => setExtraNote(event.target.value)}
              placeholder="예: 초등 4학년, 파닉스는 가능, 긴 문장은 어려워함"
              className="mt-2 min-h-24 w-full resize-none rounded-md border border-[#b9d1c0] px-3 py-3 text-sm outline-none focus:border-[#2b8a57]"
            />
            <button
              onClick={() => void analyzePhoto()}
              disabled={loading}
              className="mt-3 w-full rounded-md bg-[#1f7a4d] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "사진을 읽고 문제를 만드는 중" : "사진 분석하고 문제 만들기"}
            </button>
            {error ? <p className="mt-3 text-sm font-medium text-[#c5342c]">{error}</p> : null}
          </div>
        </section>

        <section className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[0.7fr_1fr]">
            <div className="rounded-lg border border-[#cfe1d4] bg-white p-5">
              <p className="text-xs font-bold uppercase text-[#52645a]">학습 수준</p>
              <div className="mt-3 flex items-end gap-3">
                <span className="text-4xl font-black text-[#1f7a4d]">{worksheet.learnerLevel.cefr}</span>
                <span className="pb-1 text-sm font-bold text-[#d2493f]">{worksheet.learnerLevel.label}</span>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-md bg-[#e1ece5]">
                <div
                  className="h-full rounded-md bg-[#1f7a4d]"
                  style={{ width: `${Math.min(100, Math.max(0, worksheet.learnerLevel.score))}%` }}
                />
              </div>
              <p className="mt-3 text-sm leading-6 text-[#52645a]">{worksheet.learnerLevel.reason}</p>
              <p className="mt-3 text-xs font-semibold text-[#52645a]">
                {mode === "sample" ? "샘플 결과" : mode === "fallback" ? "로컬 예시 결과" : "사진 분석 결과"}
              </p>
            </div>

            <div className="rounded-lg border border-[#cfe1d4] bg-white p-5">
              <p className="text-xs font-bold uppercase text-[#52645a]">읽은 문장</p>
              <p className="mt-3 max-h-48 overflow-y-auto text-sm leading-7 text-[#17211b]">{worksheet.extractedText}</p>
            </div>
          </div>

          <div className="rounded-lg border border-[#cfe1d4] bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-black">단어 샘플 5개</h2>
              <p className="text-sm font-medium text-[#52645a]">{worksheet.studyTip}</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {worksheet.words.slice(0, 5).map((item) => (
                <article key={item.word} className="rounded-md border border-[#d7e6db] bg-[#f7fbf8] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="break-all text-lg font-black">{item.word}</h3>
                    <span className="rounded-md bg-[#ffe5df] px-2 py-1 text-xs font-bold text-[#a73730]">
                      {levelLabels[item.level]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-[#1f7a4d]">{item.meaningKo}</p>
                  <p className="mt-1 text-xs text-[#52645a]">{item.partOfSpeech}</p>
                  <p className="mt-3 text-xs leading-5 text-[#52645a]">{item.sourceSentence}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#cfe1d4] bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-black">맞춤 문제</h2>
              {checked ? (
                <p className="rounded-md bg-[#e9f6ee] px-3 py-2 text-sm font-bold text-[#1f7a4d]">
                  {score}/{worksheet.quizzes.length} 정답
                </p>
              ) : null}
            </div>
            <div className="mt-4 space-y-4">
              {worksheet.quizzes.map((quiz, index) => {
                const selected = selectedAnswers[quiz.id];
                const isCorrect = selected === quiz.answer;

                return (
                  <article key={quiz.id} className="rounded-md border border-[#d7e6db] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-[#17211b] px-2 py-1 text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <span className="rounded-md bg-[#ffe5df] px-2 py-1 text-xs font-bold text-[#a73730]">
                        {quizTypeLabels[quiz.type]}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-bold leading-6">{quiz.prompt}</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {quiz.options.map((option) => {
                        const active = selected === option;
                        const revealAnswer = checked && option === quiz.answer;

                        return (
                          <button
                            key={option}
                            onClick={() => {
                              setSelectedAnswers((prev) => ({ ...prev, [quiz.id]: option }));
                            }}
                            className={`rounded-md border px-3 py-3 text-left text-sm font-semibold ${
                              revealAnswer
                                ? "border-[#1f7a4d] bg-[#e9f6ee] text-[#1f7a4d]"
                                : active
                                  ? "border-[#d2493f] bg-[#ffe5df] text-[#a73730]"
                                  : "border-[#d7e6db] bg-white text-[#17211b]"
                            }`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                    {checked ? (
                      <p className={`mt-3 text-sm leading-6 ${isCorrect ? "text-[#1f7a4d]" : "text-[#c5342c]"}`}>
                        {isCorrect ? "정답입니다. " : `정답은 ${quiz.answer}입니다. `}
                        {quiz.explanation}
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </div>
            <button
              onClick={() => setChecked(true)}
              className="mt-4 w-full rounded-md bg-[#d2493f] px-4 py-3 text-sm font-bold text-white"
            >
              채점하기
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
