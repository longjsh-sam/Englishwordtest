import { NextRequest, NextResponse } from "next/server";
import { searchBooks } from "@/lib/library-api";

export async function GET(request: NextRequest) {
  try {
    const keyword = request.nextUrl.searchParams.get("q")?.trim();

    if (!keyword) {
      return NextResponse.json({ error: "q 파라미터가 필요합니다." }, { status: 400 });
    }

    const books = await searchBooks(keyword);
    return NextResponse.json({ books });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "도서 검색 실패" },
      { status: 500 },
    );
  }
}
