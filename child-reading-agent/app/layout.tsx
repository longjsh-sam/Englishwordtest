import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "어린이 독서 Agent",
  description: "책 읽기 후 단어 회상과 이야기 만들기를 돕는 어린이 독서 AI Agent",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
