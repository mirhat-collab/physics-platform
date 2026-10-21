-- Состав закрытых классов (ЕНТ) для рейтинга. RLS на class_access отдаёт
-- ученику только его строку, из-за чего в рейтинге класс ЕНТ выглядел как
-- «1 ученик». Функция отдаёт вошедшим только пары класс → ученик.
create or replace function public.class_access_members()
returns table (class_id integer, student_id uuid)
language sql
stable
security definer
set search_path to 'public'
as $$
  select ca.class_id, ca.student_id from public.class_access ca
  where (select auth.uid()) is not null
$$;
revoke all on function public.class_access_members() from public, anon;
grant execute on function public.class_access_members() to authenticated;
