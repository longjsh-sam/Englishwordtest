import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "사진 영어 문제 생성기",
  description: "사진 속 영어 단어와 문장을 분석해 학습자 수준에 맞는 문제를 생성합니다.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
