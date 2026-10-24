-- Баллы пробного ЕНТ: задания стоят по 1 или 2 балла, поэтому
-- число верных ответов не равно баллу. Колонки необязательные —
-- у обычных тренировок они пустые.
alter table public.ent_attempts add column if not exists score smallint;
alter table public.ent_attempts add column if not exists max_score smallint;
