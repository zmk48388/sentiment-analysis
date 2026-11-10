# 01. 프로젝트 생성 지침

> 목표: 코드를 쓰기 전에 **폴더, 설정 파일, 환경변수, 설치**를 정확히 준비합니다.
> 이 문서의 구조와 이름을 그대로 따르세요. 임의로 바꾸지 마세요.

---

## 1. 사전 준비물 (사용자가 준비)

| 준비물 | 확인 방법 | 없으면 |
|---|---|---|
| Node.js 20 이상 | 터미널에서 `node -v` | 사용자에게 설치 요청 |
| Git | `git --version` | 사용자에게 설치 요청 |
| OpenAI API 키 | 사용자가 제공 | 키 없이 가능한 단계(1~3단계)까지만 진행하고 질문 |
| OpenAI 모델 이름 | 사용자가 제공 (`OPENAI_MODEL`) | **추측 금지.** 사용자에게 질문 |
| Supabase 프로젝트 | URL, Service Role Key | 5단계 전에 사용자에게 질문 |
| Vercel 계정 + GitHub 저장소 | 사용자가 제공 | 7단계 전에 사용자에게 질문 |

> 키가 없다고 멈추지 마세요. 화면(2~3단계)은 키 없이 만들 수 있습니다.

---

## 2. 폴더 구조 (정확히 이 구조로 생성)

```
sentiment-app/
├─ AGENTS.md                 # 작업 규칙
├─ PRD.md                    # 제품 요구사항
├─ README.md                 # 실행/배포 방법 (에이전트가 작성)
├─ package.json
├─ vercel.json               # Vercel 설정
├─ .env.example              # 환경변수 "이름표" (값은 비워둠, Git에 올림)
├─ .env                      # 실제 값 (절대 Git에 올리지 않음)
├─ .gitignore
├─ docs/                     # 상세 지침 문서 6개
│  ├─ 01-project-setup.md
│  ├─ 02-ui-guide.md
│  ├─ 03-feature-spec.md
│  ├─ 04-api-spec.md
│  ├─ 05-database.md
│  └─ 06-deploy-and-verification.md
├─ public/                   # 브라우저에 공개되는 파일 (비밀 정보 금지!)
│  ├─ index.html
│  ├─ css/
│  │  └─ style.css
│  └─ js/
│     └─ app.js
├─ api/
│  └─ analyze.js             # POST /api/analyze (서버리스 함수)
├─ lib/                      # 서버에서만 쓰는 도우미 코드
│  ├─ validate.js            # 입력/AI 응답 검증
│  ├─ openai-client.js       # OpenAI 호출
│  ├─ supabase-client.js     # Supabase 저장
│  └─ errors.js              # 오류 코드/HTTP 상태 정의
└─ supabase/
   └─ schema.sql             # 테이블 생성 SQL
```

- 프로젝트 폴더 이름은 `sentiment-app`을 기본으로 하되, 사용자가 다른 이름을 지정하면 그것을 따릅니다.
- **`public/` 안에는 화면에 필요한 파일만** 둡니다. 서버 코드(`api/`, `lib/`)와 키는 절대 넣지 않습니다.
- `docs/` 파일은 이미 존재합니다. 내용을 수정하지 마세요. (오타·충돌 발견 시 사용자에게 보고)

---

## 3. 설정 파일 내용

### 3-1. `package.json`

```json
{
  "name": "sentiment-app",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "description": "문장의 감성(긍정/부정/중립)을 분석하는 웹 서비스",
  "engines": {
    "node": ">=20"
  },
  "scripts": {
    "dev": "vercel dev",
    "start": "vercel dev"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2",
    "openai": "^4"
  }
}
```

- 의존성(설치할 패키지)은 위 **2개만** 허용합니다.
- 버전 범위(`^2`, `^4`)는 시작점입니다. `npm install` 후 실제 설치된 버전을 확인하고, **그 버전에 맞는 공식 문서**를 보고 코드를 작성하세요. (`openai` 최신 메이저 버전이 다르면 사용자에게 알리고 설치된 버전 기준으로 진행)
- Vercel CLI는 프로젝트에 설치하지 않고 `npx vercel dev`로 실행하거나, 사용자 PC에 전역 설치되어 있는 것을 사용합니다. (`npm run dev`는 `vercel dev`를 호출하므로 CLI가 필요합니다.)

