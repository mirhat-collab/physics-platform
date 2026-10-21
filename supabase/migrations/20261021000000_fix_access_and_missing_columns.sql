-- Аудит сайта, октябрь 2026: недостающие колонки, Storage-политики и закрытие
-- лишних прав доступа.

-- 1) Колонки, которые код уже использует, но которых не было в базе.
--    Из-за отсутствия homework.media_urls ни одно ДЗ не создавалось
--    (insert падал), а из-за homework_submissions.media_url — ни один ответ ученика.
alter table public.homework add column if not exists media_urls text[];
alter table public.homework_submissions add column if not exists media_url text;

-- 2) Storage: у бакета homework-media не было ни одной политики, поэтому любые
--    загрузки (файлы к ДЗ, турнирам, ответы учеников) отклонялись.
--    Имя файла везде начинается с "<uid>_", так и проверяем владельца.
drop policy if exists "homework_media_staff_insert" on storage.objects;
create policy "homework_media_staff_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'homework-media'
    and (storage.foldername(name))[1] in ('homework', 'tournaments')
    and split_part(storage.filename(name), '_', 1) = (select auth.uid())::text
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('teacher', 'admin'))
  );

drop policy if exists "homework_media_student_insert" on storage.objects;
create policy "homework_media_student_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'homework-media'
    and (storage.foldername(name))[1] in ('submissions', 'tournament-submissions')
    and split_part(storage.filename(name), '_', 1) = (select auth.uid())::text
  );

-- Бакета avatars не было вовсе — смена фото в профиле всегда падала с ошибкой.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_own_select" on storage.objects;
create policy "avatars_own_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and name = (select auth.uid())::text || '.jpg');

drop policy if exists "avatars_own_insert" on storage.objects;
create policy "avatars_own_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and name = (select auth.uid())::text || '.jpg');

drop policy if exists "avatars_own_update" on storage.objects;
create policy "avatars_own_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and name = (select auth.uid())::text || '.jpg')
  with check (bucket_id = 'avatars' and name = (select auth.uid())::text || '.jpg');

-- 3) Профили (с email!), комментарии и работы на турнир читались без входа —
--    анонимным ключом, который виден в коде страницы. Оставляем чтение только
--    вошедшим пользователям.
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to authenticated using (true);

drop policy if exists "comments_select" on public.comments;
create policy "comments_select" on public.comments
  for select to authenticated using (true);

drop policy if exists "tour_sub_select" on public.tournament_submissions;
create policy "tour_sub_select" on public.tournament_submissions
  for select to authenticated using (true);

-- 4) Любой учитель мог менять и удалять чужие ДЗ и турниры — только свои.
drop policy if exists "homework_teacher_update" on public.homework;
create policy "homework_teacher_update" on public.homework
  for update to authenticated
  using (created_by = (select auth.uid()))
  with check (created_by = (select auth.uid()));

drop policy if exists "homework_teacher_delete" on public.homework;
create policy "homework_teacher_delete" on public.homework
  for delete to authenticated
  using (created_by = (select auth.uid()));

drop policy if exists "tournaments_teacher_update" on public.tournaments;
create policy "tournaments_teacher_update" on public.tournaments
  for update to authenticated
  using (created_by = (select auth.uid()))
  with check (created_by = (select auth.uid()));

drop policy if exists "tournaments_teacher_delete" on public.tournaments;
create policy "tournaments_teacher_delete" on public.tournaments
  for delete to authenticated
  using (created_by = (select auth.uid()));

-- 5) Ученик мог из консоли браузера записать себе любой total_xp / streak / email
--    (политика profiles_update разрешает менять свою строку целиком) и выйти
--    на первое место в рейтинге. Сайт начисляет XP только порциями до 200
--    (ЕНТ на 100 заданий × 2), а стрик меняет только на +1 или сбрасывает в 1.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
begin
  if current_user in ('authenticated', 'anon') then
    if new.role is distinct from old.role then
      raise exception 'role change is not allowed' using errcode = '42501';
    end if;
    if new.email is distinct from old.email then
      raise exception 'email change is not allowed' using errcode = '42501';
    end if;
    if new.total_xp is distinct from old.total_xp
       and (new.total_xp < coalesce(old.total_xp, 0) or new.total_xp - coalesce(old.total_xp, 0) > 200) then
      raise exception 'invalid xp change' using errcode = '42501';
    end if;
    if new.streak is distinct from old.streak
       and new.streak not in (0, 1, coalesce(old.streak, 0) + 1) then
      raise exception 'invalid streak change' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$function$;

-- 6) Данные: у админа и одного ученика класс сохранился как "NaN".
update public.profiles set grade = '' where grade = 'NaN';
