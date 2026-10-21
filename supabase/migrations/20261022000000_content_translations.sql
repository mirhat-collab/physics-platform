-- Кэш ИИ-переводов учебного контента на казахский и английский.
-- Перевод делается один раз на язык; source_hash — хэш исходного русского
-- текста: если тему отредактировали, хэш не совпадёт и перевод обновится.
create table if not exists public.content_translations (
  kind text not null,
  ref_id bigint not null,
  locale text not null check (locale in ('kk', 'en')),
  source_hash text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (kind, ref_id, locale)
);
alter table public.content_translations enable row level security;
-- Политик нет намеренно: пишет и читает только сервер через service role.
