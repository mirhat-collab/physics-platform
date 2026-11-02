-- «Задача дня»: одна задача в день на предмет и язык, одинаковая для всех.
-- Пишет только сервер (service role), читать могут все.
create table if not exists public.daily_tasks (
  day date not null,
  subject text not null check (subject in ('physics', 'math')),
  locale text not null default 'ru',
  question jsonb not null,
  created_at timestamptz not null default now(),
  primary key (day, subject, locale)
);
alter table public.daily_tasks enable row level security;
create policy daily_tasks_read on public.daily_tasks for select to anon, authenticated using (true);
