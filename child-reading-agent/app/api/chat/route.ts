import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_PROMPT } from "@/prompts/system-prompt";
import { AgentState, ChatMessage } from "@/lib/types";
import { getNextLocalFallback, summarizeStateForPrompt } from "@/lib/agent";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const model = process.env.OPENAI_MODEL || "gpt-5.4";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      messages: ChatMessage[];
      state: AgentState;
      selectedBookTitle?: string;
    };

    if (!body?.messages?.length || !body?.state) {
      return NextResponse.json({ error: "messages와 state가 필요합니다." }, { status: 400 });
    }

    if (!openai) {
      return NextResponse.json(
        {
          reply: getNextLocalFallback(body.state),
          mode: "fallback",
          warning: "OPENAI_API_KEY가 없어 로컬 응답으로 동작했습니다.",
        },
        { status: 200 },
      );
    }

    const recentMessages = body.messages.slice(-12).map((message) => ({
      role: message.role,
      content: [{ type: "input_text" as const, text: message.text }],
    }));

    const response = await openai.responses.create({
      model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: SYSTEM_PROMPT,
            },
          ],
        },
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: [
                "현재 책 정보와 진행 상태를 참고해 다음 답변을 만드세요.",
                `선택한 책: ${body.selectedBookTitle ?? body.state.selectedBook?.title ?? "없음"}`,
                `현재 상태:\n${summarizeStateForPrompt(body.state)}`,
                "반드시 아이에게 보여줄 짧은 답변만 출력하세요.",
              ].join("\n\n"),
            },
          ],
        },
        ...recentMessages,
      ],
      text: {
        format: {
          type: "text",
        },
      },
    });

    const reply = response.output_text?.trim();

    if (!reply) {
      return NextResponse.json(
        {
          reply: getNextLocalFallback(body.state),
          mode: "fallback",
          warning: "OpenAI 응답이 비어 있어 로컬 응답으로 대체했습니다.",
        },
        { status: 200 },
      );
    }

    return NextResponse.json({ reply, mode: "openai" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";

    return NextResponse.json(
      {
        error: `채팅 응답 생성 실패: ${message}`,
      },
      { status: 500 },
    );
  }
}
