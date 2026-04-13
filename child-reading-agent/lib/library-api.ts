import { parseStringPromise } from "xml2js";
import { Book } from "@/lib/types";

const SEARCH_ENDPOINT = "https://www.nl.go.kr/NL/search/openApi/search.do";

export async function searchBooks(keyword: string): Promise<Book[]> {
  const apiKey = process.env.NATIONAL_LIBRARY_API_KEY;

  if (!apiKey) {
    return [
      {
        title: "강아지똥",
        author: "권정생",
        publisher: "길벗어린이",
        description: "샘플 데이터입니다. API 키를 넣으면 실제 도서 검색으로 바뀝니다.",
      },
      {
        title: "마당을 나온 암탉",
        author: "황선미",
        publisher: "사계절",
        description: "샘플 데이터입니다. API 키를 넣으면 실제 도서 검색으로 바뀝니다.",
      },
    ].filter((book) => book.title.includes(keyword) || keyword.length < 2);
  }

  const params = new URLSearchParams({
    key: apiKey,
    pageNum: "1",
    pageSize: "10",
    srchTarget: "title",
    kwd: keyword,
  });

  const response = await fetch(`${SEARCH_ENDPOINT}?${params.toString()}`, {
    method: "GET",
    headers: { Accept: "application/xml, text/xml, */*" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`도서 검색 실패: ${response.status}`);
  }

  const xml = await response.text();
  const parsed = await parseStringPromise(xml, { explicitArray: false });
  const items = parsed?.result?.item;

  if (!items) return [];

  const normalized = Array.isArray(items) ? items : [items];

  return normalized.map((item: any) => ({
    title: item.titleInfo ?? "제목 없음",
    author: item.authorInfo ?? "저자 미상",
    publisher: item.pubInfo ?? "출판사 미상",
    isbn: item.isbn ?? undefined,
    description: item.detailLink ?? undefined,
  }));
}
