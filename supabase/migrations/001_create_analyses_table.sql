-- ==============================================================================
-- 001_create_analyses_table.sql
-- 마음결 (Maeum-gyeol) 감성 분석 결과 기록을 위한 Supabase 테이블 생성 쿼리
-- ==============================================================================

-- 1. analyses (분석 기록) 테이블 생성
-- 사용자가 입력한 문장, AI가 판단한 감성 결과(긍정/부정/중립), 신뢰도(%), 이유, 모델명을 저장합니다.
create table if not exists public.analyses (
  -- 각 기록마다 고유하게 부여되는 식별자(UUID)
  id          uuid        primary key default gen_random_uuid(),

  -- 기록이 저장된 일시 (한국 시간 포함 타임스탬프)
  created_at  timestamptz not null default now(),

  -- 사용자가 분석을 요청한 문장 (공백 제외 1자 이상 500자 이하)
  input_text  text        not null check (char_length(input_text) between 1 and 500),

  -- 감성 분석 결과 ('positive': 긍정, 'negative': 부정, 'neutral': 중립 3가지만 허용)
  sentiment   text        not null check (sentiment in ('positive', 'negative', 'neutral')),

  -- 신뢰도 점수 (0 ~ 100 사이 정수)
  confidence  smallint    not null check (confidence between 0 and 100),

  -- AI가 분석한 이유 설명 (1자 이상 200자 이하)
  reason      text        not null check (char_length(reason) between 1 and 200),

  -- 분석에 사용된 AI 모델 이름 (예: gpt-4o-mini)
  model       text        not null
);

-- 2. 최신순 조회를 빠르게 지원하기 위한 인덱스 생성
create index if not exists analyses_created_at_idx
  on public.analyses (created_at desc);

-- 3. 보안 설정 (Row Level Security - RLS 활성화)
-- RLS를 켜고 일반 정책을 생성하지 않음으로써 브라우저/공개(anon) 키로는 외부에서 무단 조회가 불가능하게 차단합니다.
-- 오직 백엔드 서버의 'service_role' 비밀 키를 통해서만 안전하게 데이터가 저장됩니다.
alter table public.analyses enable row level security;

