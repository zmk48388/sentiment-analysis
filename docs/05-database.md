# 05. 데이터베이스(Supabase) 지침

> 목표: 성공한 분석 결과를 Supabase에 **안전하게** 저장합니다.
> 구현 파일: `supabase/schema.sql`, `lib/supabase-client.js`
> 이 서비스에서 DB는 "기록 보관용"입니다. 화면에서 기록을 조회하지 않습니다.

---

## 1. 저장 원칙

| 항목 | 결정 |
|---|---|
| 저장 시점 | OpenAI 분석이 **성공**하고 응답 검증을 통과한 직후 |
| 저장 대상 | 입력 문장, 감성, 신뢰도, 분석 이유, 사용한 모델 이름 |
| 저장하지 않는 것 | IP 주소, 브라우저 정보, 사용자 식별 정보 |
| 실패한 요청 | 저장하지 않음 (오류 응답은 기록 대상이 아님) |
| 저장 실패 시 | 사용자에게는 정상 결과를 보여주고, 서버 로그에만 기록 (`saved: false`) |
| 저장 주체 | **서버(Vercel 함수)만** 저장. 브라우저는 Supabase에 직접 접근하지 않음 |

---

## 2. 테이블 설계: `analyses`

`supabase/schema.sql` 파일을 아래 내용으로 만들고, 사용자가 **Supabase 대시보드 → SQL Editor**에서 실행합니다.

```sql
-- 감성 분석 기록 테이블
create table if not exists public.analyses (
  id          uuid        primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  input_text  text        not null check (char_length(input_text) between 1 and 500),
  sentiment   text        not null check (sentiment in ('positive', 'negative', 'neutral')),
  confidence  smallint    not null check (confidence between 0 and 100),
  reason      text        not null check (char_length(reason) between 1 and 200),
  model       text        not null
);

-- 최신순 조회를 대비한 인덱스
create index if not exists analyses_created_at_idx
  on public.analyses (created_at desc);

-- 보안: 행 단위 보안(RLS)을 켠다.
-- 정책(policy)을 하나도 만들지 않으므로, 공개(anon) 키로는 읽기/쓰기가 모두 막힌다.
-- 서버가 쓰는 service_role 키만 이 제한을 통과한다.
alter table public.analyses enable row level security;
```

### 컬럼 설명 (비전공자용)

| 컬럼 | 뜻 | 예시 |
|---|---|---|
| `id` | 기록마다 자동으로 붙는 고유 번호 | `3f2a...` |
| `created_at` | 저장된 시각 (자동) | `2026-11-10 12:50:00+09` |
| `input_text` | 사용자가 입력한 문장 | "정말 맛있어요!" |
| `sentiment` | 분석 결과 | `positive` |
| `confidence` | 신뢰도(0~100) | `87` |
| `reason` | 분석 이유 | "만족 표현이 분명합니다." |
| `model` | 분석에 사용한 AI 모델 이름 (`OPENAI_MODEL` 값) | (사용자가 정한 값) |

- `reason`의 DB 제한(200자)은 서버의 120자 제한보다 넉넉하게 둔 것입니다. (서버가 먼저 걸러냄)
- 컬럼을 임의로 추가/삭제/이름 변경하지 않습니다. 바꿔야 한다면 사용자에게 먼저 묻습니다.

---

## 3. 서버 연결 (`lib/supabase-client.js`)

- 공식 `@supabase/supabase-js` 패키지의 `createClient`를 사용합니다. (사용법은 설치된 버전의 공식 문서 확인)
- 사용하는 환경변수: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- 서버리스 환경에서는 **로그인 세션을 저장하지 않도록** 옵션을 설정합니다. (`auth: { persistSession: false, autoRefreshToken: false }`)
- 저장 함수 하나만 외부에 공개합니다.

```
saveAnalysis({ inputText, sentiment, confidence, reason, model })
→ 성공: true / 실패: false  (오류는 함수 안에서 console.error로 기록하고 throw하지 않음)
```

