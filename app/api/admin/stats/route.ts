import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'
import { adminStats, type StatAnswer, type StatMock, type StatProfile } from '@/lib/admin-stats'

type Page<T> = { data: T[] | null; error: unknown }

// Supabase отдаёт не больше 1000 строк за запрос — читаем частями
async function all<T>(page: (from: number, to: number) => PromiseLike<Page<T>>): Promise<Page<T>> {
  const out: T[] = []
  for (let from = 0; from < 200000; from += 1000) {
    const { data, error } = await page(from, from + 999)
    if (error) return { data: null, error }
    out.push(...(data || []))
    if (!data || data.length < 1000) break
  }
  return { data: out, error: null }
}

// Статистика сайта для админа: данные всех пользователей читаем через
// service role (RLS отдаёт каждому только его собственные ответы)
export async function GET() {
  const denied = await requireAdmin()
  if (denied) return denied
  const admin = createSupabaseAdmin()
  const since = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString()
  const [profiles, answers, mocks] = await Promise.all([
    all<StatProfile>((a, b) => admin.from('profiles').select('id, role, full_name, email, grade, created_at').order('created_at').range(a, b)),
    all<StatAnswer>((a, b) => admin.from('answer_log').select('user_id, subject, topic, correct, created_at').gte('created_at', since).order('created_at').range(a, b)),
    all<StatMock>((a, b) => admin.from('ent_attempts').select('user_id, subject, score, max_score, correct, total, created_at').eq('section', 'mock').order('created_at').range(a, b)),
  ])
  const error = profiles.error || answers.error || mocks.error
  if (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Не удалось загрузить статистику' }, { status: 500 })
  }
  return NextResponse.json(adminStats(profiles.data || [], answers.data || [], mocks.data || []))
}
