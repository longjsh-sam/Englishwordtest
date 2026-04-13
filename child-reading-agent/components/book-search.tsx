"use client";

import { useState } from "react";
import { Book } from "@/lib/types";

type Props = {
  onSelect: (book: Book) => void;
};

export function BookSearch({ onSelect }: Props) {
  const [keyword, setKeyword] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/books/search?q=${encodeURIComponent(keyword)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "검색 중 오류가 발생했습니다.");
      }

      setBooks(data.books ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "검색 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold">책 찾기</h2>
      <p className="mt-2 text-sm text-slate-600">오늘 읽은 책 제목을 넣어보세요.</p>
      <div className="mt-4 flex gap-2">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="예: 강아지똥"
          className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none"
        />
        <button
          onClick={handleSearch}
          className="rounded-2xl bg-slate-900 px-4 py-3 text-white"
        >
          {loading ? "검색 중" : "검색"}
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      <div className="mt-4 space-y-3">
        {books.map((book) => (
          <button
            key={`${book.title}-${book.author}`}
            onClick={() => onSelect(book)}
            className="w-full rounded-2xl border border-slate-200 p-4 text-left hover:bg-slate-50"
          >
            <div className="font-semibold">{book.title}</div>
            <div className="mt-1 text-sm text-slate-600">
              {book.author} · {book.publisher}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
