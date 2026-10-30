-- Профили больше не видны всем вошедшим (раньше profiles_select = true:
-- любой ученик мог прочитать имена и почту всех пользователей).
-- Теперь: свой профиль — всем; все профили — учителю и админу (роль
-- выдаёт только сервер по паролю, а триггер protect_profile_role не даёт
-- сменить её самому); родителю — только привязанные дети.

-- Роль вошедшего пользователя. security definer — чтобы политика на
-- profiles не вызывала саму себя по кругу
create or replace function public.my_role()
returns text
language sql
stable
security definer
set search_path to 'public'
as $$
  select role from public.profiles where id = (select auth.uid())
$$;
revoke all on function public.my_role() from public, anon;
grant execute on function public.my_role() to authenticated;

drop policy if exists profiles_select on public.profiles;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy profiles_select_staff on public.profiles
  for select to authenticated
  using ((select public.my_role()) in ('teacher', 'admin'));

create policy profiles_select_parent on public.profiles
  for select to authenticated
  using (exists (
    select 1 from public.parent_links pl
    where pl.parent_id = (select auth.uid()) and pl.student_id = profiles.id
  ));

-- Родитель привязывает ребёнка по почте: находит ровно одного ученика
-- по точному адресу, не видя остальных
create or replace function public.find_student_by_email(p_email text)
returns table (id uuid, full_name text, grade text, total_xp integer, streak integer, role text)
language sql
stable
security definer
set search_path to 'public'
as $$
  select p.id, p.full_name, p.grade, p.total_xp, p.streak, p.role
  from public.profiles p
  where (select public.my_role()) = 'parent'
    and p.role = 'student'
    and lower(p.email) = lower(trim(p_email))
  limit 1
$$;
revoke all on function public.find_student_by_email(text) from public, anon;
grant execute on function public.find_student_by_email(text) to authenticated;

-- Средние цифры по классам на странице «Прогресс»: только id, класс и XP
-- учеников — без имён и почты
create or replace function public.student_class_stats()
returns table (id uuid, grade text, total_xp integer)
language sql
stable
security definer
set search_path to 'public'
as $$
  select p.id, p.grade, p.total_xp from public.profiles p
  where (select auth.uid()) is not null and p.role = 'student'
$$;
revoke all on function public.student_class_stats() from public, anon;
grant execute on function public.student_class_stats() to authenticated;
