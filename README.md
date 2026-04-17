# New Project

## 사진 영어 문제 생성기

`child-reading-agent/` 폴더에 사진 속 영어 단어와 문장을 분석해 학습자 수준에 맞는 문제를 만들어주는 Next.js 앱이 있습니다.

## 실행

```bash
cd child-reading-agent
npm install
copy .env.example .env.local
npm run dev
```

브라우저에서 `http://localhost:3000`에 접속합니다.

## 환경 변수

```bash
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5.4
```
