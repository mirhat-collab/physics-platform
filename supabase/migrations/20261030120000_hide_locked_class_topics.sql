-- Темы закрытого класса (например, «ЕНТ») были видны всем ученикам.
-- Политика на topics искала закрытый класс через таблицу classes, но под
-- правами самого ученика, а его RLS закрытый класс как раз прячет — и
-- проверка «есть ли закрытый класс с такой темой» всегда давала «нет».
-- Теперь проверка идёт в security definer функции, мимо RLS.

create or replace function public.topic_grade_visible(p_grade text)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  with locked as (
    select c.id from public.classes c
    where c.is_locked
      and (c.name = p_grade or nullif(regexp_replace(c.name, '\D', '', 'g'), '') = p_grade)
  )
  select not exists (select 1 from locked)
    or exists (
      select 1 from public.class_access ca
      where ca.class_id in (select id from locked) and ca.student_id = (select auth.uid())
    )
    or coalesce(public.my_role() in ('teacher', 'admin'), false)
$$;
revoke all on function public.topic_grade_visible(text) from public, anon;
grant execute on function public.topic_grade_visible(text) to authenticated;

drop policy if exists topics_select_authenticated on public.topics;
create policy topics_select_authenticated on public.topics
  for select to authenticated
  using (public.topic_grade_visible(grade));
