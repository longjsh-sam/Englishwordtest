"use client";

import { useEffect, useState } from "react";
import { applyUserInputToState, buildParentReport, getOpeningMessage } from "@/lib/agent";
import { AgentState, Book, ChatMessage } from "@/lib/types";

type Props = {
  selectedBook?: Book;
  onReportReady: (state: AgentState) => void;
};

export function ChatPanel({ selectedBook, onReportReady }: Props) {
  const [state, setState] = useState<AgentState>({
    stage: "start",
    recalledWords: [],
    storyFrame: {},
    selectedBook,
  });
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: getOpeningMessage() },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setState((prev) => ({ ...prev, selectedBook }));
  }, [selectedBook]);

  const handleSend = async () => {
    const userText = input.trim();
    if (!userText || loading) return;

    setLoading(true);
    setError(null);

    const nextUserMessages = [...messages, { role: "user", text: userText } as ChatMessage];
    const nextState = applyUserInputToState({ ...state, selectedBook }, userText);

    setMessages(nextUserMessages);
    setState(nextState);
    setInput("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextUserMessages,
          state: nextState,
          selectedBookTitle: selectedBook?.title,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "채팅 응답 생성 중 오류가 발생했습니다.");
      }

      const assistantText = typeof data.reply === "string" && data.reply.trim()
        ? data.reply.trim()
        : "좋아 🙂 다시 하나씩 떠올려볼까?";

      setMessages((prev) => [...prev, { role: "assistant", text: assistantText }]);

      if (nextState.stage === "done") {
        onReportReady(nextState);
        buildParentReport(nextState);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "채팅 실패");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "좋은 생각이야 🙂 잠깐 연결이 어려웠어. 다시 한 번 말해볼까?",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">독서 대화</h2>
          <p className="mt-1 text-sm text-slate-600">
            {selectedBook ? `선택한 책: ${selectedBook.title}` : "책을 먼저 선택하면 더 좋아요."}
          </p>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-sm">
          단어 {state.recalledWords.length}/20+
        </div>
      </div>

      <div className="mt-4 h-[360px] space-y-3 overflow-y-auto rounded-2xl bg-slate-50 p-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
              message.role === "assistant" ? "bg-white" : "ml-auto bg-slate-900 text-white"
            }`}
          >
            {message.text}
          </div>
        ))}
        {loading ? <div className="max-w-[85%] rounded-2xl bg-white px-4 py-3 text-sm">생각하고 있어요…</div> : null}
      </div>

      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

      <div className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleSend();
            }
          }}
          placeholder="기억나는 단어나 이야기를 써보세요"
          className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none"
        />
        <button
          onClick={() => void handleSend()}
          disabled={loading}
          className="rounded-2xl bg-emerald-500 px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          보내기
        </button>
      </div>
    </div>
  );
}
