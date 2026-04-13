# 어린이 독서 Agent

아이 스스로 책 내용을 떠올리고, 단어를 기억하고, 그 단어들로 새로운 이야기를 만들도록 돕는 어린이 독서 AI Agent입니다.

## 이번 버전에서 바뀐 점

- OpenAI 공식 JavaScript SDK 연결
- 서버 라우트에서 Responses API 호출
- 프론트 대화창이 실제 OpenAI 응답을 받아 동작
- 도서 검색 API와 AI 대화를 분리한 구조
- API 키가 없을 때는 로컬 fallback 응답 제공

## 핵심 기능

- 책 제목으로 도서 검색
- 책 기반 단어 회상 대화
- 정답을 먼저 말하지 않는 3단계 힌트 방식
- 사람 / 장소 / 물건 / 감정 / 사건으로 단어 정리
- 단어를 연결한 새 이야기 만들기
- 부모용 요약 리포트 생성

## 기술 스택

- Next.js 14
- TypeScript
- Tailwind CSS
- OpenAI Responses API
- 국립중앙도서관 Open API

## 실행 방법

```bash
npm install
cp .env.example .env.local
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

빌드 전 확인:

```bash
npm run typecheck
npm run build
```

## 환경 변수

`.env.local` 파일에 아래 값을 넣으세요.

```bash
OPENAI_API_KEY=your_openai_api_key
NATIONAL_LIBRARY_API_KEY=your_national_library_api_key
OPENAI_MODEL=gpt-5.4
```

## OpenAI 연결 방식

이 프로젝트는 서버에서 `openai.responses.create()`를 호출합니다.

주요 파일:

- `app/api/chat/route.ts`: OpenAI API 호출
- `prompts/system-prompt.ts`: 어린이 독서 Agent 지침
- `components/chat-panel.tsx`: 사용자 메시지 전송 및 응답 표시

## 프로젝트 구조

```text
app/
  api/
    books/search/route.ts      # 도서 검색 API 프록시
    chat/route.ts              # OpenAI 채팅 API
  layout.tsx
  page.tsx                     # 메인 UI
components/
  chat-panel.tsx               # 대화 UI
  book-search.tsx              # 책 검색 UI
  parent-report.tsx            # 부모 요약 UI
lib/
  agent.ts                     # 상태 추적, 단어 분류, 리포트 생성
  library-api.ts               # 도서관 API 연동
  types.ts                     # 타입 정의
prompts/
  system-prompt.ts             # 멀티페르소나 통합 지침
```

## GitHub 업로드 방법

```bash
git init
git add .
git commit -m "Add OpenAI Responses API integration"
git remote add origin <YOUR_GITHUB_REPO_URL>
git branch -M main
git push -u origin main
```

## 배포 전 체크

- Vercel 또는 서버 환경에 `OPENAI_API_KEY` 설정
- 국립중앙도서관 API 키 설정
- 서버 로그에서 `/api/chat` 오류 확인

## 참고

이 프로젝트는 OpenAI 공식 JavaScript SDK의 Responses API를 사용합니다.
