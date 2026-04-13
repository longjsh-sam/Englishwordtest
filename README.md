# New Project

GitHub에 올릴 수 있도록 정리한 프로젝트 모음입니다.

## 포함된 프로젝트

- `index.html`: 단일 HTML 대시보드
- `child-reading-agent/`: OpenAI Responses API를 사용하는 어린이 독서 Agent Next.js 앱

## 어린이 독서 Agent 실행

```bash
cd child-reading-agent
npm install
copy .env.example .env.local
npm run dev
```

브라우저에서 `http://localhost:3000`에 접속합니다.

## 환경 변수

`child-reading-agent/.env.local`에 아래 값을 설정합니다.

```bash
OPENAI_API_KEY=your_openai_api_key
NATIONAL_LIBRARY_API_KEY=your_national_library_api_key
OPENAI_MODEL=gpt-5.4
```

## GitHub 업로드

```bash
git add .
git commit -m "Add child reading agent"
git push origin codex/publish-dashboard
```
