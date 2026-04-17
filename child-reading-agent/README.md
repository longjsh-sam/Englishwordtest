# 사진 영어 문제 생성기

사진 속 영어 단어와 문장을 분석해 학습자 수준을 추정하고, 맞춤형 영어 문제를 생성하는 Next.js 웹앱입니다.

## 주요 기능

- 카메라 또는 이미지 파일 업로드
- 사진 속 영어 텍스트 추출 및 정리
- CEFR 기반 학습자 수준 추정
- 단어 샘플 5개 추출
- 문맥 빈칸, 유의어, 반의어, 단수와 복수 문제 생성
- 화면에서 바로 객관식 풀이 및 채점
- `OPENAI_API_KEY`가 없을 때 예시 학습지 표시

## 실행

```bash
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

## 주요 파일

- `app/page.tsx`: 사진 업로드, 분석 결과, 문제 풀이 UI
- `app/api/worksheet/route.ts`: OpenAI Vision 기반 학습지 생성 API
- `app/globals.css`: 전역 스타일
