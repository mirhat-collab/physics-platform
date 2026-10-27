-- Домашнее задание из тренажёра ЕНТ: предмет, темы и сколько заданий решить.
-- {"subject": "physics", "topics": ["Сила Архимеда", …], "count": 20}
-- Выполнение считается по answer_log после created_at — отдельной таблицы не нужно.
alter table public.homework add column if not exists ent jsonb;
