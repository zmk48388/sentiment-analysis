# 마음결 (Maeum-gyeol) — 감성 분석 웹 서비스

문장을 입력하면 AI가 **긍정 / 부정 / 중립** 감성을 분석하고, 신뢰도(%)와 그 이유를 친절하게 알려주는 웹 서비스입니다.

---

## 1. 사전 요구사항
- **Node.js**: v20 이상 권장
- **OpenAI API Key**: 감성 분석용 AI API 키
- **Supabase 계정**: 분석 결과 저장을 위한 DB 프로젝트

---

## 2. 설치 및 환경설정

### (1) 의존성 패키지 설치
```bash
npm install
```

### (2) 환경변수 설정
`.env.example` 파일을 복사하여 `.env` 파일을 만들고 실제 키 값을 입력합니다.

```bash
# .env 파일 생성 후 아래 항목 입력
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

---

## 3. 로컬 실행 방법
Vercel CLI를 통해 로컬 서버리스 환경을 구동합니다:

```bash
npx vercel dev
```
브라우저에서 `http://localhost:3000`으로 접속하여 서비스를 확인할 수 있습니다.

---

## 4. 배포 방법
GitHub 저장소에 소스 코드를 푸시한 후, Vercel 대시보드에서 프로젝트를 연결하고 동일한 환경변수(`OPENAI_API_KEY`, `OPENAI_MODEL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)를 설정하여 배포합니다.

