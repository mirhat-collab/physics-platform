-- Цели подготовки к ЕНТ: желаемый балл по предметам и задания в неделю
-- {"target": {"physics": 45, "math": 40}, "weekly": 100}
alter table public.profiles add column if not exists ent_goals jsonb;
