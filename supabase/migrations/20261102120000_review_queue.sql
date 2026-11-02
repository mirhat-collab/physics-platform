-- «Работа над ошибками»: задачи, в которых ученик ошибся, возвращаются
-- через 1, 3 и 7 дней. После трёх верных повторов подряд — выучено.
create table if not exists public.review_queue (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  subject text not null check (subject in ('physics', 'math')),
  section text,
  topic text,
  payload jsonb not null,
  qkey text generated always as (md5(coalesce(payload->>'question', ''))) stored,
  stage smallint not null default 0,
  due_at timestamptz not null default now() + interval '1 day',
  done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, qkey)
);

create index if not exists review_queue_due on public.review_queue (user_id, done, due_at);

alter table public.review_queue enable row level security;

create policy review_queue_own_select on public.review_queue for select to authenticated using (user_id = (select auth.uid()));
create policy review_queue_own_insert on public.review_queue for insert to authenticated with check (user_id = (select auth.uid()));
create policy review_queue_own_update on public.review_queue for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy review_queue_own_delete on public.review_queue for delete to authenticated using (user_id = (select auth.uid()));

-- Старые ошибки за последние 30 дней сразу попадают в очередь (на сегодня)
insert into public.review_queue (user_id, subject, section, topic, payload, due_at)
select distinct on (a.user_id, md5(coalesce(a.payload->>'question', '')))
  a.user_id, a.subject, a.section, a.topic, a.payload, now()
from public.answer_log a
where a.source = 'ent' and not a.correct and a.payload ? 'question' and a.payload ? 'options'
  and a.subject in ('physics', 'math') and a.created_at > now() - interval '30 days'
order by a.user_id, md5(coalesce(a.payload->>'question', '')), a.created_at desc
on conflict (user_id, qkey) do nothing;
