"use client";

import { useState } from "react";
import { BookSearch } from "@/components/book-search";
import { ChatPanel } from "@/components/chat-panel";
import { ParentReport } from "@/components/parent-report";
import { AgentState, Book } from "@/lib/types";

export default function HomePage() {
  const [selectedBook, setSelectedBook] = useState<Book | undefined>();
  const [reportState, setReportState] = useState<AgentState | undefined>();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-[32px] bg-gradient-to-r from-amber-100 via-pink-100 to-emerald-100 p-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-black tracking-tight text-slate-900">어린이 독서 Agent</h1>
            <p className="mt-3 text-base leading-7 text-slate-700">
              아이가 오늘 읽은 책을 떠올리고, 20개 이상의 단어를 말하고, 그 단어들로 새로운 이야기를 만들도록 돕는 독서 AI Agent입니다.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr_1fr]">
          <BookSearch onSelect={setSelectedBook} />
          <ChatPanel selectedBook={selectedBook} onReportReady={setReportState} />
          <ParentReport state={reportState} />
        </div>
      </div>
    </main>
  );
}