- 컬럼 이름 매핑: `inputText → input_text`, 나머지는 같은 이름.
- 저장 요청에는 **5초 제한**을 둡니다. (DB가 느려도 사용자가 오래 기다리지 않게). 초과하면 실패(`false`)로 처리합니다.
- `insert` 시 반환 데이터를 요청하지 않습니다. (필요 없음)
- 로그에는 **오류 메시지 요약만** 남기고 `input_text` 내용은 남기지 않습니다.

---

## 4. 보안 규칙

| 규칙 | 이유 |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY`는 서버 환경변수로만 사용 | 이 키는 **RLS를 무시하는 관리자급 키**라 유출되면 DB 전체가 위험 |
| `public/` 폴더, 브라우저 코드, README, 채팅에 키를 쓰지 않음 | 유출 방지 |
| 테이블에 RLS를 켜고 정책을 만들지 않음 | 공개 키로 접근하는 외부인을 차단 |
| Supabase `anon` 키는 이 프로젝트에서 **사용하지 않음** | 브라우저 직접 접근이 없으므로 불필요 |
| 입력 문장에 개인정보가 들어올 수 있음을 인지 | 화면 안내 문구 + IP 미저장 |

---

## 5. 구현 범위 / 제약 조건

**범위:** `analyses` 테이블 1개 생성, 서버에서의 insert(추가) 1종류
**제약:**
- 조회(select), 수정(update), 삭제(delete) 코드 작성 금지 (필요한 확인은 Supabase 대시보드에서 사용자가 직접 수행)
- 테이블 추가, 사용자 테이블, 인증(Auth), Storage, Realtime 기능 사용 금지
- 마이그레이션 도구, ORM(Prisma 등) 사용 금지 — SQL 파일 1개로 충분
- Supabase 연결 실패가 분석 결과 표시를 막으면 안 됨

---

## 6. 사용자에게 안내할 설정 순서 (에이전트가 쉬운 말로 안내)

1. [supabase.com](https://supabase.com)에서 새 프로젝트를 만든다. (이미 있으면 그것 사용)
2. 왼쪽 메뉴 **SQL Editor** → 새 쿼리 → `supabase/schema.sql` 내용을 붙여넣고 **Run**
3. 왼쪽 메뉴 **Table Editor**에서 `analyses` 테이블이 보이는지 확인 (RLS 표시가 켜져 있어야 함)
4. **Project Settings → API**에서 `Project URL`과 `service_role` 키를 복사해 `.env`의 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`에 붙여넣는다.
5. 이 키들은 **다른 사람에게 보내거나 공개 저장소에 올리지 않는다.**

> 에이전트는 키 값을 대신 입력하지 않고, 위치만 안내합니다.

---

## 7. 완료 기준 / 검증 기준

| # | 검증 항목 | 방법 | 기대 결과 |
|---|---|---|---|
| 1 | 테이블 생성 | Supabase Table Editor | `analyses` 테이블과 7개 컬럼이 존재 |
| 2 | RLS 활성 | Table Editor / Authentication → Policies | RLS **켜짐**, 정책 0개 |
| 3 | 저장 성공 | 화면(또는 curl)에서 분석 1회 실행 | 테이블에 **행 1개 증가**, 값이 응답과 일치 (`saved: true`) |
| 4 | 값 정확성 | 저장된 행 확인 | `sentiment`가 3가지 중 하나, `confidence` 0~100 정수, `model`에 환경변수 값 |
| 5 | 공개 키 차단 | (선택) 대시보드의 `anon` 키로 REST 조회 시도 | 데이터가 **조회되지 않음** (빈 결과 또는 권한 오류) |
| 6 | 저장 실패 허용 | 잘못된 서비스 키로 분석 | 화면에는 정상 결과, 응답 `saved: false`, 서버 로그에 실패 기록 |
| 7 | 오류 요청 미저장 | 빈 입력/오류 요청 실행 | 행이 **늘어나지 않음** |
| 8 | 키 노출 점검 | `public/` 폴더에서 `SUPABASE`, `service_role` 검색 | **0건** |
