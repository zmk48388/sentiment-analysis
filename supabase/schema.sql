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