### 3-2. `vercel.json`

```json
{
  "functions": {
    "api/analyze.js": {
      "maxDuration": 30
    }
  }
}
```

- 서버 함수 최대 실행 시간을 30초로 둡니다. (코드의 OpenAI 호출 제한 20초보다 길게)
- 이 값이 플랜(요금제) 한도를 넘어 배포 오류가 나면 사용자에게 보고하고 한도 이내로 낮추세요.

### 3-3. `.gitignore`

```
node_modules/
.env
.env.*
!.env.example
.vercel/
.DS_Store
npm-debug.log*
```

### 3-4. `.env.example` (값은 비워둠)

```
# OpenAI
OPENAI_API_KEY=
OPENAI_MODEL=

# Supabase (서버 전용 키입니다. 절대 브라우저 코드에 넣지 마세요)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

### 3-5. `.env` (사용자가 값을 채움)

- `.env.example`을 복사해서 만듭니다: `cp .env.example .env`
- **에이전트가 키 값을 대신 만들거나 추측해서 채우지 않습니다.** 사용자에게 받은 값만 입력합니다.
- 채팅/로그/보고서에 키 값을 그대로 출력하지 않습니다.

| 환경변수 | 의미 | 어디서 얻나 |
|---|---|---|
| `OPENAI_API_KEY` | OpenAI 사용 열쇠 | OpenAI 대시보드 → API keys |
| `OPENAI_MODEL` | 사용할 AI 모델 이름 | 사용자가 결정 |
| `SUPABASE_URL` | Supabase 프로젝트 주소 | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | DB 관리자급 키 (서버 전용) | Supabase → Project Settings → API |

---

## 4. 초기 생성 절차 (순서대로)

1. 프로젝트 폴더에서 위 **폴더 구조**의 빈 폴더/파일을 만든다.
2. `package.json`, `vercel.json`, `.gitignore`, `.env.example`을 3번 내용 그대로 만든다.
3. `npm install` 실행 → 오류 없이 끝나야 한다.
4. `git init` 후 첫 커밋: `chore: 프로젝트 초기 설정`
5. `public/index.html`에 `<h1>안녕하세요</h1>` 정도의 임시 내용을 넣고 `npx vercel dev`로 `http://localhost:3000`에서 보이는지 확인한다.
6. 확인이 끝나면 임시 내용을 지우고 `docs/02-ui-guide.md`로 넘어간다.

> `vercel dev` 처음 실행 시 Vercel 로그인/프로젝트 연결 질문이 나옵니다. 에이전트가 임의로 답하지 말고 사용자에게 어떻게 할지 물어보세요. (로컬 확인만 필요하면 사용자가 "연결하지 않음(No)"을 선택하도록 안내)

---

## 5. 구현 범위 / 제약 조건

**범위**
- 위 폴더 구조, 설정 파일, 설치 확인까지가 이 문서의 범위입니다.
- 화면·기능·API·DB 코드는 각각 02~05번 문서에서 다룹니다.

**제약 조건**
- 허용 패키지: `openai`, `@supabase/supabase-js` 두 개뿐
- 프론트엔드에 CDN으로 불러오는 것은 **폰트(Pretendard) 한 가지만** 허용 (`docs/02-ui-guide.md` 참고)
- TypeScript, 번들러, 프레임워크, CSS 프레임워크 사용 금지
- 모든 서버 파일은 ES 모듈 문법(`import` / `export`)을 사용 (`package.json`의 `"type": "module"` 때문)

---

## 6. 완료 기준 / 검증 기준

| # | 검증 항목 | 방법 | 기대 결과 |
|---|---|---|---|
| 1 | 폴더 구조 일치 | `ls -R` 또는 파일 탐색기 | 2번 구조와 동일 (`.env` 제외) |
| 2 | 설치 성공 | `npm install` | 오류 없이 종료, `node_modules/` 생성 |
| 3 | `.env` 보호 | `git status` | `.env`가 목록에 **나타나지 않음** |
| 4 | `.env.example` 존재 | 파일 확인 | 키 이름 4개, 값은 비어 있음 |
| 5 | 로컬 서버 실행 | `npx vercel dev` | `http://localhost:3000`에서 임시 페이지 표시 |
| 6 | 허용 패키지만 설치 | `package.json` 확인 | dependencies가 2개뿐 |

위 6개가 모두 통과하면 1단계 완료입니다.
