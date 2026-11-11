-- Безопасность, часть 2. Применять ПОСЛЕ выкладки кода, который привязывает
-- ребёнка через link_child_by_email: прямую вставку в parent_links закрываем.
drop policy if exists parent_links_insert_own on public.parent_links;
