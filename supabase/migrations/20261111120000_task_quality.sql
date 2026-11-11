-- Качество заданий: ключ задания в журнале ответов, жалобы учеников на
-- задания и казахская версия задач в банке.

-- 1. Ключ задания: «t:…» — шаблон, «b:id» — задача из банка. По нему админ
--    видит задания, в которых почти все ошибаются (или наоборот — все решают).
alter table public.answer_log add column if not exists task_key text;
create index if not exists answer_log_task_key on public.answer_log (task_key, created_at) where task_key is not null;

-- 2. Жалобы «ошибка в задании»
create table if not exists public.task_reports (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  task_key text,
  subject text not null check (subject in ('physics', 'math')),
  topic text,
  reason text not null check (reason in ('answer', 'condition', 'solution', 'translation', 'other')),
  comment text check (char_length(comment) <= 1000),
  payload jsonb not null,
  locale text not null default 'ru',
  status text not null default 'new' check (status in ('new', 'fixed', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists task_reports_status on public.task_reports (status, created_at desc);

alter table public.task_reports enable row level security;

create policy task_reports_own_insert on public.task_reports for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy task_reports_own_select on public.task_reports for select to authenticated
  using (user_id = (select auth.uid()));
create policy task_reports_staff_select on public.task_reports for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('teacher', 'admin')));
create policy task_reports_admin_update on public.task_reports for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

-- 3. Казахская версия задачи в банке. Если её нет — задача переводится ИИ.
alter table public.ent_bank add column if not exists question_kk text;
alter table public.ent_bank add column if not exists options_kk jsonb;
alter table public.ent_bank add column if not exists solution_kk text;

-- 4. Рисунок к задаче банка (ссылка на файл в публичном бакете)
alter table public.ent_bank add column if not exists image_url text;
