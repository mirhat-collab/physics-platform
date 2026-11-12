-- Блиц и дуэль. Результаты записывает только сервер (service role) после
-- проверки ответов, поэтому политик на вставку нет: подделать счёт нельзя.
create table if not exists public.duels (
  code text primary key check (code ~ '^[A-Z0-9]{6}$'),
  subject text not null check (subject in ('physics', 'math')),
  seed bigint not null,
  creator uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.game_results (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('blitz', 'duel')),
  subject text not null check (subject in ('physics', 'math')),
  duel_code text references public.duels(code) on delete cascade,
  score integer not null check (score >= 0),
  total integer not null check (total >= 0),
  time_ms integer not null check (time_ms >= 0),
  created_at timestamptz not null default now(),
  unique (duel_code, user_id)
);

create index if not exists game_results_board on public.game_results (kind, subject, created_at desc);
create index if not exists game_results_user on public.game_results (user_id, kind, subject);

alter table public.duels enable row level security;
alter table public.game_results enable row level security;

create policy duels_read on public.duels for select to authenticated using (true);
create policy game_results_own on public.game_results for select to authenticated using (user_id = (select auth.uid()));
