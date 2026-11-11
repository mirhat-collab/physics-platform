-- Безопасность, часть 1 (добавляет, ничего не ломает).

-- 1. Привязка ребёнка к родителю — только через функцию и только по точной
--    почте ученика. Раньше связь вставлялась напрямую в parent_links, и любой
--    вошедший мог привязать к себе любого ученика по его id, после чего видел
--    его профиль (имя, почту).
create or replace function public.link_child_by_email(p_email text)
returns table (id uuid, full_name text, grade text, total_xp integer, streak integer, role text)
language plpgsql security definer set search_path to 'public' as $$
#variable_conflict use_column
declare s public.profiles;
begin
  if (select auth.uid()) is null or (select public.my_role()) is distinct from 'parent' then
    raise exception 'only_parent' using errcode = '42501';
  end if;
  select * into s from public.profiles p
    where p.role = 'student' and lower(p.email) = lower(trim(p_email)) limit 1;
  if s.id is null then return; end if;
  if not exists (select 1 from public.parent_links pl where pl.parent_id = (select auth.uid()) and pl.student_id = s.id) then
    insert into public.parent_links (parent_id, student_id) values ((select auth.uid()), s.id);
  end if;
  return query select s.id, s.full_name, s.grade, s.total_xp, s.streak, s.role;
end $$;

revoke all on function public.link_child_by_email(text) from public, anon;
grant execute on function public.link_child_by_email(text) to authenticated;

-- 2. Жалоба на задание не может быть огромной (защита от засорения базы)
alter table public.task_reports drop constraint if exists task_reports_payload_size;
alter table public.task_reports add constraint task_reports_payload_size check (pg_column_size(payload) <= 60000);
