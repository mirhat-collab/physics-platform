-- Telegram-бот: напоминания ученикам и недельный отчёт родителям.
-- Привязку создаёт только сервер (по одноразовому коду из профиля).
create table if not exists public.telegram_links (
  user_id uuid primary key references auth.users(id) on delete cascade,
  chat_id bigint not null,
  created_at timestamptz not null default now()
);
alter table public.telegram_links enable row level security;
create policy telegram_links_own_select on public.telegram_links for select to authenticated using (user_id = (select auth.uid()));
create policy telegram_links_own_delete on public.telegram_links for delete to authenticated using (user_id = (select auth.uid()));

create table if not exists public.telegram_link_codes (
  code text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null default now() + interval '30 minutes'
);
alter table public.telegram_link_codes enable row level security;
-- политик нет: коды читает и пишет только сервер
