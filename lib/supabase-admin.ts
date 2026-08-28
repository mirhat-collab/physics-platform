import { createClient } from '@supabase/supabase-js'

// ВАЖНО: этот клиент использует service role key и обходит RLS/Storage policies.
// Используем его ТОЛЬКО на сервере (в API routes), никогда не импортируем в клиентский код.
export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'Не заданы NEXT_PUBLIC_SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY. ' +
      'Добавь SUPABASE_SERVICE_ROLE_KEY в .env.local и в переменные окружения Vercel ' +
      '(Project Settings → API → service_role secret в Supabase).'
    )
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
