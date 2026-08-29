import { createClient } from '@supabase/supabase-js'

// ВАЖНО: этот клиент использует service role key и обходит RLS/Storage policies.
// Используем его ТОЛЬКО на сервере (в API routes), никогда не импортируем в клиентский код.
export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    const missing = [
      !url && 'NEXT_PUBLIC_SUPABASE_URL',
      !serviceKey && 'SUPABASE_SERVICE_ROLE_KEY',
    ].filter(Boolean).join(', ')
    throw new Error(
      `Не задана переменная окружения: ${missing}. ` +
      'Добавь её в .env.local и в переменные окружения Vercel для Production ' +
      '(Project Settings → Environment Variables; значение service_role — из Supabase Project Settings → API).'
    )
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
