import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

// Доступ в /api/admin/* даём только настоящим Supabase-пользователям с
// profiles.role = 'admin' — сессия читается из cookies запроса, отдельного
// токена/пароля для админки больше нет.
export async function requireAdmin(): Promise<NextResponse | null> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Доступ только для администратора' }, { status: 403 })
  }

  return null
}
